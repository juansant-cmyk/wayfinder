import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "../../theme/tokens";

// Large editorial screen header: back button, serif title, subtitle with a gold
// tail, and an optional hero illustration that sits to the right of the copy
// (sized to its native ratio so it never upscales — matches the Hotels header).
export default function FeatureHeader({
  title,
  subtitle,
  accentTail,
  onBack,
  hero,
  heroAspect = 2.2,
  heroWidth = 158,
}) {
  const copy = (
    <View style={hero ? styles.textColumn : null}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, hero && styles.subtitleCompact]}>
          {subtitle}
          {accentTail ? <Text style={styles.accent}> {accentTail}</Text> : null}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
      ) : null}

      {hero ? (
        <View style={styles.row}>
          {copy}
          <Image
            source={hero}
            resizeMode="contain"
            style={[styles.hero, { width: heroWidth, aspectRatio: heroAspect }]}
          />
        </View>
      ) : (
        copy
      )}
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
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    maxWidth: "58%",
    paddingBottom: 4,
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
  subtitleCompact: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  accent: {
    color: colors.gold,
    fontWeight: "600",
  },
  hero: {
    height: undefined,
    alignSelf: "flex-end",
    marginRight: -14,
    marginBottom: -6,
    flexShrink: 0,
  },
});
