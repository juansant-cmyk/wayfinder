import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, spacing } from "../../theme/tokens";

// Web fallback: react-native-maps doesn't render on web, so we show a
// data-driven placeholder (pins from the real results). The interactive map
// (MapCanvas.native.js) renders on iOS / Android.
const PIN_SPOTS = [
  { top: "16%", left: "18%" },
  { top: "30%", left: "60%" },
  { top: "52%", left: "34%" },
  { top: "62%", left: "72%" },
  { top: "72%", left: "14%" },
];

export default function MapCanvas({ places = [], radiusKm, placesStatus }) {
  const pins = places.slice(0, PIN_SPOTS.length);

  return (
    <View style={styles.mapCard}>
      {pins.map((place, i) => (
        <View key={place.id || place.name} style={[styles.pin, PIN_SPOTS[i]]}>
          <Ionicons name="location" size={15} color={colors.navy} />
          <Text style={styles.pinText} numberOfLines={1}>{place.name}</Text>
        </View>
      ))}
      <View style={styles.mapCaption}>
        <Ionicons name="map-outline" size={13} color={colors.muted} />
        <Text style={styles.mapCaptionText}>
          {placesStatus === "done"
            ? `${places.length} place${places.length === 1 ? "" : "s"} within ${radiusKm} km`
            : "Map preview (live map on device)"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
    overflow: "hidden",
  },
  pin: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    maxWidth: 150,
  },
  pinText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "600", color: colors.ink },
  mapCaption: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  mapCaptionText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
});
