import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  fetchMe,
  isApiConfigError,
  isApiRequestFailedError,
  isApiUnavailableError,
  isBackendConfigured,
  login,
  register,
  setUnauthorizedHandler,
} from "./src/api/client";
import {
  API_CONFIG_ERROR_MESSAGE,
  API_UNAVAILABLE_MESSAGE,
} from "./src/api/config";
import {
  clearSessionUser,
  clearToken,
  getSessionUser,
  getToken,
  saveSessionUser,
  saveToken,
} from "./src/auth/tokenStorage";
import { UserLocationProvider } from "./src/location/UserLocationContext";
import { getHashForScreen, getScreenFromHash } from "./src/navigation/screens";
import AIChatScreen from "./screens/AIChatScreen";
import DashboardFeatureScreen from "./screens/DashboardFeatureScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import FlightsScreen from "./screens/FlightsScreen";
import HomeScreen from "./screens/HomeScreen";
import HotelsScreen from "./screens/HotelsScreen";
import ItineraryScreen from "./screens/ItineraryScreen";
import LoginScreen from "./screens/LoginScreen";
import MapsScreen from "./screens/MapsScreen";
import SafetyScreen from "./screens/SafetyScreen";
import SignupScreen from "./screens/SignupScreen";
import WeatherScreen from "./screens/WeatherScreen";

const AUTH_ONLY_SCREENS = new Set(["login", "signup", "forgotPassword"]);
const DEV_PUBLIC_PREVIEW_SCREENS = new Set([
  "itinerary",
  "weather",
  "maps",
  "hotels",
  "flights",
  "favorites",
  "safety",
  "chat",
]);
const SIGN_IN_GENERIC_MESSAGE = "Something went wrong while signing in. Please try again.";

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
}

function getDisplayName(user) {
  if (!user) {
    return "Traveler";
  }

  const fullName = user.fullName?.trim();

  if (fullName) {
    return fullName.split(" ")[0];
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return user.username || "Traveler";
}

function isWebPreview() {
  return Platform.OS === "web" && typeof window !== "undefined";
}

function getRequestedWebScreen() {
  if (!isWebPreview()) {
    return null;
  }

  return getScreenFromHash(window.location.hash);
}

function canUseDevPublicPreview(screen) {
  return __DEV__ && isWebPreview() && DEV_PUBLIC_PREVIEW_SCREENS.has(screen);
}

function mapApiUser(apiUser) {
  return {
    id: apiUser.id,
    email: apiUser.email,
    createdAt: apiUser.created_at,
    fullName: apiUser.full_name || "",
    username: apiUser.username || "",
  };
}

const FEATURE_SCREENS = new Set([
  "itinerary",
  "trips",
  "flights",
  "favorites",
  "weather",
  "maps",
  "travelCheck",
  "profile",
  "notifications",
  "destination",
  "recommended",
]);

const BOTTOM_NAV_TAB_SCREENS = new Set([
  "itinerary",
  "flights",
  "favorites",
  "safety",
  "maps",
  "profile",
]);

export default function App() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (isWebPreview()) {
      const fromHash = getRequestedWebScreen();
      if (canUseDevPublicPreview(fromHash)) {
        return fromHash;
      }

      return AUTH_ONLY_SCREENS.has(fromHash) ? fromHash : "login";
    }

    return "login";
  });
  const [screenParams, setScreenParams] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const lastWebHashRef = useRef("");
  const historyActionRef = useRef("push");
  const initialScreenRef = useRef(currentScreen);
  const initialScreenParamsRef = useRef(screenParams);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await Promise.all([clearToken(), clearSessionUser()]);
      setCurrentUser(null);
      setScreenParams({});
      setCurrentScreen("login");
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const requestedScreen = getRequestedWebScreen();
      if (canUseDevPublicPreview(requestedScreen)) {
        if (!cancelled) {
          setBootstrapping(false);
        }
        return;
      }

      if (!isBackendConfigured()) {
        if (!cancelled) {
          setBootstrapping(false);
        }
        return;
      }

      try {
        const [token, cachedUser] = await Promise.all([getToken(), getSessionUser()]);

        if (!token) {
          return;
        }

        if (cachedUser && !cancelled) {
          setCurrentUser(cachedUser);
          if (canUseDevPublicPreview(requestedScreen)) {
            setCurrentScreen(requestedScreen);
          } else {
            setCurrentScreen("home");
          }
        }

        const user = await fetchMe(token);
        const mappedUser = mapApiUser(user);

        if (!cancelled) {
          setCurrentUser(mappedUser);
          await saveSessionUser(mappedUser);
          if (canUseDevPublicPreview(requestedScreen)) {
            setCurrentScreen(requestedScreen);
          } else {
            setCurrentScreen("home");
          }
        }
      } catch (error) {
        if (!isApiUnavailableError(error)) {
          await Promise.all([clearToken(), clearSessionUser()]);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isWebPreview()) {
      return undefined;
    }

    const syncFromBrowserHistory = () => {
      const state = window.history.state || {};
      const nextScreen = state.screen || getScreenFromHash(window.location.hash);
      lastWebHashRef.current = getHashForScreen(nextScreen);
      setScreenParams(state.params || {});
      setCurrentScreen(nextScreen);
    };

    const initialHash = getHashForScreen(initialScreenRef.current);

    window.history.replaceState(
      { screen: initialScreenRef.current, params: initialScreenParamsRef.current },
      "",
      `${window.location.pathname}${window.location.search}${initialHash}`
    );
    lastWebHashRef.current = initialHash;

    window.addEventListener("popstate", syncFromBrowserHistory);

    return () => {
      window.removeEventListener("popstate", syncFromBrowserHistory);
    };
  }, []);

  useEffect(() => {
    if (!isWebPreview()) {
      return;
    }

    const nextHash = getHashForScreen(currentScreen);

    if (nextHash === lastWebHashRef.current) {
      return;
    }

    window.history[historyActionRef.current === "replace" ? "replaceState" : "pushState"](
      { screen: currentScreen, params: screenParams },
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`
    );
    lastWebHashRef.current = nextHash;
    historyActionRef.current = "push";
  }, [currentScreen, screenParams]);

  const navigate = (screen, params = {}, { history = "push" } = {}) => {
    historyActionRef.current = history;
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const navigateFromTab = (screen) => {
    if (screen === "home") {
      navigate("home", {}, { history: "replace" });
      return;
    }

    const switchingTabs =
      BOTTOM_NAV_TAB_SCREENS.has(currentScreen) && BOTTOM_NAV_TAB_SCREENS.has(screen);

    navigate(screen, {}, { history: switchingTabs ? "replace" : "push" });
  };

  const handleNavigate = (screen, params = {}) => {
    const hasParams = Object.keys(params).length > 0;

    if (!hasParams && (screen === "home" || BOTTOM_NAV_TAB_SCREENS.has(screen))) {
      navigateFromTab(screen);
      return;
    }

    navigate(screen, params);
  };

  const navigateHome = () => {
    navigate("home", {}, { history: "replace" });
  };

  const navigateBack = () => {
    navigateHome();
  };

  const navigateHotels = () => {
    navigate("hotels");
  };

  const navigateLogin = () => {
    setCurrentScreen("login");
  };

  const navigateSignup = () => {
    setCurrentScreen("signup");
  };

  const navigateForgotPassword = () => {
    setCurrentScreen("forgotPassword");
  };

  const handleLogout = async () => {
    await Promise.all([clearToken(), clearSessionUser()]);
    setCurrentUser(null);
    setScreenParams({});
    setCurrentScreen("login");
  };

  const handleLogin = async ({ identity, password }) => {
    const trimmedIdentity = identity.trim();
    const trimmedPassword = password.trim();
    const normalizedIdentity = trimmedIdentity.includes("@")
      ? normalizeText(trimmedIdentity)
      : trimmedIdentity.toLowerCase();

    if (!normalizedIdentity || !trimmedPassword) {
      return {
        ok: false,
        fieldErrors: {
          identity: !normalizedIdentity ? "Enter your email or username." : "",
          password: !trimmedPassword ? "Enter your password." : "",
        },
      };
    }

    if (normalizedIdentity.includes("@") && !isEmail(normalizedIdentity)) {
      return {
        ok: false,
        fieldErrors: {
          identity: "Enter a valid email address.",
        },
      };
    }

    if (!normalizedIdentity.includes("@") && normalizedIdentity.length < 3) {
      return {
        ok: false,
        fieldErrors: {
          identity: "Usernames must be at least 3 characters.",
        },
      };
    }

    if (!isBackendConfigured()) {
      return {
        ok: false,
        message: API_CONFIG_ERROR_MESSAGE,
      };
    }

    try {
      const data = await login(normalizedIdentity, trimmedPassword);
      const mappedUser = mapApiUser(data.user);
      await Promise.all([saveToken(data.access_token), saveSessionUser(mappedUser)]);
      setCurrentUser(mappedUser);
      navigateHome();

      return {
        ok: true,
        user: data.user,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";

      if (isApiUnavailableError(error)) {
        return {
          ok: false,
          message: API_UNAVAILABLE_MESSAGE,
        };
      }

      if (isApiConfigError(error)) {
        return {
          ok: false,
          message: API_CONFIG_ERROR_MESSAGE,
        };
      }

      if (error?.status === 401 && message === "Invalid email or password") {
        return {
          ok: false,
          fieldErrors: {
            password: message,
          },
        };
      }

      if (error?.status === 422) {
        const identityError = error?.fieldErrors?.identity || "";
        const passwordError = error?.fieldErrors?.password || "";

        return {
          ok: false,
          fieldErrors: {
            identity: identityError,
            password: passwordError,
          },
          message: identityError || passwordError ? "" : SIGN_IN_GENERIC_MESSAGE,
        };
      }

      if (error?.status >= 500 || isApiRequestFailedError(error)) {
        return {
          ok: false,
          message: SIGN_IN_GENERIC_MESSAGE,
        };
      }

      return {
        ok: false,
        message,
      };
    }
  };

  const handleSignup = async ({
    contact,
    fullName,
    username,
    password,
    confirmPassword,
  }) => {
    const trimmedContact = contact.trim();
    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const normalizedContact = normalizeText(trimmedContact);
    const normalizedUsername = trimmedUsername.toLowerCase();
    const fieldErrors = {};

    if (!trimmedContact) {
      fieldErrors.contact = "Enter your email address.";
    } else if (!isEmail(normalizedContact)) {
      fieldErrors.contact = "Enter a valid email address.";
    }

    if (!trimmedFullName) {
      fieldErrors.fullName = "Enter your full name.";
    }

    if (!trimmedUsername) {
      fieldErrors.username = "Create a username.";
    } else if (normalizedUsername.length < 3) {
      fieldErrors.username = "Use at least 3 characters for your username.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      fieldErrors.username = "Use letters, numbers, and underscores only.";
    }

    if (!trimmedPassword) {
      fieldErrors.password = "Create a password.";
    } else if (trimmedPassword.length < 8) {
      fieldErrors.password = "Use at least 8 characters.";
    }

    if (!trimmedConfirmPassword) {
      fieldErrors.confirmPassword = "Confirm your password.";
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      fieldErrors.confirmPassword = "Your passwords do not match.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        fieldErrors,
      };
    }

    if (!isBackendConfigured()) {
      return {
        ok: false,
        message: API_CONFIG_ERROR_MESSAGE,
      };
    }

    try {
      const data = await register({
        email: normalizedContact,
        password: trimmedPassword,
        fullName: trimmedFullName,
        username: normalizedUsername,
      });
      const mappedUser = mapApiUser(data.user);
      await Promise.all([saveToken(data.access_token), saveSessionUser(mappedUser)]);
      setCurrentUser(mappedUser);
      navigateHome();

      return {
        ok: true,
        user: data.user,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account.";

      if (isApiUnavailableError(error)) {
        return {
          ok: false,
          message: API_UNAVAILABLE_MESSAGE,
        };
      }

      if (isApiConfigError(error)) {
        return {
          ok: false,
          message: API_CONFIG_ERROR_MESSAGE,
        };
      }

      if (message === "Email already registered") {
        return {
          ok: false,
          fieldErrors: {
            contact: "An account already exists for that email.",
          },
        };
      }

      if (message === "Username already taken") {
        return {
          ok: false,
          fieldErrors: {
            username: "That username is already taken.",
          },
        };
      }

      return {
        ok: false,
        message,
      };
    }
  };

  const handleForgotPassword = ({ identity }) => {
    const normalizedIdentity = normalizeText(identity);

    if (!normalizedIdentity) {
      return {
        ok: false,
        fieldErrors: {
          identity: "Enter your username, email, or phone number.",
        },
      };
    }

    return {
      ok: true,
      message: "If an account exists for those details, password reset instructions would be sent.",
    };
  };

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF7344" />
      </View>
    );
  }

  let screenContent;
  const isDevPreviewScreen = !currentUser && canUseDevPublicPreview(currentScreen);

  if (!currentUser && !isDevPreviewScreen) {
    if (currentScreen === "signup") {
      screenContent = <SignupScreen onSignup={handleSignup} onNavigateLogin={navigateLogin} />;
    } else if (currentScreen === "forgotPassword") {
      screenContent = (
        <ForgotPasswordScreen
          onForgotPassword={handleForgotPassword}
          onNavigateSignup={navigateSignup}
        />
      );
    } else {
      screenContent = (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateForgotPassword={navigateForgotPassword}
          onNavigateSignup={navigateSignup}
        />
      );
    }
  } else if (currentScreen === "chat") {
    screenContent = <AIChatScreen onNavigate={handleNavigate} onBack={navigateBack} />;
  } else if (currentScreen === "flights") {
    screenContent = (
      <FlightsScreen
        onGoBack={navigateBack}
        onNavigateHome={navigateHome}
        onNavigate={handleNavigate}
        params={screenParams}
      />
    );
  } else if (currentScreen === "favorites") {
    screenContent = (
      <FavoritesScreen
        onGoBack={navigateBack}
        onNavigateHome={navigateHome}
        onNavigate={handleNavigate}
      />
    );
  } else if (currentScreen === "hotels") {
    screenContent = (
      <HotelsScreen
        onGoBack={navigateBack}
        onNavigateHome={navigateHome}
        onNavigate={handleNavigate}
        params={screenParams}
        previewMode={isDevPreviewScreen}
      />
    );
  } else if (currentScreen === "itinerary") {
    screenContent = (
      <ItineraryScreen
        onNavigate={handleNavigate}
        onBack={navigateBack}
        params={screenParams}
      />
    );
  } else if (currentScreen === "maps") {
    screenContent = <MapsScreen onNavigate={handleNavigate} onBack={navigateBack} />;
  } else if (currentScreen === "safety") {
    screenContent = (
      <SafetyScreen
        onGoBack={navigateBack}
        onNavigateHome={navigateHome}
        onNavigate={handleNavigate}
      />
    );
  } else if (currentScreen === "weather") {
    screenContent = <WeatherScreen onNavigate={handleNavigate} />;
  } else if (FEATURE_SCREENS.has(currentScreen)) {
    screenContent = (
      <DashboardFeatureScreen
        screen={currentScreen}
        params={screenParams}
        onBack={navigateBack}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  } else {
    screenContent = (
      <HomeScreen
        displayName={getDisplayName(currentUser)}
        onNavigate={handleNavigate}
        onNavigateHotels={navigateHotels}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <UserLocationProvider>{screenContent}</UserLocationProvider>
    </SafeAreaProvider>
  );
}
