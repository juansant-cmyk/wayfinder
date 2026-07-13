import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import FeatureHeader from "./shared/FeatureHeader";
import { accents, colors, fonts, radius, spacing, tint } from "../theme/tokens";

const mapPins = [
  { name: "Tokyo Skytree", top: "8%", left: "62%" },
  { name: "Meiji Jingu Shrine", top: "34%", left: "14%" },
  { name: "Tokyo Tower", top: "46%", left: "44%" },
  { name: "Shibuya Crossing", top: "60%", left: "10%" },
  { name: "Tsukiji Outer Market", top: "62%", left: "58%" },
];

const quickActions = [
  { icon: "navigate-outline", title: "Directions", subtitle: "Get step-by-step routes", accent: accents.blue },
  { icon: "train-outline", title: "Transit", subtitle: "Bus, train, metro schedules", accent: accents.green },
  { icon: "star-outline", title: "Explore Nearby", subtitle: "See places around you", accent: accents.amber },
  { icon: "location-outline", title: "Save Place", subtitle: "Save and organize favorite spots", accent: accents.terracotta },
];

const exploreCategories = [
  { icon: "restaurant-outline", label: "Restaurants", distance: "1.2 km", accent: accents.terracotta },
  { icon: "camera-outline", label: "Attractions", distance: "2.4 km", accent: accents.blue },
  { icon: "bag-handle-outline", label: "Shopping", distance: "1.6 km", accent: accents.plum },
  { icon: "cafe-outline", label: "Cafes", distance: "950 m", accent: accents.amber },
  { icon: "bed-outline", label: "Hotels", distance: "1.3 km", accent: accents.rose },
  { icon: "ellipsis-horizontal", label: "More", distance: "Categories", accent: accents.teal },
];

const savedPlaces = [
  {
    name: "Tokyo Tower",
    meta: "Landmark · 2.1 km",
    image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Shibuya Crossing",
    meta: "Attraction · 1.0 km",
    image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Meiji Jingu Shrine",
    meta: "Attraction · 3.2 km",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Tsukiji Outer Market",
    meta: "Food · 2.7 km",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80",
  },
];

const essentials = [
  { icon: "medkit-outline", label: "Hospitals", distance: "1.1 km", accent: accents.terracotta },
  { icon: "medical-outline", label: "Pharmacies", distance: "800 m", accent: accents.plum },
  { icon: "train-outline", label: "Transit Stations", distance: "450 m", accent: accents.blue },
  { icon: "cart-outline", label: "Grocery Stores", distance: "1.2 km", accent: accents.green },
  { icon: "card-outline", label: "ATMs", distance: "900 m", accent: accents.amber },
];

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable style={styles.viewAll}>
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.gold} />
      </Pressable>
    </View>
  );
}

function MiniCard({ icon, label, distance, accent }) {
  return (
    <View style={styles.miniCard}>
      <View style={[styles.miniIcon, { backgroundColor: tint(accent) }]}>
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniDistance}>{distance}</Text>
    </View>
  );
}

export default function MapsScreen({ onBack }) {
  const [query, setQuery] = useState("");

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
          subtitle="Find places, get directions, and explore your destination."
          onBack={onBack}
        />

        {/* Search */}
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={17} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a place, address, or destination"
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
          />
          <Ionicons name="options-outline" size={18} color={colors.muted} />
        </View>
        <View style={styles.searchButtonsRow}>
          <Pressable style={styles.outlineButton}>
            <Ionicons name="grid-outline" size={15} color={colors.ink} />
            <Text style={styles.outlineButtonText}>Categories</Text>
          </Pressable>
          <Pressable style={styles.outlineButton}>
            <Ionicons name="bookmark-outline" size={15} color={colors.ink} />
            <Text style={styles.outlineButtonText}>My Lists</Text>
          </Pressable>
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <View style={styles.locationChip}>
            <View style={styles.locationChipRow}>
              <Text style={styles.locationTitle}>Tokyo, Japan</Text>
              <Ionicons name="chevron-down" size={14} color={colors.muted} />
            </View>
            <Text style={styles.locationSub}>Shibuya, Tokyo</Text>
          </View>

          {mapPins.map((pin) => (
            <View key={pin.name} style={[styles.pin, { top: pin.top, left: pin.left }]}>
              <Ionicons name="location" size={16} color={colors.navy} />
              <Text style={styles.pinText} numberOfLines={1}>{pin.name}</Text>
            </View>
          ))}

          <View style={styles.mapControls}>
            <View style={styles.mapControl}>
              <Ionicons name="locate-outline" size={18} color={colors.ink} />
            </View>
            <View style={styles.mapControl}>
              <Ionicons name="layers-outline" size={18} color={colors.ink} />
            </View>
            <View style={styles.mapControl}>
              <Ionicons name="navigate" size={18} color={colors.ink} />
            </View>
          </View>

          <Text style={styles.mapScale}>0     500 m     1 km</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <View key={a.title} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: tint(a.accent) }]}>
                <Ionicons name={a.icon} size={18} color={a.accent} />
              </View>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionSubtitle}>{a.subtitle}</Text>
            </View>
          ))}
        </View>

        {/* Explore Nearby */}
        <SectionHeader title="Explore Nearby" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {exploreCategories.map((c) => (
            <MiniCard key={c.label} icon={c.icon} label={c.label} distance={c.distance} accent={c.accent} />
          ))}
        </ScrollView>

        {/* Saved Places */}
        <SectionHeader title="Saved Places" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {savedPlaces.map((p) => (
            <View key={p.name} style={styles.savedCard}>
              <View>
                <Image source={{ uri: p.image }} style={styles.savedImage} />
                <View style={styles.savedHeart}>
                  <Ionicons name="heart" size={13} color={colors.terracotta} />
                </View>
              </View>
              <Text style={styles.savedName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.savedMeta}>{p.meta}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Nearby Essentials */}
        <SectionHeader title="Nearby Essentials" subtitle="Important places around your location." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {essentials.map((e) => (
            <MiniCard key={e.label} icon={e.icon} label={e.label} distance={e.distance} accent={e.accent} />
          ))}
        </ScrollView>

        {/* Plan banner */}
        <View style={styles.planBanner}>
          <View style={styles.planIcon}>
            <Ionicons name="map-outline" size={20} color={colors.gold} />
          </View>
          <View style={styles.planText}>
            <Text style={styles.planTitle}>Plan Your Trip on Map</Text>
            <Text style={styles.planSubtitle}>
              See all your saved places and itinerary stops in one view.
            </Text>
          </View>
          <Pressable style={styles.planButton}>
            <Text style={styles.planButtonText}>View My Trip Map</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1 },
  content: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 40 },

  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  searchButtonsRow: { marginTop: spacing.sm, flexDirection: "row", gap: spacing.sm },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  outlineButtonText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "600", color: colors.ink },

  mapCard: {
    marginTop: spacing.lg,
    height: 230,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
    overflow: "hidden",
  },
  locationChip: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    ...( { shadowColor: "#3A3428", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }),
  },
  locationChipRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  locationSub: { marginTop: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
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
  mapControls: { position: "absolute", top: spacing.md, right: spacing.md, gap: spacing.sm },
  mapControl: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mapScale: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.muted,
  },

  actionsGrid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 6,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  actionSubtitle: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: colors.muted },

  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  sectionSubtitle: { marginTop: 2, fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  hRow: { gap: spacing.sm, paddingRight: spacing.xl },
  miniCard: {
    width: 96,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 6,
  },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  miniLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.ink, textAlign: "center" },
  miniDistance: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  savedCard: { width: 150 },
  savedImage: { width: 150, height: 110, borderRadius: radius.md, backgroundColor: colors.surfaceSunken },
  savedHeart: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(252,250,246,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  savedName: { marginTop: spacing.sm, fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  savedMeta: { marginTop: 2, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  planBanner: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  planText: { marginTop: spacing.md },
  planTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  planSubtitle: { marginTop: 3, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  planButton: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.cta,
  },
  planButtonText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
