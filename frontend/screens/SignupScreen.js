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

export default function SignupScreen({ onSignup, onNavigateLogin }) {
  const [contact, setContact] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    setSubmitting(true);

    try {
      const result = await onSignup?.({
        contact,
        fullName,
        username,
        password,
        confirmPassword,
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
        <Text style={styles.title}>
          Save trips, compare{"\n"}
          options, and get{"\n"}
          smarter{"\n"}
          recommendations
        </Text>
        <Text style={styles.subtitle}>Create your Wayfinder account</Text>
      </View>

      <View style={styles.formBlock}>
        <UnderlineField
          label="Email address"
          value={contact}
          onChangeText={(value) => {
            setContact(value);
            setErrors((currentErrors) => ({ ...currentErrors, contact: "" }));
            setStatusMessage("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          helperText={errors.contact}
          helperColor={styles.errorText.color}
          underlineColor={errors.contact ? styles.errorText.color : authColors.accentMuted}
        />

        <UnderlineField
          label="Full Name"
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            setErrors((currentErrors) => ({ ...currentErrors, fullName: "" }));
            setStatusMessage("");
          }}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
          helperText={errors.fullName}
          helperColor={styles.errorText.color}
          underlineColor={errors.fullName ? styles.errorText.color : authColors.accentMuted}
        />

        <UnderlineField
          label="Username"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setErrors((currentErrors) => ({ ...currentErrors, username: "" }));
            setStatusMessage("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          helperText={errors.username}
          helperColor={styles.errorText.color}
          underlineColor={errors.username ? styles.errorText.color : authColors.accentMuted}
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
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry={!showPassword}
          underlineColor={errors.password ? styles.errorText.color : authColors.accentMuted}
          helperText={errors.password || "Must be at least 8 characters"}
          helperColor={errors.password ? styles.errorText.color : authColors.accent}
          rightAccessory={
            <PasswordVisibilityToggle
              visible={showPassword}
              onPress={() => setShowPassword((currentValue) => !currentValue)}
            />
          }
        />

        <UnderlineField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrors((currentErrors) => ({ ...currentErrors, confirmPassword: "" }));
            setStatusMessage("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry={!showConfirmPassword}
          underlineColor={errors.confirmPassword ? styles.errorText.color : authColors.accentMuted}
          helperText={errors.confirmPassword || "Must be at least 8 characters"}
          helperColor={errors.confirmPassword ? styles.errorText.color : authColors.accent}
          rightAccessory={
            <PasswordVisibilityToggle
              visible={showConfirmPassword}
              onPress={() => setShowConfirmPassword((currentValue) => !currentValue)}
            />
          }
        />

        <PrimaryButton label={submitting ? "Creating account..." : "Sign Up"} onPress={handleSignup} />

        {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
      </View>

      <View style={styles.footerSpacer} />

      <View style={styles.footerRow}>
        <Text style={styles.footerPrompt}>Already have an account?</Text>
        <Pressable onPress={onNavigateLogin}>
          <Text style={styles.footerAction}>Log in</Text>
        </Pressable>
      </View>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    marginTop: 54,
  },

  title: {
    maxWidth: 338,
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -1.2,
    color: authColors.heading,
  },

  subtitle: {
    marginTop: 22,
    fontSize: 17,
    lineHeight: 24,
    color: authColors.accent,
  },

  formBlock: {
    marginTop: 82,
  },

  statusMessage: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: authColors.body,
  },

  errorText: {
    color: "#C53A36",
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
