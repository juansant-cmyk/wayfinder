import { forwardRef, useImperativeHandle } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

const COLORS = {
  border: "#D6E4F8",
  card: "#F8FBFF",
  subtext: "#51607D",
};

const wideMapArtworkImage = require("../../assets/images/maps/maps-static-map-wide.png");

const MapCanvas = forwardRef(function MapCanvas({ locationLabel, style }, ref) {
  useImperativeHandle(ref, () => ({
    animateToRegion() {},
  }));

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
});

export default MapCanvas;

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
