import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AuthScreenContainer,
  PrimaryButton,
  UnderlineField,
  WayfinderBrand,
  authColors,
} from "./AuthShared";

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
    marginTop: 104,
  },

  title: {
    maxWidth: 260,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 42,
    letterSpacing: -1.3,
    color: authColors.heading,
  },

  subtitle: {
    marginTop: 20,
    maxWidth: 334,
    fontSize: 17,
    lineHeight: 26,
    color: authColors.accent,
  },

  formBlock: {
    marginTop: 120,
  },

  statusMessage: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
  },

  successText: {
    color: "#16803C",
  },

  errorText: {
    color: "#C53A36",
  },

  footerSpacer: {
    flexGrow: 1,
    minHeight: 112,
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
