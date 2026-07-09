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
import { colors, fonts } from "../theme/tokens";

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
    setSubmitting(true);

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

      setErrors(result?.fieldErrors || {});
      setStatusMessage(result?.message || "");
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

        <PrimaryButton label={submitting ? "Signing in..." : "Log In"} onPress={handleLogin} />

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
    marginTop: 64,
  },

  title: {
    maxWidth: 350,
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.3,
    color: authColors.heading,
  },

  subtitle: {
    marginTop: 18,
    maxWidth: 332,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    color: colors.muted,
  },

  formBlock: {
    marginTop: 56,
  },

  utilityRow: {
    marginTop: 2,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rememberButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 4,
    borderColor: colors.faint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },

  checkboxSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },

  checkboxCheck: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  utilityText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
  },

  forgotLink: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "600",
    color: colors.gold,
  },

  statusMessage: {
    marginTop: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
  },

  errorText: {
    color: colors.danger,
  },

  footerSpacer: {
    flexGrow: 1,
    minHeight: 72,
  },

  footerRow: {
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },

  footerPrompt: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.muted,
  },

  footerAction: {
    marginLeft: 8,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
});
