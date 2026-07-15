import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as dashboardApi from "../src/api/dashboard";
import { mapPlaceForDashboard } from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { DEFAULT_LAT, DEFAULT_LNG, reverseGeocodeLabel } from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";
import FeatureHeader from "./shared/FeatureHeader";
import MapCanvas from "./shared/MapCanvas";
import { colors, fonts, radius, spacing, tint } from "../theme/tokens";

const RADIUS_OPTIONS = [1, 5, 10, 25];

export default function MapsScreen({ onBack }) {
  const { location, status, refreshLocation } = useUserLocation();
  const [radiusKm, setRadiusKm] = useState(5);
  const [places, setPlaces] = useState([]);
  const [placesStatus, setPlacesStatus] = useState("loading"); // loading | done | empty | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [reloadKey, setReloadKey] = useState(0);

  const lat = location?.lat ?? DEFAULT_LAT;
  const lng = location?.lng ?? DEFAULT_LNG;

  // Resolve a human-readable label for the active coordinates.
  useEffect(() => {
    let cancelled = false;

    async function label() {
      if (!location && status === "loading") {
        setLocationLabel("Locating…");
        return;
      }
      try {
        const resolved = await reverseGeocodeLabel(lat, lng);
        if (!cancelled) setLocationLabel(resolved || "Selected area");
      } catch {
        if (!cancelled) setLocationLabel(location ? "Current location" : "Default area");
      }
    }

    label();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, location, status]);

  // Fetch popular places whenever location, radius, or a manual reload changes.
  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setPlacesStatus("loading");
      setErrorMsg(null);

      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setPlacesStatus("error");
            setErrorMsg("Sign in to see nearby places.");
          }
          return;
        }

        const raw = await dashboardApi.fetchPopularPlaces(token, lat, lng, radiusKm, 20);
        const mapped = (Array.isArray(raw) ? raw : []).map((place) => ({
          ...mapPlaceForDashboard(place),
          lat: place.lat ?? place.latitude ?? null,
          lng: place.lng ?? place.longitude ?? null,
        }));

        if (cancelled) return;
        setPlaces(mapped);
        setPlacesStatus(mapped.length ? "done" : "empty");
      } catch (loadError) {
        if (!cancelled) {
          setPlacesStatus("error");
          setErrorMsg(loadError instanceof Error ? loadError.message : "Couldn't load places.");
        }
      }
    }

    loadPlaces();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusKm, reloadKey]);

  const regionDelta = Math.max((radiusKm * 2) / 111, 0.02);
  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: regionDelta,
    longitudeDelta: regionDelta,
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader
          title="Maps"
          subtitle="Find popular places near you."
          onBack={onBack}
        />

        {/* Location + radius */}
        <View style={styles.controlCard}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={colors.navy} />
            <View style={styles.locationCopy}>
              <Text style={styles.locationLabel} numberOfLines={1}>{locationLabel}</Text>
              <Text style={styles.locationMeta}>
                {status === "granted" ? "Using your location" : "Default location"}
              </Text>
            </View>
            <Pressable style={styles.useLocation} onPress={refreshLocation}>
              <Ionicons name="locate-outline" size={15} color={colors.gold} />
              <Text style={styles.useLocationText}>Use my location</Text>
            </Pressable>
          </View>

          {status === "denied" ? (
            <Text style={styles.permissionNote}>
              Location access is off — showing a default area. Enable it to see places around you.
            </Text>
          ) : null}

          <Text style={styles.radiusLabel}>RADIUS</Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((option) => {
              const active = option === radiusKm;
              return (
                <Pressable
                  key={option}
                  onPress={() => setRadiusKm(option)}
                  style={[styles.radiusChip, active && styles.radiusChipActive]}
                >
                  <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                    {option} km
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Map — real MapView on device, placeholder on web */}
        <View style={styles.mapWrap}>
          <MapCanvas
            region={region}
            places={places}
            radiusKm={radiusKm}
            placesStatus={placesStatus}
          />
        </View>

        {/* Places list */}
        <Text style={styles.sectionTitle}>Popular nearby</Text>

        {placesStatus === "loading" ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.stateText}>Finding places…</Text>
          </View>
        ) : placesStatus === "error" ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.muted} />
            <Text style={styles.stateText}>{errorMsg}</Text>
            <Pressable style={styles.retryButton} onPress={() => setReloadKey((k) => k + 1)}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : placesStatus === "empty" ? (
          <View style={styles.stateBox}>
            <Ionicons name="compass-outline" size={22} color={colors.muted} />
            <Text style={styles.stateText}>No places within {radiusKm} km. Try a wider radius.</Text>
          </View>
        ) : (
          places.map((place) => (
            <View key={place.id || place.name} style={styles.placeCard}>
              <View style={styles.placeIcon}>
                <Ionicons name="location-outline" size={18} color={colors.gold} />
              </View>
              <View style={styles.placeBody}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeMeta} numberOfLines={1}>
                  {[place.category, place.address].filter(Boolean).join("  ·  ")}
                </Text>
              </View>
              <View style={styles.placeRight}>
                {place.rating ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.star} />
                    <Text style={styles.ratingText}>{place.rating}</Text>
                  </View>
                ) : null}
                {place.distanceKm != null ? (
                  <Text style={styles.distanceText}>{Number(place.distanceKm).toFixed(1)} km</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1 },
  content: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 40 },

  controlCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  locationCopy: { flex: 1 },
  locationLabel: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  locationMeta: { marginTop: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  useLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  useLocationText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.gold },
  permissionNote: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  radiusLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: colors.gold,
  },
  radiusRow: { flexDirection: "row", gap: spacing.sm },
  radiusChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  radiusChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  radiusChipText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.muted },
  radiusChipTextActive: { color: colors.onDark },

  mapWrap: {
    marginTop: spacing.lg,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.ink,
  },

  stateBox: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  stateText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  retryText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.gold },

  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tint(colors.gold),
    alignItems: "center",
    justifyContent: "center",
  },
  placeBody: { flex: 1 },
  placeName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  placeMeta: { marginTop: 2, fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  placeRight: { alignItems: "flex-end", gap: 3 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.ink },
  distanceText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
});
