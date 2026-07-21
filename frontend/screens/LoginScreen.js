import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AuthScreenContainer,
  PasswordVisibilityToggle,
  PrimaryButton,
  UnderlineField,
  WayfinderBrand,
  authColors,
} from "./AuthShared";

export default function LoginScreen({
  onLogin,
  onNavigateForgotPassword,
  onNavigateSignup,
}) {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setStatusMessage("");
    setErrors({});

    try {
      const result = await onLogin?.({
        identity,
        password,
        rememberMe,
      });

      if (result?.ok) {
        setErrors({});
        setStatusMessage("");
        return;
      }

      if (!result) {
        setStatusMessage("Sign-in did not complete. Check that the app is connected to the API.");
        return;
      }

      const nextErrors = result.fieldErrors || {};
      setErrors(nextErrors);

      const fieldMessage = [nextErrors.identity, nextErrors.password].filter(Boolean).join(" ");
      setStatusMessage(result.message || fieldMessage || "Unable to sign in. Please try again.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in. Please try again.";
      setStatusMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenContainer>
      <WayfinderBrand />

      <View style={styles.heroBlock}>
        <Text style={styles.title}>Start your journey{"\n"}with Wayfinder!</Text>
        <Text style={styles.subtitle}>
          Sign in or create an account to plan smarter,{"\n"}
          safer trips.
        </Text>
      </View>

      <View style={styles.formBlock}>
        <UnderlineField
          label="Email or username"
          value={identity}
          onChangeText={(value) => {
            setIdentity(value);
            setErrors((currentErrors) => ({ ...currentErrors, identity: "" }));
            setStatusMessage("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.identity}
          helperColor={styles.errorText.color}
          underlineColor={errors.identity ? styles.errorText.color : authColors.accent}
        />

        <UnderlineField
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((currentErrors) => ({ ...currentErrors, password: "" }));
            setStatusMessage("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          secureTextEntry={!showPassword}
          helperText={errors.password}
          helperColor={styles.errorText.color}
          underlineColor={errors.password ? styles.errorText.color : authColors.accent}
          rightAccessory={
            <PasswordVisibilityToggle
              visible={showPassword}
              onPress={() => setShowPassword((currentValue) => !currentValue)}
            />
          }
        />

        <View style={styles.utilityRow}>
          <Pressable onPress={() => setRememberMe((currentValue) => !currentValue)} style={styles.rememberButton}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
              {rememberMe ? <Text style={styles.checkboxCheck}>✓</Text> : null}
            </View>
            <Text style={styles.utilityText}>Remember Me</Text>
          </Pressable>

          <Pressable onPress={onNavigateForgotPassword}>
            <Text style={styles.forgotLink}>Forgot Password ?</Text>
          </Pressable>
        </View>

        <PrimaryButton
          label={submitting ? "Signing in..." : "Log In"}
          onPress={handleLogin}
          disabled={submitting}
        />

        {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
      </View>

      <View style={styles.footerSpacer} />

      <View style={styles.footerRow}>
        <Text style={styles.footerPrompt}>Don't have an account?</Text>
        <Pressable onPress={onNavigateSignup}>
          <Text style={styles.footerAction}>Sign up</Text>
        </Pressable>
      </View>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    marginTop: 74,
  },

  title: {
    maxWidth: 350,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 42,
    letterSpacing: -1.3,
    color: authColors.heading,
  },

  subtitle: {
    marginTop: 30,
    maxWidth: 332,
    fontSize: 17,
    lineHeight: 26,
    color: authColors.accent,
  },

  formBlock: {
    marginTop: 104,
  },

  utilityRow: {
    marginTop: -6,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rememberButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: authColors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },

  checkboxSelected: {
    backgroundColor: authColors.accent,
  },

  checkboxCheck: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  utilityText: {
    fontSize: 16,
    color: authColors.accent,
  },

  forgotLink: {
    fontSize: 16,
    color: authColors.accent,
  },

  statusMessage: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: "#C53A36",
    textAlign: "center",
  },

  errorText: {
    color: "#C53A36",
  },

  footerSpacer: {
    flexGrow: 1,
    minHeight: 96,
  },

  footerRow: {
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },

  footerPrompt: {
    fontSize: 17,
    color: authColors.accent,
  },

  footerAction: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "800",
    color: authColors.button,
    letterSpacing: -0.4,
  },
});
