import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { fetchMe, isBackendConfigured, login, register } from "./src/api/client";
import { clearToken, getToken, saveToken } from "./src/auth/tokenStorage";
import { getHashForScreen, getScreenFromHash } from "./src/navigation/screens";
import ChatScreen from "./screens/ChatScreen";
import DashboardFeatureScreen from "./screens/DashboardFeatureScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";

const SKIP_AUTH = process.env.EXPO_PUBLIC_SKIP_AUTH === "true";

const DEV_USER = {
  id: "dev-bypass",
  email: "dev@wayfinder.local",
  fullName: "Dev User",
};

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

function mapApiUser(apiUser, extras = {}) {
  return {
    id: apiUser.id,
    email: apiUser.email,
    createdAt: apiUser.created_at,
    fullName: extras.fullName || "",
    username: extras.username || "",
  };
}

function isWebPreview() {
  return Platform.OS === "web" && typeof window !== "undefined";
}

const FEATURE_SCREENS = new Set([
  "itinerary",
  "hotels",
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

export default function App() {
  const [bootstrapping, setBootstrapping] = useState(!SKIP_AUTH);
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (SKIP_AUTH) {
      return "home";
    }

    if (isWebPreview()) {
      return getScreenFromHash(window.location.hash);
    }

    return "login";
  });
  const [screenParams, setScreenParams] = useState({});
  const [currentUser, setCurrentUser] = useState(SKIP_AUTH ? DEV_USER : null);
  const lastWebHashRef = useRef("");

  useEffect(() => {
    if (SKIP_AUTH) {
      return undefined;
    }

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
    if (!isWebPreview() || SKIP_AUTH) {
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
    if (!isWebPreview() || SKIP_AUTH) {
      return;
    }

    const nextHash = getHashForScreen(currentScreen);

    if (nextHash === lastWebHashRef.current) {
      return;
    }

    window.history.pushState(
      { screen: currentScreen, params: screenParams },
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`
    );
    lastWebHashRef.current = nextHash;
  }, [currentScreen, screenParams]);

  const navigate = (screen, params = {}) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const navigateHome = () => {
    setScreenParams({});
    setCurrentScreen("home");
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

  const handleLogin = async ({ identity, password, rememberMe }) => {
    const normalizedIdentity = normalizeText(identity);
    const trimmedPassword = password.trim();

    if (!normalizedIdentity || !trimmedPassword) {
      return {
        ok: false,
        fieldErrors: {
          identity: !normalizedIdentity ? "Enter your username, email, or phone number." : "",
          password: !trimmedPassword ? "Enter your password." : "",
        },
      };
    }

    if (!isBackendConfigured()) {
      return {
        ok: false,
        message: "Backend URL is missing. Set EXPO_PUBLIC_API_URL in frontend/.env",
      };
    }

    if (!isEmail(normalizedIdentity)) {
      return {
        ok: false,
        fieldErrors: {
          identity: "Sign in with your email address for now.",
        },
      };
    }

    try {
      const data = await login(normalizedIdentity, trimmedPassword);

      if (rememberMe !== false) {
        await saveToken(data.access_token);
      } else {
        await clearToken();
      }

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
    const fieldErrors = {};

    if (!trimmedContact) {
      fieldErrors.contact = "Enter your email or phone number.";
    } else if (!isEmail(normalizedContact)) {
      fieldErrors.contact = "Use an email address to create your account for now.";
    }

    if (!trimmedFullName) {
      fieldErrors.fullName = "Enter your full name.";
    }

    if (!trimmedUsername) {
      fieldErrors.username = "Create a username.";
    } else if (trimmedUsername.length < 3) {
      fieldErrors.username = "Use at least 3 characters for your username.";
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
      const data = await register(normalizedContact, trimmedPassword);
      await saveToken(data.access_token);
      setCurrentUser(
        mapApiUser(data.user, {
          fullName: trimmedFullName,
          username: trimmedUsername,
        })
      );
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

  if (currentScreen === "login") {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onNavigateForgotPassword={navigateForgotPassword}
        onNavigateSignup={navigateSignup}
      />
    );
  }

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

  if (currentScreen === "chat") {
    return <ChatScreen onBack={navigateHome} />;
  }

  if (FEATURE_SCREENS.has(currentScreen)) {
    return (
      <DashboardFeatureScreen
        screen={currentScreen}
        params={screenParams}
        onBack={navigateHome}
        onNavigate={navigate}
        onLogout={SKIP_AUTH ? undefined : handleLogout}
      />
    );
  }

  return (
    <HomeScreen
      displayName={getDisplayName(currentUser)}
      onLogout={SKIP_AUTH ? undefined : handleLogout}
      onNavigate={navigate}
    />
  );
}
