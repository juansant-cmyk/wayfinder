import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { fetchMe, isBackendConfigured, login, register, setUnauthorizedHandler } from "./src/api/client";
import { clearToken, getToken, saveToken } from "./src/auth/tokenStorage";
import { UserLocationProvider } from "./src/location/UserLocationContext";
import { getHashForScreen, getScreenFromHash } from "./src/navigation/screens";
import ChatScreen from "./screens/ChatScreen";
import DashboardFeatureScreen from "./screens/DashboardFeatureScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import HotelsScreen from "./screens/HotelsScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";

const AUTH_ONLY_SCREENS = new Set(["login", "signup", "forgotPassword"]);

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
  "flights",
  "favorites",
  "safety",
  "weather",
  "maps",
  "travelCheck",
  "profile",
  "notifications",
  "destination",
  "recommended",
]);

const BOTTOM_NAV_TAB_SCREENS = new Set(["itinerary", "favorites", "profile"]);

export default function App() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (isWebPreview()) {
      const fromHash = getScreenFromHash(window.location.hash);
      return AUTH_ONLY_SCREENS.has(fromHash) ? fromHash : "login";
    }

    return "login";
  });
  const [screenParams, setScreenParams] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const lastWebHashRef = useRef("");
  const historyActionRef = useRef("push");

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearToken();
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
      if (!isBackendConfigured()) {
        if (!cancelled) {
          setBootstrapping(false);
        }
        return;
      }

      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const user = await fetchMe(token);

        if (!cancelled) {
          setCurrentUser(mapApiUser(user));
          setCurrentScreen("home");
        }
      } catch (error) {
        await clearToken();
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

    const initialHash = getHashForScreen(currentScreen);

    window.history.replaceState(
      { screen: currentScreen, params: screenParams },
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
    await clearToken();
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
        message: "Backend URL is missing. Set EXPO_PUBLIC_API_URL in frontend/.env",
      };
    }

    try {
      const data = await login(normalizedIdentity, trimmedPassword);
      await saveToken(data.access_token);
      setCurrentUser(mapApiUser(data.user));
      navigateHome();

      return {
        ok: true,
        user: data.user,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";

      if (message === "Invalid email or password") {
        return {
          ok: false,
          fieldErrors: {
            password: message,
          },
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
        message: "Backend URL is missing. Set EXPO_PUBLIC_API_URL in frontend/.env",
      };
    }

    try {
      const data = await register({
        email: normalizedContact,
        password: trimmedPassword,
        fullName: trimmedFullName,
        username: normalizedUsername,
      });
      await saveToken(data.access_token);
      setCurrentUser(mapApiUser(data.user));
      navigateHome();

      return {
        ok: true,
        user: data.user,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account.";

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

  if (!currentUser) {
    if (currentScreen === "signup") {
      return <SignupScreen onSignup={handleSignup} onNavigateLogin={navigateLogin} />;
    }

    if (currentScreen === "forgotPassword") {
      return (
        <ForgotPasswordScreen
          onForgotPassword={handleForgotPassword}
          onNavigateSignup={navigateSignup}
        />
      );
    }

    return (
      <LoginScreen
        onLogin={handleLogin}
        onNavigateForgotPassword={navigateForgotPassword}
        onNavigateSignup={navigateSignup}
      />
    );
  }

  let screenContent;

  if (currentScreen === "chat") {
    screenContent = <ChatScreen onBack={navigateBack} onNavigate={handleNavigate} />;
  } else if (currentScreen === "hotels") {
    screenContent = (
      <HotelsScreen
        onGoBack={navigateBack}
        onNavigateHome={navigateHome}
        onNavigate={handleNavigate}
        params={screenParams}
      />
    );
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

  return <UserLocationProvider>{screenContent}</UserLocationProvider>;
}
