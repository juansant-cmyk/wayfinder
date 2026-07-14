import { StyleSheet } from "react-native";

export const cardStyles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14253E",
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
    marginTop: 24,
  },

  metaText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#1F78FF",
  },
});
