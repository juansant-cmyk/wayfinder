import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DimPressable from "./DimPressable";

// paddingTop + icon + label gap + label line (~8 + 24 + 2 + 13)
const NAV_BAR_CONTENT_HEIGHT = 47;
const SCROLL_CLEARANCE = 16;

export const NAV_ITEMS = [
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "home" },
  {
    label: "Itinerary",
    icon: "calendar-clear-outline",
    activeIcon: "calendar-clear",
    route: "itinerary",
  },
  { label: "Favorites", icon: "heart-outline", activeIcon: "heart", route: "favorites" },
  { label: "Maps", icon: "location-outline", activeIcon: "location", route: "maps" },
  { label: "Profile", icon: "person-outline", activeIcon: "person", route: "profile" },
];

/** Bottom inset inside the tab bar — shared by the bar and scroll clearance. */
export function getBottomNavBarPadding(insets = { bottom: 0 }) {
  const inset = insets.bottom ?? 0;

  if (inset > 0) {
    // White bar reaches the screen edge; icons sit just above the home indicator.
    return Math.max(inset - 12, 6);
  }

  return 8;
}

export function getBottomNavContentPadding(insets = { bottom: 0 }) {
  return NAV_BAR_CONTENT_HEIGHT + getBottomNavBarPadding(insets) + SCROLL_CLEARANCE;
}

export const BOTTOM_NAV_CONTENT_PADDING = getBottomNavContentPadding({ bottom: 34 });

export function getBottomNavActiveLabel(screen) {
  const activeByScreen = {
    home: "Home",
    itinerary: "Itinerary",
    favorites: "Favorites",
    maps: "Maps",
    profile: "Profile",
  };

  return activeByScreen[screen] || null;
}

export default function BottomNav({
  activeLabel = null,
  onNavigate,
  items = null,
}) {
  const insets = useSafeAreaInsets();
  const resolvedItems = items || NAV_ITEMS;
  const bottomPadding = getBottomNavBarPadding(insets);

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
    <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
      {resolvedItems.map((item) => {
        const isActive = item.label === activeLabel;

        return (
          <DimPressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
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
    paddingTop: 8,
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
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },

  bottomNavLabelActive: {
    color: "#1F78FF",
  },
});
