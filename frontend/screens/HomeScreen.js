import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

const quickTools = [
  { label: "Itinerary", icon: "calendar-month", color: "#1F78FF", iconSize: 44 },
  { label: "Hotels", icon: "bed", color: "#FF5A1F", iconSize: 45 },
  { label: "Flights", icon: "airplane", color: "#1F78FF", iconSize: 46 },
  { label: "Favorites", icon: "heart", color: "#FF4D2D", iconSize: 40 },
  { label: "Safety", icon: "shield-check", color: "#10B24C", iconSize: 46 },
  { label: "Weather", variant: "weather" },
  { label: "AI Chat", variant: "chat" },
  { label: "Maps", icon: "map-marker", color: "#10B24C", iconSize: 44 },
];

const heroWidgetImage = require("../assets/images/ask-wayfinder-widget-final.png");

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

function QuickToolIcon({ tool }) {
  if (tool.variant === "weather") {
    return (
      <View style={styles.weatherIconWrap}>
        <Ionicons name="sunny" size={21} color="#FDB515" style={styles.weatherSunIcon} />
        <Ionicons name="cloud" size={42} color="#3C9BFF" />
      </View>
    );
  }

  if (tool.variant === "chat") {
    return (
      <View style={styles.chatIconWrap}>
        <Ionicons name="chatbubble" size={42} color="#5B50FF" />
        <Ionicons name="ellipsis" size={19} color="#FFFFFF" style={styles.chatDots} />
        <Ionicons name="chatbubble" size={20} color="#B7D8FF" style={styles.chatAccentBubble} />
      </View>
    );
  }

  return (
    <MaterialCommunityIcons
      name={tool.icon}
      size={tool.iconSize ?? 42}
      color={tool.color}
    />
  );
}

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
            <Pressable onPress={() => onNavigate?.("notifications")} style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={28} color="#111827" />
            </Pressable>
            <Pressable onPress={() => onNavigate?.("profile")} style={styles.headerButton}>
              <Ionicons name="person-circle-outline" size={31} color="#111827" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>Good morning, {displayName} 👋</Text>
        <Text style={styles.heading}>Where should we go next?</Text>

        <View style={styles.heroCard}>
          <Pressable
            onPress={() => onNavigate?.("chat")}
            style={styles.heroCardPressable}
          >
            <Image
              source={heroWidgetImage}
              style={styles.heroCardImage}
              resizeMode="stretch"
            />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Quick Tools</Text>
        <View style={styles.toolsGrid}>
          {quickTools.map((tool) => (
            <DimPressable
              key={tool.label}
              style={styles.toolCard}
              onPress={() => handleQuickToolPress(tool)}
            >
              <QuickToolIcon tool={tool} />
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </DimPressable>
          ))}
        </View>

        <DimPressable
          style={styles.travelCard}
          onPress={() => onNavigate?.("travelCheck")}
        >
          <View style={styles.travelCardHeader}>
            <Text style={styles.travelCardEyebrow}>TRAVEL CHECK</Text>
            <Ionicons name="chevron-forward" size={18} color="#7D8AA5" />
          </View>

          <View style={styles.travelStatsRow}>
            <View style={styles.travelStat}>
              <Ionicons name="partly-sunny-outline" size={22} color="#1F78FF" />
              <View style={styles.travelStatCopy}>
                <Text style={styles.travelStatValue}>
                  {travelCheckLoading
                    ? "—"
                    : `${Math.round(travelWeather?.temp_f || 70)}°F`}
                </Text>
                <Text style={styles.travelStatMeta}>
                  {travelCheckLoading ? "Loading..." : travelWeather?.condition || "Partly cloudy"}
                </Text>
              </View>
            </View>

            <View style={styles.travelDivider} />

            <View style={styles.travelStat}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#10B24C" />
              <View style={styles.travelStatCopy}>
                <Text style={styles.travelStatValue}>
                  {travelCheckLoading ? "—" : safetyLabel}
                </Text>
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

        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationTitle}>Recommended by Wayfinder</Text>
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
                onNavigate?.("destination", { slug: destination.slug || destination.name.toLowerCase() })
              }
            >
              <Image source={destinationImageUri(destination)} style={styles.destinationImage} />
              <View style={styles.destinationOverlay} />
              <Ionicons name="heart-outline" size={18} color="#FFFFFF" style={styles.destinationHeart} />
              <View style={styles.destinationContent}>
                <Text style={styles.destinationName}>{destination.name}</Text>
                <Text style={styles.destinationSubtitle}>{destination.subtitle}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FFD54A" />
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
    backgroundColor: "#EAF2FC",
  },

  container: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },

  contentContainer: {
    paddingTop: 52,
    paddingHorizontal: 20,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#14253E",
    letterSpacing: -0.8,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    marginLeft: 12,
  },

  greeting: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: "600",
    color: "#2F80FF",
    letterSpacing: -0.4,
  },

  heading: {
    marginTop: 12,
    marginBottom: 20,
    paddingLeft: 30,
    fontSize: 31,
    fontWeight: "800",
    color: "#0A0F16",
    lineHeight: 38,
    letterSpacing: -1.2,
  },

  heroCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#0D73F3",
    overflow: "hidden",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  heroCardPressable: {
    width: "100%",
    aspectRatio: 1484 / 762,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0D73F3",
  },

  heroCardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0D73F3",
  },

  sectionTitle: {
    marginTop: 34,
    marginBottom: 18,
    paddingLeft: 12,
    fontSize: 24,
    fontWeight: "700",
    color: "#090E16",
    letterSpacing: -0.8,
  },

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  toolCard: {
    width: "23.2%",
    aspectRatio: 1,
    marginBottom: 14,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  toolLabel: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "700",
    color: "#22324A",
  },

  weatherIconWrap: {
    width: 54,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  weatherSunIcon: {
    position: "absolute",
    top: 2,
    right: 5,
    zIndex: 1,
  },

  chatIconWrap: {
    width: 54,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  chatDots: {
    position: "absolute",
    top: 13,
  },

  chatAccentBubble: {
    position: "absolute",
    right: 3,
    bottom: 1,
  },

  travelCard: {
    marginTop: 18,
    width: "100%",
    borderRadius: 19,
    padding: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  travelCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  travelCardEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#1F78FF",
  },

  travelStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  travelStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  travelStatCopy: {
    flex: 1,
  },

  travelStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14253E",
  },

  travelStatMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },

  travelDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 12,
    backgroundColor: "#D7E3F4",
  },

  travelSummary: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },

  recommendationHeader: {
    marginTop: 32,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recommendationTitle: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 21,
    fontWeight: "700",
    color: "#090E16",
    letterSpacing: -0.7,
  },

  viewAllText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E81FF",
  },

  destinationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  destinationCard: {
    width: "23.25%",
    aspectRatio: 0.78,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#C5D2E4",
  },

  destinationImage: {
    width: "100%",
    height: "100%",
  },

  destinationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 23, 42, 0.20)",
  },

  destinationHeart: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  destinationContent: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 9,
  },

  destinationName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  destinationSubtitle: {
    marginTop: 1,
    fontSize: 10,
    color: "#F8FAFC",
  },

  ratingRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  destinationRating: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
