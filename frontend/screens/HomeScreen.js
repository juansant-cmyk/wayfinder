import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
const travelCheckCardImage = require("../assets/images/travel-check-clear.png");

const recommendedDestinations = [
  {
    name: "Bali",
    subtitle: "Indonesia",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Japan",
    subtitle: "Culture • Food",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Switzerland",
    subtitle: "Nature • Lakes",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Portugal",
    subtitle: "Coastal • Cities",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=600&q=80",
  },
];

const bottomNavItems = [
  { label: "Home", icon: "home", active: true },
  { label: "Itinerary", icon: "calendar-clear", active: false },
  { label: "Saved", icon: "bookmark-outline", active: false },
  { label: "Trips", icon: "briefcase-outline", active: false },
  { label: "Profile", icon: "person-outline", active: false },
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

export default function HomeScreen({ onNavigateHotels }) {
  const showPlaceholder = (label) => {
    if (label === "Home") {
      Alert.alert("Home", "You are already on Home");
      return;
    }

    Alert.alert(label, "Coming soon");
  };

  const handleQuickToolPress = (tool) => {
    if (tool.label === "Hotels" && onNavigateHotels) {
      onNavigateHotels();
      return;
    }

    showPlaceholder(tool.label);
  };

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
            <Pressable onPress={() => showPlaceholder("Notifications")} style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={28} color="#111827" />
            </Pressable>
            <Pressable onPress={() => showPlaceholder("Profile")} style={styles.headerButton}>
              <Ionicons name="person-circle-outline" size={31} color="#111827" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>Good morning, User 👋</Text>
        <Text style={styles.heading}>Where should we go next?</Text>

        <View style={styles.heroCard}>
          <Pressable
            onPress={() => showPlaceholder("Ask Wayfinder")}
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
            <Pressable
              key={tool.label}
              style={styles.toolCard}
              onPress={() => handleQuickToolPress(tool)}
            >
              <QuickToolIcon tool={tool} />
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.travelCard} onPress={() => showPlaceholder("Travel Check")}>
          <Image
            source={travelCheckCardImage}
            style={styles.travelCardImage}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationTitle}>Recommended by Wayfinder</Text>
          <Pressable onPress={() => showPlaceholder("Recommended trips")}>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.destinationRow}>
          {recommendedDestinations.map((destination) => (
            <Pressable
              key={destination.name}
              style={styles.destinationCard}
              onPress={() => showPlaceholder(destination.name)}
            >
              <Image source={{ uri: destination.image }} style={styles.destinationImage} />
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

      <View style={styles.bottomNav}>
        {bottomNavItems.map((item) => (
          <Pressable
            key={item.label}
            style={styles.bottomNavItem}
            onPress={() => showPlaceholder(item.label)}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={item.active ? "#1F78FF" : "#334155"}
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
    backgroundColor: "#EAF2FC",
  },

  container: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },

  contentContainer: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 122,
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

  heroGlowLarge: {
    position: "absolute",
    top: -22,
    right: -18,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(109, 196, 255, 0.24)",
  },

  heroGlowSmall: {
    position: "absolute",
    bottom: -42,
    left: -36,
    width: 182,
    height: 182,
    borderRadius: 91,
    backgroundColor: "rgba(5, 86, 214, 0.28)",
  },

  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  heroCopy: {
    width: "48%",
    paddingTop: 2,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroTitle: {
    marginLeft: 8,
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },

  heroDescription: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 26,
    color: "#F4FAFF",
  },

  heroArt: {
    width: 192,
    height: 148,
    position: "relative",
  },

  cloudOneWrap: {
    position: "absolute",
    top: 12,
    right: 14,
  },

  cloudTwoWrap: {
    position: "absolute",
    top: 46,
    left: 4,
  },

  cloudThreeWrap: {
    position: "absolute",
    top: 66,
    right: 66,
  },

  cloud: {
    width: 44,
    height: 16,
    position: "relative",
  },

  cloudLeft: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 16,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.74)",
  },

  cloudCenter: {
    position: "absolute",
    left: 10,
    top: 0,
    width: 18,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },

  cloudRight: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 18,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.74)",
  },

  landmarksRow: {
    position: "absolute",
    right: 34,
    bottom: 40,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  landmarkGap: {
    marginLeft: 3,
  },

  eiffelWrap: {
    marginLeft: 4,
    width: 17,
    alignItems: "center",
    justifyContent: "flex-end",
    height: 54,
  },

  eiffelTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F6C978",
  },

  eiffelStem: {
    marginTop: 2,
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: "#F6C978",
  },

  eiffelBase: {
    marginTop: 2,
    width: 15,
    height: 15,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "#F6C978",
  },

  templeWrap: {
    marginLeft: 6,
    width: 32,
    height: 46,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  templeRoofTop: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF7A34",
  },

  templeBodyTop: {
    width: 16,
    height: 10,
    backgroundColor: "#653412",
  },

  templeRoofBottom: {
    width: 30,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FF7A34",
  },

  templeBodyBottom: {
    width: 22,
    height: 14,
    backgroundColor: "#653412",
  },

  robotWrap: {
    position: "absolute",
    left: 26,
    bottom: 18,
    alignItems: "center",
    zIndex: 2,
  },

  robotAntennaStem: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#A8D8FF",
    marginBottom: -2,
  },

  robotAntennaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2D89FF",
    marginBottom: 2,
  },

  robotHead: {
    width: 76,
    height: 60,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 5,
    borderColor: "#DFF1FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F4ECC",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  robotFace: {
    width: 46,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0F274E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },

  robotEye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#76E7FF",
  },

  robotSmile: {
    marginTop: 4,
    width: 18,
    height: 8,
    borderBottomWidth: 2,
    borderColor: "#76E7FF",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  robotBody: {
    marginTop: -2,
    width: 38,
    height: 32,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#DFF1FF",
    alignItems: "center",
    justifyContent: "center",
  },

  globeWrap: {
    position: "absolute",
    right: -2,
    bottom: -10,
    width: 118,
    height: 118,
    borderRadius: 59,
    overflow: "hidden",
    zIndex: 1,
  },

  globe: {
    flex: 1,
    borderRadius: 59,
    backgroundColor: "#6ACC58",
  },

  continentOne: {
    position: "absolute",
    top: 28,
    left: 18,
    width: 34,
    height: 18,
    borderRadius: 11,
    backgroundColor: "#2E89FF",
    transform: [{ rotate: "-18deg" }],
  },

  continentTwo: {
    position: "absolute",
    top: 48,
    right: 14,
    width: 32,
    height: 15,
    borderRadius: 9,
    backgroundColor: "#2E89FF",
    transform: [{ rotate: "22deg" }],
  },

  continentThree: {
    position: "absolute",
    bottom: 24,
    left: 28,
    width: 42,
    height: 20,
    borderRadius: 12,
    backgroundColor: "#2E89FF",
    transform: [{ rotate: "10deg" }],
  },

  continentFour: {
    position: "absolute",
    bottom: 16,
    right: 24,
    width: 18,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#2E89FF",
    transform: [{ rotate: "-12deg" }],
  },

  promptCard: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  promptLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
  },

  promptText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#12233C",
    lineHeight: 20,
  },

  promptArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D2754",
  },

  generateButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "#FF6D39",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6D39",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  generateButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
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
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  travelCardImage: {
    width: "100%",
    alignSelf: "center",
    aspectRatio: 2014 / 436,
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

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -5 },
    elevation: 12,
  },

  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomNavLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },

  bottomNavLabelActive: {
    color: "#1F78FF",
  },
});
