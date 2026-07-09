import { StyleSheet } from "react-native";

import { colors, fonts, radius } from "../../theme/tokens";

export const cardStyles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },

  cardTitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },

  cardSubtitle: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },

  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    textAlign: "center",
    marginTop: 24,
  },

  metaText: {
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.gold,
  },
});
