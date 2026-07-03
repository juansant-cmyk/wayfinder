import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";

const AUTH_STORAGE_KEY = "wayfinder.mockAuth";

let nativeAuthCache = {
  accounts: [],
  currentUser: null,
};

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function getDisplayName(account) {
  if (!account) {
    return "Traveler";
  }

  const fullName = account.fullName?.trim();

  if (fullName) {
    return fullName.split(" ")[0];
  }

  return account.username || "Traveler";
}

function isWebPreview() {
  return Platform.OS === "web" && typeof window !== "undefined";
}

function getScreenFromHash(hash) {
  switch (hash) {
    case "#signup":
      return "signup";
    case "#forgot-password":
      return "forgotPassword";
    case "#home":
      return "home";
    case "#login":
    default:
      return "login";
  }
}

function getHashForScreen(screen) {
  switch (screen) {
    case "signup":
      return "#signup";
    case "forgotPassword":
      return "#forgot-password";
    case "home":
      return "#home";
    case "login":
    default:
      return "#login";
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStoredAuthState() {
  const fallbackState = {
    accounts: nativeAuthCache.accounts,
    currentUser: nativeAuthCache.currentUser,
  };

  if (!isWebPreview()) {
    return fallbackState;
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawValue) {
      return fallbackState;
    }

    const parsedValue = JSON.parse(rawValue);
    const accounts = Array.isArray(parsedValue?.accounts) ? parsedValue.accounts : [];
    const currentUser = isPlainObject(parsedValue?.currentUser) ? parsedValue.currentUser : null;
    const currentUserExists = currentUser
      ? accounts.some((account) => account?.id === currentUser.id)
      : false;

    return {
      accounts,
      currentUser: currentUserExists ? currentUser : null,
    };
  } catch (error) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return fallbackState;
  }
}

function setStoredAuthState(accounts, currentUser) {
  nativeAuthCache = {
    accounts,
    currentUser,
  };

  if (!isWebPreview()) {
    return;
  }

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accounts,
      currentUser,
    })
  );
}

export default function App() {
  const initialAuthState = useRef(getStoredAuthState()).current;
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (!isWebPreview()) {
      return "login";
    }

    return getScreenFromHash(window.location.hash);
  });
  const [currentUser, setCurrentUser] = useState(initialAuthState.currentUser);
  const [accounts, setAccounts] = useState(initialAuthState.accounts);
  const lastWebHashRef = useRef("");

  useEffect(() => {
    if (!isWebPreview()) {
      return undefined;
    }

    const syncFromBrowserHistory = () => {
      const nextScreen = getScreenFromHash(window.location.hash);
      lastWebHashRef.current = getHashForScreen(nextScreen);
      setCurrentScreen(nextScreen);
    };

    const initialHash = getHashForScreen(currentScreen);

    window.history.replaceState(
      { screen: currentScreen },
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

    window.history.pushState(
      { screen: currentScreen },
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`
    );
    lastWebHashRef.current = nextHash;
  }, [currentScreen]);

  const navigateHome = () => {
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

  const handleLogout = () => {
    setCurrentUser(null);
    setStoredAuthState(accounts, null);
    setCurrentScreen("login");
  };

  const handleLogin = ({ identity, password, rememberMe }) => {
    const normalizedIdentity = normalizeText(identity);
    const normalizedPassword = password.trim();

    if (!normalizedIdentity || !normalizedPassword) {
      return {
        ok: false,
        fieldErrors: {
          identity: !normalizedIdentity ? "Enter your username, email, or phone number." : "",
          password: !normalizedPassword ? "Enter your password." : "",
        },
      };
    }

    const identityPhone = normalizePhone(identity);

    const matchingAccount = accounts.find((account) => {
      const matchesUsername =
        normalizeText(account.username || "") === normalizedIdentity;
      const matchesEmail =
        normalizeText(account.email || "") === normalizedIdentity;
      const matchesPhone =
        Boolean(identityPhone) &&
        normalizePhone(account.phone || "") === identityPhone;

      return matchesUsername || matchesEmail || matchesPhone;
    });

    if (!matchingAccount) {
      return {
        ok: false,
        fieldErrors: {
          identity: "We couldn't find an account with that username, email, or phone number.",
        },
      };
    }

    if (matchingAccount.password !== password) {
      return {
        ok: false,
        fieldErrors: {
          password: "That password doesn't match this account.",
        },
      };
    }

    setCurrentUser(matchingAccount);
    setStoredAuthState(accounts, rememberMe ? matchingAccount : null);
    navigateHome();

    return {
      ok: true,
      user: matchingAccount,
    };
  };

  const handleSignup = ({
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
    const normalizedUsername = normalizeText(trimmedUsername);
    const phoneDigits = normalizePhone(trimmedContact);
    const isEmail = normalizedContact.includes("@");
    const fieldErrors = {};

    if (!trimmedContact) {
      fieldErrors.contact = "Enter your email or phone number.";
    } else if (!isEmail && phoneDigits.length < 10) {
      fieldErrors.contact = "Use a valid email address or a 10-digit phone number.";
    } else if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContact)) {
      fieldErrors.contact = "Enter a valid email address.";
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
    } else if (!/\d/.test(trimmedPassword) || trimmedPassword.length < 6) {
      fieldErrors.password = "Use at least 6 characters and include a number.";
    }

    if (!trimmedConfirmPassword) {
      fieldErrors.confirmPassword = "Confirm your password.";
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      fieldErrors.confirmPassword = "Your passwords do not match.";
    }

    const usernameTaken = accounts.some(
      (account) => normalizeText(account.username || "") === normalizedUsername
    );
    const emailTaken =
      isEmail &&
      accounts.some(
        (account) => normalizeText(account.email || "") === normalizedContact
      );
    const phoneTaken =
      !isEmail &&
      phoneDigits.length > 0 &&
      accounts.some(
        (account) => normalizePhone(account.phone || "") === phoneDigits
      );

    if (!fieldErrors.username && usernameTaken) {
      fieldErrors.username = "That username is already taken.";
    }

    if (!fieldErrors.contact && emailTaken) {
      fieldErrors.contact = "An account already exists for that email.";
    }

    if (!fieldErrors.contact && phoneTaken) {
      fieldErrors.contact = "An account already exists for that phone number.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        fieldErrors,
      };
    }

    const newAccount = {
      id: `${Date.now()}`,
      fullName: trimmedFullName,
      username: trimmedUsername,
      password: trimmedPassword,
      email: isEmail ? trimmedContact : "",
      phone: isEmail ? "" : trimmedContact,
    };

    const updatedAccounts = [...accounts, newAccount];

    setAccounts(updatedAccounts);
    setCurrentUser(newAccount);
    setStoredAuthState(updatedAccounts, newAccount);
    navigateHome();

    return {
      ok: true,
      user: newAccount,
    };
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

    const identityPhone = normalizePhone(identity);

    const matchingAccount = accounts.find((account) => {
      const matchesUsername =
        normalizeText(account.username || "") === normalizedIdentity;
      const matchesEmail =
        normalizeText(account.email || "") === normalizedIdentity;
      const matchesPhone =
        Boolean(identityPhone) &&
        normalizePhone(account.phone || "") === identityPhone;

      return matchesUsername || matchesEmail || matchesPhone;
    });

    if (!matchingAccount) {
      return {
        ok: false,
        fieldErrors: {
          identity: "We couldn't find an account with those details yet.",
        },
      };
    }

    const recoveryTarget =
      matchingAccount.email || matchingAccount.phone || matchingAccount.username;

    return {
      ok: true,
      message: `Password reset instructions would be sent to ${recoveryTarget}.`,
    };
  };

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

  return (
    <HomeScreen
      currentUser={currentUser}
      displayName={getDisplayName(currentUser)}
      onLogout={handleLogout}
      onNavigateLogin={!currentUser ? navigateLogin : undefined}
      onNavigateSignup={!currentUser ? navigateSignup : undefined}
    />
  );
}
