import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AuthScreenContainer,
  PrimaryButton,
  UnderlineField,
  WayfinderBrand,
  authColors,
} from "./AuthShared";
import { colors, fonts } from "../theme/tokens";

export default function ForgotPasswordScreen({ onForgotPassword, onNavigateSignup }) {
  const [identity, setIdentity] = useState("");
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("default");

  const handleForgotPassword = () => {
    const result = onForgotPassword?.({ identity });

    if (result?.ok) {
      setErrors({});
      setStatusMessage(result.message || "");
      setStatusTone("success");
      return;
    }

    setErrors(result?.fieldErrors || {});
    setStatusMessage(result?.message || "");
    setStatusTone("error");
  };

  return (
    <AuthScreenContainer>
      <WayfinderBrand />

      <View style={styles.heroBlock}>
        <Text style={styles.title}>Forgot your{"\n"}password?</Text>
        <Text style={styles.subtitle}>
          No worries - enter your username, email, or{"\n"}
          phone number and we'll send a reset link.
        </Text>
      </View>

      <View style={styles.formBlock}>
        <UnderlineField
          label="Username, Email or Phone Number"
          value={identity}
          onChangeText={(value) => {
            setIdentity(value);
            setErrors((currentErrors) => ({ ...currentErrors, identity: "" }));
            setStatusMessage("");
            setStatusTone("default");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.identity}
          helperColor={styles.errorText.color}
          underlineColor={errors.identity ? styles.errorText.color : authColors.accentMuted}
        />

        <PrimaryButton label="Forgot Password" onPress={handleForgotPassword} />

        {statusMessage ? (
          <Text
            style={[
              styles.statusMessage,
              statusTone === "success" ? styles.successText : styles.errorText,
            ]}
          >
            {statusMessage}
          </Text>
        ) : null}
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
    marginTop: 72,
  },

  title: {
    maxWidth: 260,
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.3,
    color: authColors.heading,
  },

  subtitle: {
    marginTop: 16,
    maxWidth: 334,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    color: colors.muted,
  },

  formBlock: {
    marginTop: 48,
  },

  statusMessage: {
    marginTop: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },

  successText: {
    color: "#3E6B4A",
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
