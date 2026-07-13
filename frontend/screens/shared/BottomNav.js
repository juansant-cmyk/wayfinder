import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import DimPressable from "./DimPressable";
import { colors, fonts } from "../../theme/tokens";

export const BOTTOM_NAV_CONTENT_PADDING = 122;

const NAV_ITEMS = [
  { label: "Home", icon: "home", route: "home" },
  { label: "Itinerary", icon: "calendar-clear", route: "itinerary" },
  { label: "Saved", icon: "bookmark-outline", route: "favorites" },
  { label: "Trips", icon: "briefcase-outline", route: "trips" },
  { label: "Profile", icon: "person-outline", route: "profile" },
];

export function getBottomNavActiveLabel(screen) {
  const activeByScreen = {
    home: "Home",
    itinerary: "Itinerary",
    trips: "Trips",
    favorites: "Saved",
    profile: "Profile",
  };

  // Hotels and other feature screens are not bottom-nav tabs — no tab stays lit.
  return activeByScreen[screen] || null;
}

export function getBottomNavRoute(label) {
  return NAV_ITEMS.find((item) => item.label === label)?.route || null;
}

export default function BottomNav({ activeLabel = null, onNavigate }) {
  function handlePress(item) {
    // Always navigate so Home works from Hotels and Trips ≠ Itinerary.
    onNavigate?.(item.route);
  }

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
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
              name={item.icon}
              size={24}
              color={isActive ? colors.gold : colors.muted}
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },

  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomNavLabel: {
    marginTop: 5,
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
