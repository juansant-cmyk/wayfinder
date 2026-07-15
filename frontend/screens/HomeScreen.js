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
import { mapSafetyLevel } from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import { accents, colors, fonts, radius, softShadow, spacing, tint } from "../theme/tokens";

const quickTools = [
  { label: "Itinerary", icon: "calendar-outline", accent: accents.blue },
  { label: "Hotels", icon: "bed-outline", accent: accents.terracotta },
  { label: "Flights", icon: "airplane-outline", accent: accents.teal },
  { label: "Favorites", icon: "heart-outline", accent: accents.rose },
  { label: "Safety", icon: "shield-checkmark-outline", accent: accents.green },
  { label: "Weather", icon: "partly-sunny-outline", accent: accents.amber },
  { label: "AI Chat", icon: "chatbubble-ellipses-outline", accent: accents.plum },
  { label: "Maps", icon: "map-outline", accent: accents.indigo },
];

const QUICK_TOOL_SCREENS = {
  Itinerary: "itinerary",
  Flights: "flights",
  Favorites: "favorites",
  Safety: "safety",
  Weather: "weather",
  "AI Chat": "chat",
  Maps: "maps",
};

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

export default function HomeScreen({ displayName = "Traveler", onNavigate, onNavigateHotels }) {
  const [recommendedDestinations, setRecommendedDestinations] = useState(fallbackDestinations);
  const [travelCheck, setTravelCheck] = useState(null);
  const [travelCheckLoading, setTravelCheckLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;

    async function loadTravelCheck() {
      setTravelCheckLoading(true);

      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const check = await dashboardApi.fetchTravelCheck(token);
        if (!cancelled) {
          setTravelCheck(check);
        }
      } catch (error) {
        // Keep placeholder values when the API is unavailable.
      } finally {
        if (!cancelled) {
          setTravelCheckLoading(false);
        }
      }
    }

    loadTravelCheck();

    return () => {
      cancelled = true;
    };
  }, []);

  const travelWeather = travelCheck?.weather;
  const travelSafety = travelCheck?.safety;
  const safetyLabel = travelSafety ? mapSafetyLevel(travelSafety.overall_level) : "Safe";
  const safetyMeta = travelSafety?.alerts?.length
    ? `${travelSafety.alerts.length} active alert${travelSafety.alerts.length === 1 ? "" : "s"}`
    : "No active alerts";

  const handleQuickToolPress = (tool) => {
    if (tool.label === "Hotels") {
      onNavigateHotels?.();
      return;
    }

    const screen = QUICK_TOOL_SCREENS[tool.label];
    if (screen) {
      onNavigate?.(screen);
    }
  };

  function destinationImageUri(destination) {
    return { uri: destination.image_url || destination.image };
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — Ally's compass logo */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoPinTop} />
              <View style={styles.logoPinTail} />
              <View style={styles.logoCore}>
                <Ionicons name="navigate" size={14} color="#FF7344" style={styles.logoNeedle} />
              </View>
              <Ionicons name="sparkles" size={11} color="#FF8D58" style={styles.logoSpark} />
            </View>
            <Text style={styles.brandText}>Wayfinder</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable onPress={() => onNavigate?.("notifications")} style={styles.headerButton} hitSlop={8}>
              <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => onNavigate?.("profile")} style={styles.headerButton} hitSlop={8}>
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
            <Ionicons name="sparkles-outline" size={15} color="#FFD9A0" />
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
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Quick Tools */}
        <Text style={styles.sectionTitle}>Quick tools</Text>
        <View style={styles.toolsGrid}>
          {quickTools.map((tool) => (
            <DimPressable
              key={tool.label}
              style={styles.toolCard}
              onPress={() => handleQuickToolPress(tool)}
            >
              <View style={[styles.toolIcon, { backgroundColor: tint(tool.accent) }]}>
                <Ionicons name={tool.icon} size={21} color={tool.accent} />
              </View>
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </DimPressable>
          ))}
        </View>

        {/* Travel Check */}
        <DimPressable style={styles.travelCard} onPress={() => onNavigate?.("travelCheck")}>
          <View style={styles.travelCardHeader}>
            <Text style={styles.travelCardEyebrow}>TRAVEL CHECK</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </View>

          <View style={styles.travelStatsRow}>
            <View style={styles.travelStat}>
              <Ionicons name="partly-sunny-outline" size={20} color={colors.gold} />
              <View style={styles.travelStatCopy}>
                <Text style={styles.travelStatValue}>
                  {travelCheckLoading ? "—" : `${Math.round(travelWeather?.temp_f || 70)}°F`}
                </Text>
                <Text style={styles.travelStatMeta}>
                  {travelCheckLoading ? "Loading..." : travelWeather?.condition || "Partly cloudy"}
                </Text>
              </View>
            </View>

            <View style={styles.travelDivider} />

            <View style={styles.travelStat}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
              <View style={styles.travelStatCopy}>
                <Text style={styles.travelStatValue}>{travelCheckLoading ? "—" : safetyLabel}</Text>
                <Text style={styles.travelStatMeta}>
                  {travelCheckLoading ? "Loading..." : safetyMeta}
                </Text>
              </View>
            </View>
          </View>

          {!travelCheckLoading && travelCheck?.summary ? (
            <Text style={styles.travelSummary}>{travelCheck.summary}</Text>
          ) : null}
        </DimPressable>

        {/* Recommended */}
        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationTitle}>Recommended</Text>
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
              <Ionicons name="heart-outline" size={16} color="#FFFFFF" style={styles.destinationHeart} />
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

      <BottomNav activeLabel="Home" onNavigate={onNavigate} />
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
    paddingBottom: BOTTOM_NAV_CONTENT_PADDING,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoMark: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logoPinTop: {
    position: "absolute",
    top: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#65B5FF",
  },

  logoPinTail: {
    position: "absolute",
    bottom: 3,
    width: 15,
    height: 15,
    backgroundColor: "#65B5FF",
    transform: [{ rotate: "45deg" }],
  },

  logoCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  logoNeedle: {
    marginLeft: 1,
    transform: [{ rotate: "18deg" }],
  },

  logoSpark: {
    position: "absolute",
    top: -1,
    right: -1,
    zIndex: 3,
  },

  brandText: {
    marginLeft: 10,
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
    color: "#FFD9A0",
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
    backgroundColor: "rgba(255,255,255,0.10)",
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
    backgroundColor: colors.cta,
  },

  heroButtonText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
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

  toolIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  toolLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },

  travelCard: {
    marginTop: spacing.sm,
    width: "100%",
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },

  travelCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  travelCardEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: colors.gold,
  },

  travelStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  travelStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  travelStatCopy: {
    flex: 1,
  },

  travelStatValue: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },

  travelStatMeta: {
    marginTop: 2,
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

  travelSummary: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },

  recommendationHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recommendationTitle: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.2,
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
});
