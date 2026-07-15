import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import DimPressable from "./DimPressable";

export const BOTTOM_NAV_CONTENT_PADDING = 122;

const DEFAULT_NAV_ITEMS = [
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "home" },
  {
    label: "Itinerary",
    icon: "calendar-clear-outline",
    activeIcon: "calendar-clear",
    route: "itinerary",
  },
  { label: "Favorites", icon: "heart-outline", activeIcon: "heart", route: "favorites" },
  { label: "Trips", icon: "briefcase-outline", activeIcon: "briefcase", route: "itinerary" },
  { label: "Profile", icon: "person-outline", activeIcon: "person", route: "profile" },
];

const FLIGHTS_NAV_ITEMS = [
  DEFAULT_NAV_ITEMS[0],
  DEFAULT_NAV_ITEMS[1],
  { label: "Flights", icon: "airplane-outline", activeIcon: "airplane", route: "flights" },
  DEFAULT_NAV_ITEMS[2],
  DEFAULT_NAV_ITEMS[4],
];

const MAPS_NAV_ITEMS = [
  DEFAULT_NAV_ITEMS[0],
  DEFAULT_NAV_ITEMS[1],
  DEFAULT_NAV_ITEMS[2],
  { label: "Maps", icon: "location-outline", activeIcon: "location", route: "maps" },
  DEFAULT_NAV_ITEMS[4],
];

const CHAT_NAV_ITEMS = [
  DEFAULT_NAV_ITEMS[0],
  DEFAULT_NAV_ITEMS[1],
  DEFAULT_NAV_ITEMS[2],
  {
    label: "AI Chat",
    icon: "chatbubble-ellipses-outline",
    activeIcon: "chatbubble-ellipses",
    route: "chat",
  },
  DEFAULT_NAV_ITEMS[4],
];

function getDefaultItemsForActiveLabel(activeLabel) {
  if (activeLabel === "Flights") {
    return FLIGHTS_NAV_ITEMS;
  }

  if (activeLabel === "Maps") {
    return MAPS_NAV_ITEMS;
  }

  if (activeLabel === "AI Chat") {
    return CHAT_NAV_ITEMS;
  }

  return DEFAULT_NAV_ITEMS;
}

export function getBottomNavActiveLabel(screen) {
  const activeByScreen = {
    home: "Home",
    hotels: "Home",
    itinerary: "Itinerary",
    flights: "Flights",
    favorites: "Favorites",
    maps: "Maps",
    profile: "Profile",
    chat: "AI Chat",
  };

  return activeByScreen[screen] || null;
}

export default function BottomNav({
  activeLabel = null,
  onNavigate,
  items = null,
}) {
  const resolvedItems = items || getDefaultItemsForActiveLabel(activeLabel);

  function handlePress(item) {
    if (item.route === "home") {
      if (activeLabel === "Home") {
        return;
      }

      onNavigate?.("home");
      return;
    }

    onNavigate?.(item.route);
  }

  return (
    <View style={styles.bottomNav}>
      {resolvedItems.map((item) => {
        const isActive = item.label === activeLabel;

        return (
          <DimPressable
            key={item.label}
            accessibilityRole="button"
            style={styles.bottomNavItem}
            onPress={() => handlePress(item)}
          >
            <Ionicons
              name={isActive ? item.activeIcon || item.icon : item.icon}
              size={24}
              color={isActive ? "#1F78FF" : "#334155"}
            />
            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
              {item.label}
            </Text>
          </DimPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
