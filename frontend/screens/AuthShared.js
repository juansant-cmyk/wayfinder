import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, fonts, radius } from "../theme/tokens";

export const authColors = {
  background: colors.paper,
  accent: colors.gold,
  accentMuted: colors.faint,
  button: colors.navy,
  buttonText: colors.onDark,
  heading: colors.ink,
  body: colors.ink,
};

export function AuthScreenContainer({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageInner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function WayfinderBrand() {
  return (
    <View style={styles.brandRow}>
      <Ionicons name="compass-outline" size={24} color={colors.gold} />
      <Text style={styles.brandText}>Wayfinder</Text>
    </View>
  );
}

export function UnderlineField({
  label,
  value,
  onChangeText,
  helperText,
  helperColor = authColors.accentMuted,
  underlineColor = colors.line,
  rightAccessory = null,
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry = false,
  keyboardType = "default",
  textContentType,
  autoComplete,
  inputMode,
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldWrap, { borderBottomColor: underlineColor }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={styles.textInput}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            textContentType={textContentType}
            autoComplete={autoComplete}
            inputMode={inputMode}
            selectionColor={colors.gold}
            placeholderTextColor={colors.faint}
          />

          {rightAccessory}
        </View>
      </View>

      {helperText ? <Text style={[styles.helperText, { color: helperColor }]}>{helperText}</Text> : null}
    </View>
  );
}

export function PasswordVisibilityToggle({ visible, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? "Hide password" : "Show password"}
      hitSlop={10}
      onPress={onPress}
      style={styles.visibilityButton}
    >
      <Ionicons
        name={visible ? "eye-off-outline" : "eye-outline"}
        size={20}
        color={colors.faint}
      />
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.background,
  },

  scrollView: {
    flex: 1,
    backgroundColor: authColors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
  },

  pageInner: {
    width: "100%",
    maxWidth: 440,
    flexGrow: 1,
  },

  brandRow: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  brandText: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 0.2,
  },

  fieldGroup: {
    marginBottom: 24,
  },

  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.gold,
    marginBottom: 6,
  },

  fieldWrap: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },

  inputRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    minHeight: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
  },

  helperText: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.faint,
  },

  visibilityButton: {
    marginLeft: 10,
    paddingLeft: 6,
    paddingVertical: 2,
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: radius.sm,
    backgroundColor: authColors.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#23324A",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: "#23324A",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },

  primaryButtonText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "700",
    color: authColors.buttonText,
    letterSpacing: 0.3,
  },
});
