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

export const authColors = {
  background: "#EAF2FC",
  accent: "#FF7048",
  accentMuted: "#B8C1CF",
  button: "#37374A",
  buttonText: "#F8F5EE",
  heading: "#20283D",
  body: "#2D3A53",
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
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <View style={styles.pageInner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function WayfinderBrand({ containerStyle, textStyle }) {
  return (
    <View style={[styles.brandRow, containerStyle]}>
      <View style={styles.logoMark}>
        <View style={styles.logoPinTop} />
        <View style={styles.logoPinTail} />
        <View style={styles.logoCore}>
          <Ionicons name="navigate" size={15} color="#FF7344" style={styles.logoNeedle} />
        </View>
        <Ionicons name="sparkles" size={12} color="#FF8D58" style={styles.logoSpark} />
      </View>

      <Text style={[styles.brandText, textStyle]}>Wayfinder</Text>
    </View>
  );
}

export function UnderlineField({
  label,
  value,
  onChangeText,
  helperText,
  helperColor = authColors.accent,
  underlineColor = authColors.accent,
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
      <View style={[styles.fieldWrap, { borderBottomColor: underlineColor }]}>
        <Text style={styles.fieldLabel}>{label}</Text>

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
            selectionColor={authColors.accent}
            placeholderTextColor="#9CA8BB"
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
        size={22}
        color="#B2BAC7"
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30,
    alignItems: "center",
  },

  pageInner: {
    width: "100%",
    maxWidth: 440,
    flexGrow: 1,
  },

  glowTop: {
    position: "absolute",
    top: 72,
    left: -42,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(255, 224, 152, 0.28)",
  },

  glowBottom: {
    position: "absolute",
    right: -54,
    bottom: 24,
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: "rgba(255, 224, 152, 0.24)",
  },

  brandRow: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },

  logoMark: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logoPinTop: {
    position: "absolute",
    top: 2,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#65B5FF",
  },

  logoPinTail: {
    position: "absolute",
    bottom: 3,
    width: 15,
    height: 15,
    backgroundColor: "#65B5FF",
    transform: [{ rotate: "45deg" }],
  },

  logoCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  logoNeedle: {
    marginLeft: 1,
    transform: [{ rotate: "18deg" }],
  },

  logoSpark: {
    position: "absolute",
    top: -1,
    right: -2,
    zIndex: 3,
  },

  brandText: {
    marginLeft: 10,
    fontSize: 25,
    fontWeight: "700",
    color: "#14253E",
    letterSpacing: -0.8,
  },

  fieldGroup: {
    marginBottom: 26,
  },

  fieldWrap: {
    borderBottomWidth: 2,
    paddingBottom: 8,
  },

  fieldLabel: {
    fontSize: 16,
    color: authColors.accent,
    lineHeight: 21,
  },

  inputRow: {
    marginTop: 6,
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    minHeight: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 18,
    color: authColors.body,
  },

  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: authColors.accent,
  },

  visibilityButton: {
    marginLeft: 10,
    paddingLeft: 6,
    paddingVertical: 2,
  },

  primaryButton: {
    minHeight: 66,
    borderRadius: 4,
    backgroundColor: authColors.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#1F2937",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 5,
      },
      default: {
        shadowColor: "#1F2937",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },

  primaryButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: authColors.buttonText,
    letterSpacing: -0.5,
  },
});
