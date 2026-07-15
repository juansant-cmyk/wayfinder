import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import DimPressable from "./DimPressable";

export const BOTTOM_NAV_CONTENT_PADDING = 122;

const DEFAULT_NAV_ITEMS = [
  { label: "Home", icon: "home", route: "home" },
  { label: "Itinerary", icon: "calendar-clear", route: "itinerary" },
  { label: "Saved", icon: "bookmark-outline", route: "favorites" },
  { label: "Trips", icon: "briefcase-outline", route: "itinerary" },
  { label: "Profile", icon: "person-outline", route: "profile" },
];

export function getBottomNavActiveLabel(screen) {
  const activeByScreen = {
    home: "Home",
    hotels: "Home",
    itinerary: "Itinerary",
    favorites: "Saved",
    profile: "Profile",
  };

  return activeByScreen[screen] || null;
}

export default function BottomNav({
  activeLabel = null,
  onNavigate,
  items = DEFAULT_NAV_ITEMS,
}) {
  function handlePress(item) {
    if (item.label === "Home") {
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
      {items.map((item) => {
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
