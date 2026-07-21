import { forwardRef, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

const COLORS = {
  border: "#D6E4F8",
  card: "#F8FBFF",
};

// Apple Maps on iOS; Google Maps on Android (key in app.json). Web uses MapCanvas.web.js.
const MapCanvas = forwardRef(function MapCanvas({ region, style }, ref) {
  const mapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion(nextRegion, duration = 450) {
      if (!nextRegion) return;
      mapRef.current?.animateToRegion(nextRegion, duration);
    },
  }));

  if (!region) {
    return <View style={[styles.wrap, style, styles.empty]} />;
  }

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
      />
    </View>
  );
});

export default MapCanvas;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: COLORS.card,
  },

  empty: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
