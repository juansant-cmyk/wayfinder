import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

const COLORS = {
  border: "#D6E4F8",
  card: "#F8FBFF",
  text: "#10213B",
  subtext: "#51607D",
};

const wideMapArtworkImage = require("../../assets/images/maps/maps-static-map-wide.png");

// react-native-maps does not render on web — keep Ally artwork as preview.
export default function MapCanvas({ locationLabel, style }) {
  return (
    <View style={[styles.mapCard, style]}>
      <Image source={wideMapArtworkImage} resizeMode="cover" style={styles.mapArtwork} />
      <View style={styles.mapCaption}>
        <Ionicons name="map-outline" size={13} color={COLORS.subtext} />
        <Text style={styles.mapCaptionText}>
          {locationLabel ? `${locationLabel} · ` : ""}
          Live map on iOS / Android
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    position: "relative",
  },

  mapArtwork: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  mapCaption: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  },

  mapCaptionText: {
    fontSize: 11,
    color: COLORS.subtext,
  },
});
