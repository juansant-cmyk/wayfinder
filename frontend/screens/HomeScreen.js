import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as dashboardApi from "../src/api/dashboard";
import { getToken } from "../src/auth/tokenStorage";
import { colors, fonts, radius, softShadow, spacing } from "../theme/tokens";

const quickTools = [
  { label: "Itinerary", icon: "calendar-outline", screen: "itinerary" },
  { label: "Hotels", icon: "bed-outline", screen: "hotels" },
  { label: "Flights", icon: "airplane-outline", screen: "flights" },
  { label: "Saved", icon: "heart-outline", screen: "favorites" },
  { label: "Safety", icon: "shield-checkmark-outline", screen: "safety" },
  { label: "Weather", icon: "partly-sunny-outline", screen: "weather" },
  { label: "AI Chat", icon: "chatbubble-ellipses-outline", screen: "chat" },
  { label: "Maps", icon: "map-outline", screen: "maps" },
];

const fallbackDestinations = [
  {
    name: "Bali",
    subtitle: "Indonesia",
    rating: "4.8",
    image_url:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
    slug: "bali",
  },
  {
    name: "Japan",
    subtitle: "Culture • Food",
    rating: "4.9",
    image_url:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=600&q=80",
    slug: "japan",
  },
  {
    name: "Switzerland",
    subtitle: "Nature • Lakes",
    rating: "4.7",
    image_url:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    slug: "switzerland",
  },
  {
    name: "Portugal",
    subtitle: "Coastal • Cities",
    rating: "4.6",
    image_url:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=600&q=80",
    slug: "portugal",
  },
];

const bottomNavItems = [
  { label: "Home", icon: "home-outline", active: true },
  { label: "Itinerary", icon: "calendar-clear-outline", active: false },
  { label: "Saved", icon: "bookmark-outline", active: false },
  { label: "Trips", icon: "briefcase-outline", active: false },
  { label: "Profile", icon: "person-outline", active: false },
];

function destinationImageUri(destination) {
  return { uri: destination.image_url || destination.image };
}

export default function HomeScreen({ displayName = "User", onNavigate }) {
  const [recommendedDestinations, setRecommendedDestinations] =
    useState(fallbackDestinations);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommended() {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const destinations = await dashboardApi.fetchRecommendedDestinations(token);
        if (!cancelled && destinations?.length) {
          setRecommendedDestinations(destinations);
        }
      } catch (error) {
        // Keep fallback cards when the API is unavailable.
      }
    }

    loadRecommended();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBottomNav = (label) => {
    if (label === "Home") {
      return;
    }
    if (label === "Itinerary" || label === "Trips") {
      onNavigate?.("itinerary");
      return;
    }
    if (label === "Saved") {
      onNavigate?.("favorites");
      return;
    }
    if (label === "Profile") {
      onNavigate?.("profile");
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Ionicons name="compass-outline" size={24} color={colors.gold} />
            <Text style={styles.brandText}>Wayfinder</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => onNavigate?.("notifications")}
              style={styles.headerButton}
              hitSlop={8}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => onNavigate?.("profile")}
              style={styles.headerButton}
              hitSlop={8}
            >
              <Ionicons name="person-circle-outline" size={26} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.eyebrow}>GOOD MORNING, {displayName.toUpperCase()}</Text>
        <Text style={styles.heading}>Where should we go next?</Text>

        {/* Ask Wayfinder */}
        <Pressable style={styles.heroCard} onPress={() => onNavigate?.("chat")}>
          <View style={styles.heroLabelRow}>
            <Ionicons name="sparkles-outline" size={15} color={colors.gold} />
            <Text style={styles.heroLabel}>ASK WAYFINDER</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Plan a trip, compare hotels, and get safety tips — just ask.
          </Text>

          <View style={styles.heroPrompt}>
            <Text style={styles.heroPromptText} numberOfLines={1}>
              Plan a 3-day trip to Japan under $1,500
            </Text>
            <View style={styles.heroPromptArrow}>
              <Ionicons name="arrow-forward" size={15} color={colors.navy} />
            </View>
          </View>

          <View style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Generate trip</Text>
            <Ionicons name="sparkles" size={14} color={colors.navy} />
          </View>
        </Pressable>

        {/* Quick Tools */}
        <Text style={styles.sectionTitle}>Quick tools</Text>
        <View style={styles.toolsGrid}>
          {quickTools.map((tool) => (
            <Pressable
              key={tool.label}
              style={styles.toolCard}
              onPress={() => onNavigate?.(tool.screen)}
            >
              <Ionicons name={tool.icon} size={23} color={colors.ink} />
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Travel Check */}
        <Pressable style={styles.travelCard} onPress={() => onNavigate?.("travelCheck")}>
          <View style={styles.travelHeader}>
            <Text style={styles.eyebrowGold}>TRAVEL CHECK</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </View>
          <View style={styles.travelStats}>
            <View style={styles.travelStat}>
              <Ionicons name="partly-sunny-outline" size={20} color={colors.gold} />
              <View style={styles.travelStatText}>
                <Text style={styles.travelStatValue}>70°F</Text>
                <Text style={styles.travelStatMeta}>Partly cloudy</Text>
              </View>
            </View>
            <View style={styles.travelDivider} />
            <View style={styles.travelStat}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
              <View style={styles.travelStatText}>
                <Text style={styles.travelStatValue}>Safe</Text>
                <Text style={styles.travelStatMeta}>No active alerts</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Recommended */}
        <View style={styles.recommendationHeader}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <Pressable onPress={() => onNavigate?.("recommended")}>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.destinationRow}>
          {recommendedDestinations.map((destination) => (
            <Pressable
              key={destination.slug || destination.name}
              style={styles.destinationCard}
              onPress={() =>
                onNavigate?.("destination", {
                  slug: destination.slug || destination.name.toLowerCase(),
                })
              }
            >
              <Image source={destinationImageUri(destination)} style={styles.destinationImage} />
              <View style={styles.destinationOverlay} />
              <Ionicons
                name="heart-outline"
                size={16}
                color="#FFFFFF"
                style={styles.destinationHeart}
              />
              <View style={styles.destinationContent}>
                <Text style={styles.destinationName}>{destination.name}</Text>
                <Text style={styles.destinationSubtitle}>{destination.subtitle}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={11} color={colors.star} />
                  <Text style={styles.destinationRating}>{destination.rating}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map((item) => (
          <Pressable
            key={item.label}
            style={styles.bottomNavItem}
            onPress={() => handleBottomNav(item.label)}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={item.active ? colors.gold : colors.muted}
            />
            <Text style={[styles.bottomNavLabel, item.active && styles.bottomNavLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },

  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },

  contentContainer: {
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  brandText: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 0.2,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },

  headerButton: {
    padding: 2,
  },

  eyebrow: {
    marginTop: spacing.xxl,
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: colors.gold,
  },

  eyebrowGold: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: colors.gold,
  },

  heading: {
    marginTop: spacing.sm,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
    letterSpacing: -0.3,
  },

  heroCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    ...softShadow,
  },

  heroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  heroLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.gold,
  },

  heroSubtitle: {
    marginTop: spacing.md,
    fontFamily: fonts.serif,
    fontSize: 19,
    lineHeight: 27,
    color: colors.onDark,
  },

  heroPrompt: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.onDarkLine,
    backgroundColor: "rgba(241,236,226,0.06)",
  },

  heroPromptText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.onDarkMuted,
  },

  heroPromptArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.onDark,
    alignItems: "center",
    justifyContent: "center",
  },

  heroButton: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
  },

  heroButtonText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: colors.navy,
  },

  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.2,
  },

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  toolCard: {
    width: "23%",
    aspectRatio: 1,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  toolLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },

  travelCard: {
    marginTop: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },

  travelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  travelStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  travelStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  travelStatText: {
    gap: 2,
  },

  travelStatValue: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },

  travelStatMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },

  travelDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.line,
  },

  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewAllText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: colors.gold,
  },

  destinationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  destinationCard: {
    width: "23.25%",
    aspectRatio: 0.72,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceSunken,
  },

  destinationImage: {
    width: "100%",
    height: "100%",
  },

  destinationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,18,14,0.28)",
  },

  destinationHeart: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  destinationContent: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
  },

  destinationName: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  destinationSubtitle: {
    marginTop: 1,
    fontFamily: fonts.sans,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
  },

  ratingRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  destinationRating: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },

  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  bottomNavLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "500",
    color: colors.muted,
  },

  bottomNavLabelActive: {
    color: colors.gold,
    fontWeight: "600",
  },
});
