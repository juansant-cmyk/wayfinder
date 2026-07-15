import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { colors, radius } from "../../theme/tokens";

// Real interactive map for iOS / Android. Android uses Google Maps (needs the
// key in app.json → android.config.googleMaps.apiKey); iOS falls back to Apple
// Maps (no key required). On web, MapCanvas.web.js renders a placeholder instead.
export default function MapCanvas({ region, places = [] }) {
  const markers = places.filter((p) => p.lat != null && p.lng != null);

  return (
    <View style={styles.wrap}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={region}
        showsUserLocation
      >
        {markers.map((place) => (
          <Marker
            key={place.id || place.name}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            title={place.name}
            description={place.category || place.address || ""}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
});
