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
import { colors, fonts, radius, spacing } from "../theme/tokens";

const sortOptions = ["Best Match", "Lowest Price", "Highest Rated", "Closest"];

const hotels = [
  {
    badge: "Best Match",
    name: "Sunset Inn",
    location: "Los Angeles, CA",
    distance: "2.1 mi from center",
    rating: "4.6",
    reviews: "532 reviews",
    amenities: [
      { icon: "wifi", label: "WiFi" },
      { icon: "water-outline", label: "Pool" },
      { icon: "car-outline", label: "Parking" },
    ],
    note: "Great value with excellent amenities.",
    price: "$149",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  },
  {
    badge: "Best Budget",
    name: "City View Hotel",
    location: "Downtown LA",
    distance: "1.4 mi from center",
    rating: "4.4",
    reviews: "318 reviews",
    amenities: [
      { icon: "wifi", label: "WiFi" },
      { icon: "cafe-outline", label: "Breakfast" },
      { icon: "barbell-outline", label: "Gym" },
    ],
    note: "Affordable and close to popular spots.",
    price: "$119",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
  },
];

function HotelCard({ hotel }) {
  return (
    <View style={styles.hotelCard}>
      <View>
        <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
        <View style={styles.badge}>
          <Ionicons name="star" size={11} color={colors.gold} />
          <Text style={styles.badgeText}>{hotel.badge}</Text>
        </View>
        <View style={styles.heart}>
          <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.hotelBody}>
        <View style={styles.hotelTitleRow}>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{hotel.price}</Text>
            <Text style={styles.priceMeta}>/ night</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.gold} />
          <Text style={styles.metaText}>
            {hotel.location}  ·  {hotel.distance}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.ratingText}>{hotel.rating}</Text>
          <Text style={styles.reviewsText}>| ({hotel.reviews})</Text>
        </View>

        <View style={styles.amenitiesRow}>
          {hotel.amenities.map((a) => (
            <View key={a.label} style={styles.amenity}>
              <Ionicons name={a.icon} size={15} color={colors.muted} />
              <Text style={styles.amenityText}>{a.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="sparkles" size={13} color={colors.gold} />
          <Text style={styles.noteText}>
            <Text style={styles.noteBold}>Wayfinder note: </Text>
            {hotel.note}
          </Text>
        </View>

        <Pressable style={styles.detailsButton}>
          <Text style={styles.detailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.gold} />
        </Pressable>
      </View>
    </View>
  );
}

export default function HotelsScreen({ onBack }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Best Match");

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader
          title="Hotels"
          subtitle="Wayfinder finds great places so you can focus on"
          accentTail="your trip."
          onBack={onBack}
        />

        {/* Search */}
        <View style={styles.searchCard}>
          <View style={styles.searchHeaderRow}>
            <View style={styles.searchIcon}>
              <Ionicons name="bed-outline" size={18} color={colors.navy} />
            </View>
            <Text style={styles.searchTitle}>Find your stay</Text>
          </View>
          <Text style={styles.searchSubtitle}>
            Search hotels by destination and compare options.
          </Text>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={17} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Where are you going?"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Find Hotels</Text>
          </Pressable>
        </View>

        {/* Sort */}
        <Text style={styles.sortLabel}>Sort by</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
        >
          {sortOptions.map((option) => {
            const active = option === sort;
            return (
              <Pressable
                key={option}
                onPress={() => setSort(option)}
                style={[styles.sortChip, active && styles.sortChipActive]}
              >
                <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Picks */}
        <View style={styles.picksRow}>
          <View style={styles.picksLeft}>
            <Ionicons name="ribbon-outline" size={18} color={colors.gold} />
            <Text style={styles.picksTitle}>Wayfinder Picks</Text>
          </View>
          <Text style={styles.picksCount}>128 results</Text>
        </View>
        <Text style={styles.picksSubtitle}>Handpicked recommendations just for you.</Text>

        {hotels.map((hotel) => (
          <HotelCard key={hotel.name} hotel={hotel} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1 },
  content: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 40 },

  searchCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
  },
  searchHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.onDark,
    alignItems: "center",
    justifyContent: "center",
  },
  searchTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.onDark,
  },
  searchSubtitle: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.onDarkMuted,
  },
  searchInputWrap: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  searchButton: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },

  sortLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.ink,
  },
  sortRow: { gap: spacing.sm, paddingRight: spacing.xl },
  sortChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  sortChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  sortChipText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.muted },
  sortChipTextActive: { color: colors.onDark },

  picksRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  picksLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  picksTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  picksCount: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },
  picksSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
  },

  hotelCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  hotelImage: { width: "100%", height: 150, backgroundColor: colors.surfaceSunken },
  badge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: "rgba(252,250,246,0.95)",
  },
  badgeText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "700", color: colors.ink },
  heart: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(20,18,14,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  hotelBody: { padding: spacing.lg },
  hotelTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  hotelName: { flex: 1, fontFamily: fonts.serif, fontSize: 21, color: colors.ink },
  priceBlock: { alignItems: "flex-end" },
  price: { fontFamily: fonts.sans, fontSize: 20, fontWeight: "700", color: colors.ink },
  priceMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  metaRow: { marginTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  ratingText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.ink },
  reviewsText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  amenitiesRow: { marginTop: spacing.md, flexDirection: "row", gap: spacing.lg },
  amenity: { flexDirection: "row", alignItems: "center", gap: 5 },
  amenityText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  noteBox: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  noteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  noteBold: { fontWeight: "700", color: colors.ink },

  detailsButton: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  detailsText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.gold },
});
