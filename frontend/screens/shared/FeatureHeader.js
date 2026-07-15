import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "../../theme/tokens";

// Large editorial screen header: back button, serif title, subtitle with a gold tail.
export default function FeatureHeader({ title, subtitle, accentTail, onBack }) {
  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle}>
          {subtitle}
          {accentTail ? <Text style={styles.accent}> {accentTail}</Text> : null}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    marginLeft: -8,
    marginBottom: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  accent: {
    color: colors.gold,
    fontWeight: "600",
  },
});
