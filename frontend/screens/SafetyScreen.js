import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import * as dashboardApi from "../src/api/dashboard";
import { deriveSafetyOverview, mapSafetyAlertsForScreen } from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { geocodeQuery, reverseGeocodeLabel } from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";

const LIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const heroRobotImage = require("../assets/images/safety/safety-shield-robot.png");
const bannerRobotImage = require("../assets/images/itinerary-tip-bot-reference.png");

const SAFETY_NAV_ITEMS = [
  { label: "Home", route: "home", icon: "home-outline", activeIcon: "home" },
  {
    label: "Itinerary",
    route: "itinerary",
    icon: "calendar-clear-outline",
    activeIcon: "calendar-clear",
  },
  { label: "Flights", route: "flights", icon: "airplane-outline", activeIcon: "airplane" },
  {
    label: "Safety",
    route: "safety",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
  },
  { label: "Profile", route: "profile", icon: "person-outline", activeIcon: "person" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const RISK_SCALE_COLORS = [
  "#14A44D",
  "#53B84A",
  "#8DCE47",
  "#C9D935",
  "#F1BE22",
  "#FFAC19",
  "#FF9418",
  "#FF771A",
  "#FF5A22",
  "#F43F32",
];

const SKYLINE_BUILDINGS = [
  { left: "2%", width: 44, height: 62 },
  { left: "11%", width: 34, height: 40 },
  { left: "18%", width: 58, height: 88 },
  { left: "29%", width: 42, height: 54 },
  { left: "37%", width: 74, height: 126 },
  { left: "51%", width: 52, height: 96 },
  { left: "63%", width: 42, height: 68 },
  { left: "72%", width: 64, height: 118 },
  { left: "85%", width: 40, height: 76 },
];

const DESTINATION_OPTIONS = [
  {
    id: "tokyo",
    label: "Tokyo, Japan",
    cityLabel: "Tokyo",
    aliases: ["tokyo", "japan", "tokyo japan"],
    updatedAt: new Date(2025, 4, 10, 9, 30),
    overall: {
      level: "low",
      label: "Low Risk",
      description:
        "Tokyo is currently a low risk destination.\nExercise normal safety precautions\nand follow local guidance.",
      indicatorLeft: "11%",
      about:
        "Low risk destinations still call for everyday precautions, but broad disruptions or major advisories are not currently expected.",
    },
    alerts: [
      {
        id: "tokyo-public-event",
        tone: "danger",
        label: "Safety Alert",
        title: "Large Public Event",
        location: "Shibuya, Tokyo",
        timestamp: "May 10, 2025 \u2022 8:45 AM",
        description:
          "Large event expected May 11. Expect increased\ncrowds, traffic restrictions, and possible delays.",
        details:
          "Crowd control measures are expected around Shibuya Crossing, station exits, and nearby arterial streets.",
      },
      {
        id: "tokyo-pickpocketing",
        tone: "advisory",
        label: "Safety Advisory",
        title: "Pickpocketing Reported",
        location: "Shinjuku, Tokyo",
        timestamp: "May 10, 2025 \u2022 7:15 AM",
        description:
          "Recent reports of pickpocketing in shopping\nareas and train stations. Keep belongings secure.",
        details:
          "Use zipped outer layers, keep phones out of back pockets, and stay especially alert on packed trains.",
      },
    ],
    categories: [
      {
        id: "crime",
        title: "Crime & Security",
        status: "Low Risk",
        iconFamily: "ion",
        iconName: "shield-checkmark",
        iconColor: "#1F78FF",
        iconBackground: "#EAF3FF",
      },
      {
        id: "health",
        title: "Health",
        status: "Low Risk",
        iconFamily: "material",
        iconName: "medical-bag",
        iconColor: "#149647",
        iconBackground: "#EAF9F0",
      },
      {
        id: "transportation",
        title: "Transportation",
        status: "Low Risk",
        iconFamily: "ion",
        iconName: "train-outline",
        iconColor: "#7D58F2",
        iconBackground: "#F1EAFF",
      },
      {
        id: "laws",
        title: "Local Laws",
        status: "Low Risk",
        iconFamily: "material",
        iconName: "bank-outline",
        iconColor: "#F59E0B",
        iconBackground: "#FFF5DE",
      },
      {
        id: "updates",
        title: "Local Updates",
        status: "1 Active",
        iconFamily: "ion",
        iconName: "megaphone-outline",
        iconColor: "#8B5CF6",
        iconBackground: "#F3EEFF",
      },
    ],
    tips: [
      {
        id: "belongings",
        title: "Secure your belongings",
        description:
          "Keep bags zipped and wallets in front pockets, especially in crowded areas.",
        detail:
          "Cross-body bags and zipped outer pockets work best on busy rail lines and during events.",
        iconFamily: "ion",
        iconName: "lock-closed",
        iconColor: "#1F78FF",
        iconBackground: "#EAF3FF",
      },
      {
        id: "awareness",
        title: "Stay aware of your surroundings",
        description:
          "Be mindful in busy places and avoid distractions while walking.",
        detail:
          "Pause inside a shop or station concourse if you need to check directions or your phone.",
        iconFamily: "ion",
        iconName: "location",
        iconColor: "#149647",
        iconBackground: "#EAF9F0",
      },
      {
        id: "contacts",
        title: "Important Contacts",
        description:
          "Police: 110  \u2022  Ambulance/Fire: 119  \u2022  Tourist Hotline: 03-3201-3331",
        detail: "Save these numbers before you head out so they are available even without service.",
        iconFamily: "ion",
        iconName: "call",
        iconColor: "#7D58F2",
        iconBackground: "#F1EAFF",
      },
    ],
  },
  {
    id: "seoul",
    label: "Seoul, South Korea",
    cityLabel: "Seoul",
    aliases: ["seoul", "south korea", "seoul south korea", "korea"],
    updatedAt: new Date(2025, 4, 10, 8, 55),
    overall: {
      level: "moderate",
      label: "Moderate Risk",
      description:
        "Seoul is currently a moderate risk destination.\nMonitor demonstrations and busy transit hubs,\nespecially during peak evening hours.",
      indicatorLeft: "43%",
      about:
        "Moderate risk destinations are generally manageable, but current conditions call for extra awareness around specific neighborhoods or disruptions.",
    },
    alerts: [
      {
        id: "seoul-demonstration",
        tone: "danger",
        label: "Safety Alert",
        title: "Large Demonstration Planned",
        location: "Gwanghwamun, Seoul",
        timestamp: "May 10, 2025 \u2022 8:20 AM",
        description:
          "Large demonstration expected downtown this evening.\nExpect road closures and intermittent transit delays.",
        details:
          "Avoid central protest corridors after 5 PM and allow extra time if you need to pass through Jongno District.",
      },
      {
        id: "seoul-subway",
        tone: "advisory",
        label: "Safety Advisory",
        title: "Transit Crowding Reported",
        location: "Line 2, Seoul",
        timestamp: "May 10, 2025 \u2022 7:40 AM",
        description:
          "Peak-hour congestion has led to platform crowding\nand longer wait times at major transfer stations.",
        details:
          "Plan alternate transfers when possible and keep valuables secured while boarding during rush hour.",
      },
    ],
    categories: [
      {
        id: "crime",
        title: "Crime & Security",
        status: "Low Risk",
        iconFamily: "ion",
        iconName: "shield-checkmark",
        iconColor: "#1F78FF",
        iconBackground: "#EAF3FF",
      },
      {
        id: "health",
        title: "Health",
        status: "Low Risk",
        iconFamily: "material",
        iconName: "medical-bag",
        iconColor: "#149647",
        iconBackground: "#EAF9F0",
      },
      {
        id: "transportation",
        title: "Transportation",
        status: "Moderate",
        iconFamily: "ion",
        iconName: "train-outline",
        iconColor: "#7D58F2",
        iconBackground: "#F1EAFF",
      },
      {
        id: "laws",
        title: "Local Laws",
        status: "Low Risk",
        iconFamily: "material",
        iconName: "bank-outline",
        iconColor: "#F59E0B",
        iconBackground: "#FFF5DE",
      },
      {
        id: "updates",
        title: "Local Updates",
        status: "2 Active",
        iconFamily: "ion",
        iconName: "megaphone-outline",
        iconColor: "#8B5CF6",
        iconBackground: "#F3EEFF",
      },
    ],
    tips: [
      {
        id: "belongings",
        title: "Keep valuables close",
        description:
          "Use zipped bags and keep your phone secure in crowded stations and shopping areas.",
        detail:
          "Move backpacks to your front on packed subway cars and be cautious on escalators near exits.",
        iconFamily: "ion",
        iconName: "lock-closed",
        iconColor: "#1F78FF",
        iconBackground: "#EAF3FF",
      },
      {
        id: "awareness",
        title: "Track local notices",
        description:
          "Watch for metro announcements, road closures, and district advisories before heading out.",
        detail:
          "A quick check before you leave can help you avoid demonstration routes and delays.",
        iconFamily: "ion",
        iconName: "location",
        iconColor: "#149647",
        iconBackground: "#EAF9F0",
      },
      {
        id: "contacts",
        title: "Important Contacts",
        description:
          "Police: 112  \u2022  Ambulance/Fire: 119  \u2022  Tourist Hotline: 1330",
        detail: "Keep the Korea Travel Hotline handy for translation help and regional guidance.",
        iconFamily: "ion",
        iconName: "call",
        iconColor: "#7D58F2",
        iconBackground: "#F1EAFF",
      },
    ],
  },
  {
    id: "lisbon",
    label: "Lisbon, Portugal",
    cityLabel: "Lisbon",
    aliases: ["lisbon", "portugal", "lisbon portugal"],
    updatedAt: new Date(2025, 4, 10, 7, 50),
    overall: {
      level: "low",
      label: "Low Risk",
      description:
        "Lisbon is currently a low risk destination.\nStay alert on trams and at major viewpoints,\nand follow standard city travel precautions.",
      indicatorLeft: "18%",
      about:
        "Low risk destinations may still have targeted nuisance crime or transport issues, but conditions remain broadly stable for travelers.",
    },
    alerts: [
      {
        id: "lisbon-viewpoint",
        tone: "danger",
        label: "Safety Alert",
        title: "Crowding Near Viewpoints",
        location: "Alfama, Lisbon",
        timestamp: "May 10, 2025 \u2022 8:05 AM",
        description:
          "Heavy visitor traffic expected near popular miradouros.\nWatch for bag snatching in photo-heavy areas.",
        details:
          "Visit earlier in the day when possible and keep straps close when stopping for photos.",
      },
      {
        id: "lisbon-tram",
        tone: "advisory",
        label: "Safety Advisory",
        title: "Pickpocketing Advisory",
        location: "Tram 28, Lisbon",
        timestamp: "May 10, 2025 \u2022 7:10 AM",
        description:
          "Recent reports of pickpocketing on historic trams\nand in dense queue areas near boarding points.",
        details:
          "Keep backpacks closed, avoid wallets in rear pockets, and stand clear of crowded doorways.",
      },
    ],
    categories: [
      {
        id: "crime",
        title: "Crime & Security",
        status: "Low Risk",
        iconFamily: "ion",
        iconName: "shield-checkmark",
        iconColor: "#1F78FF",
        iconBackground: "#EAF3FF",
      },
      {
        id: "health",
        title: "Health",
        status: "Low Risk",
        iconFamily: "material",
        iconName: "medical-bag",
        iconColor: "#149647",
        iconBackground: "#EAF9F0",
      },
      {
        id: "transportation",
        title: "Transportation",
        status: "Low Risk",
        iconFamily: "ion",
        iconName: "train-outline",
        iconColor: "#7D58F2",
        iconBackground: "#F1EAFF",
      },
      {
        id: "laws",
        title: "Local Laws",
        status: "Low Risk",
        iconFamily: "material",
        iconName: "bank-outline",
        iconColor: "#F59E0B",
        iconBackground: "#FFF5DE",
      },
      {
        id: "updates",
        title: "Local Updates",
        status: "1 Active",
        iconFamily: "ion",
        iconName: "megaphone-outline",
        iconColor: "#8B5CF6",
        iconBackground: "#F3EEFF",
      },
    ],
    tips: [
      {
        id: "belongings",
        title: "Secure your belongings",
        description:
          "Keep valuables close on trams, funiculars, and at crowded viewpoints.",
        detail:
          "Small cross-body bags work especially well when boarding packed public transit.",
        iconFamily: "ion",
        iconName: "lock-closed",
        iconColor: "#1F78FF",
        iconBackground: "#EAF3FF",
      },
      {
        id: "awareness",
        title: "Watch your footing",
        description:
          "Wear stable shoes and move carefully on steep hills, stairs, and slick stone streets.",
        detail:
          "A little extra care goes a long way around tram tracks and polished stone walkways.",
        iconFamily: "ion",
        iconName: "location",
        iconColor: "#149647",
        iconBackground: "#EAF9F0",
      },
      {
        id: "contacts",
        title: "Important Contacts",
        description:
          "Police: 112  \u2022  Medical Emergency: 112  \u2022  Tourism Support: 808-781-212",
        detail: "Save the national emergency number once and you will have both police and medical help covered.",
        iconFamily: "ion",
        iconName: "call",
        iconColor: "#7D58F2",
        iconBackground: "#F1EAFF",
      },
    ],
  },
];

const alertToneStyles = {
  danger: {
    borderColor: "#FFD5CF",
    backgroundColor: "#FFF8F6",
    badgeBackground: "#FFE6E2",
    badgeColor: "#F04D33",
    iconColor: "#F04D33",
    iconBackground: "#FFF0EC",
  },
  advisory: {
    borderColor: "#FFE7B7",
    backgroundColor: "#FFFBF2",
    badgeBackground: "#FFF0D4",
    badgeColor: "#F59E0B",
    iconColor: "#F59E0B",
    iconBackground: "#FFF5DF",
  },
};

const cardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 14px 28px rgba(143, 163, 191, 0.12)",
  },
  default: {
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});

const heroShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 24px 44px rgba(31, 120, 255, 0.16)",
  },
  default: {
    shadowColor: "#1F78FF",
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
});

function formatTimestamp(date) {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours24 >= 12 ? "PM" : "AM";

  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} \u2022 ${hours12}:${minutes} ${meridiem}`;
}

function normalizeDestinationValue(value) {
  return value.trim().toLowerCase();
}

function titleCaseWords(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDestinationLabel(value) {
  return value
    .split(",")
    .map((part) => titleCaseWords(part))
    .filter(Boolean)
    .join(", ");
}

function getCityFromLabel(label) {
  return label.split(",")[0]?.trim() || label.trim();
}

function getDestinationMatchIndex(query) {
  const normalizedQuery = normalizeDestinationValue(query);

  if (!normalizedQuery) {
    return -1;
  }

  return DESTINATION_OPTIONS.findIndex((option) => {
    const candidates = [option.label, ...(option.aliases || [])];
    return candidates.some((candidate) => {
      const normalizedCandidate = normalizeDestinationValue(candidate);
      return (
        normalizedCandidate === normalizedQuery ||
        normalizedCandidate.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedCandidate)
      );
    });
  });
}

function renderIcon(iconFamily, iconName, color, size) {
  if (iconFamily === "material") {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }

  return <Ionicons name={iconName} size={size} color={color} />;
}

function getOverallStyles(level) {
  if (level === "moderate") {
    return {
      color: "#D98200",
      softBackground: "#FFF4DE",
      iconName: "alert-circle",
      iconColor: "#D98200",
    };
  }

  if (level === "high") {
    return {
      color: "#E23D35",
      softBackground: "#FFE8E4",
      iconName: "warning",
      iconColor: "#E23D35",
    };
  }

  return {
    color: "#149647",
    softBackground: "#EAF9F0",
    iconName: "shield-checkmark",
    iconColor: "#149647",
  };
}

function getCategoryStatusColor(status) {
  if (status.toLowerCase().includes("active")) {
    return "#F04D33";
  }

  if (status.toLowerCase().includes("moderate")) {
    return "#D98200";
  }

  return "#149647";
}

function HeaderIconButton({ accessibilityLabel, iconName, iconSize, onPress, showDot = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionButtonPressed]}
    >
      <Ionicons name={iconName} size={iconSize} color="#111827" />
      {showDot ? <View style={styles.notificationDot} /> : null}
    </Pressable>
  );
}

function SkylineBackdrop() {
  return (
    <View pointerEvents="none" style={styles.skylineBackdrop}>
      {SKYLINE_BUILDINGS.map((building, index) => (
        <View
          key={`${building.left}-${index}`}
          style={[
            styles.skylineBuilding,
            {
              left: building.left,
              width: building.width,
              height: building.height,
            },
          ]}
        />
      ))}

      <View style={[styles.skylineCloud, styles.skylineCloudLeft]} />
      <View style={[styles.skylineCloud, styles.skylineCloudMiddle]} />
      <View style={[styles.skylineCloud, styles.skylineCloudRight]} />
    </View>
  );
}

function SafetyScale({ indicatorLeft }) {
  return (
    <View>
      <View style={styles.scaleTrack}>
        {RISK_SCALE_COLORS.map((color, index) => (
          <View
            key={`${color}-${index}`}
            style={[
              styles.scaleSegment,
              { backgroundColor: color },
              index === 0 && styles.scaleSegmentStart,
              index === RISK_SCALE_COLORS.length - 1 && styles.scaleSegmentEnd,
            ]}
          />
        ))}

        <View style={[styles.scaleIndicator, { left: indicatorLeft }]} />
      </View>

      <View style={styles.scaleLabelsRow}>
        <Text style={styles.scaleLabelText}>Low Risk</Text>
        <Text style={styles.scaleLabelText}>High Risk</Text>
      </View>
    </View>
  );
}

function AlertCard({ alert, isSelected, onPress, onDismiss, isPhone }) {
  const tone = alertToneStyles[alert.tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${alert.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.alertCard,
        cardShadowStyle,
        { borderColor: tone.borderColor, backgroundColor: tone.backgroundColor },
        isSelected && styles.alertCardSelected,
        pressed && styles.alertCardPressed,
      ]}
    >
      <View style={[styles.alertCardTopRow, isPhone && styles.alertCardTopRowCompact]}>
        <View style={[styles.alertBadge, { backgroundColor: tone.badgeBackground }]}>
          <Text style={[styles.alertBadgeText, { color: tone.badgeColor }]}>{alert.label}</Text>
        </View>
        <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
      </View>

      <View style={styles.alertCardBody}>
        <View style={[styles.alertIconWrap, { backgroundColor: tone.iconBackground }]}>
          <Ionicons name="warning" size={34} color={tone.iconColor} />
        </View>

        <View style={styles.alertCopy}>
          <Text style={styles.alertTitle}>{alert.title}</Text>

          <View style={styles.alertLocationRow}>
            <Ionicons name="location" size={15} color="#1F78FF" />
            <Text style={styles.alertLocationText}>{alert.location}</Text>
          </View>

          <Text style={styles.alertDescription}>{alert.description}</Text>
          {isSelected ? (
            <>
              <Text style={styles.alertDetailText}>{alert.details}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Dismiss ${alert.title}`}
                onPress={(event) => {
                  event.stopPropagation?.();
                  onDismiss();
                }}
                style={styles.alertDismissButton}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#1F78FF" />
                <Text style={styles.alertDismissText}>Dismiss alert</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <Ionicons
          name={isSelected ? "chevron-down" : "chevron-forward"}
          size={26}
          color="#0F2140"
          style={styles.alertChevron}
        />
      </View>
    </Pressable>
  );
}

function CategoryCard({ item, isSelected, onPress, width }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        cardShadowStyle,
        { width },
        isSelected && [styles.categoryCardSelected, { borderColor: item.iconColor }],
        pressed && styles.categoryCardPressed,
      ]}
    >
      <View style={[styles.categoryIconWrap, { backgroundColor: item.iconBackground }]}>
        {renderIcon(item.iconFamily, item.iconName, item.iconColor, 30)}
      </View>

      <Text style={styles.categoryTitle}>{item.title}</Text>
      <Text style={[styles.categoryStatus, { color: getCategoryStatusColor(item.status) }]}>
        {item.status}
      </Text>
    </Pressable>
  );
}

function TipRow({ tip, isSelected, isLast, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read ${tip.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tipRow,
        !isLast && styles.tipRowDivider,
        isSelected && styles.tipRowSelected,
        pressed && styles.tipRowPressed,
      ]}
    >
      <View style={styles.tipRowMain}>
        <View style={[styles.tipIconWrap, { backgroundColor: tip.iconBackground }]}>
          {renderIcon(tip.iconFamily, tip.iconName, tip.iconColor, 25)}
        </View>

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipDescription}>{tip.description}</Text>
          {isSelected ? <Text style={styles.tipDetail}>{tip.detail}</Text> : null}
        </View>

        <Ionicons
          name={isSelected ? "chevron-down" : "chevron-forward"}
          size={22}
          color="#0F2140"
          style={styles.tipChevron}
        />
      </View>
    </Pressable>
  );
}

export default function SafetyScreen({ onGoBack, onNavigateHome, onNavigate }) {
  const { width } = useWindowDimensions();
  const { refreshLocation } = useUserLocation();
  const isPhone = width < 560;
  const useScrollableCategories = width < 900;
  const pageMaxWidth = width >= 1180 ? 1020 : 960;

  const initialDestination = DESTINATION_OPTIONS[0];
  const [destinationIndex, setDestinationIndex] = useState(0);
  const [destinationInput, setDestinationInput] = useState("");
  const [appliedDestinationLabel, setAppliedDestinationLabel] = useState(initialDestination.label);
  const [lastUpdated, setLastUpdated] = useState(initialDestination.updatedAt);
  const [selectedAlertId, setSelectedAlertId] = useState(initialDestination.alerts[0]?.id ?? null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialDestination.categories[0]?.id ?? null);
  const [selectedTipId, setSelectedTipId] = useState(null);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetyError, setSafetyError] = useState("");
  const [isStale, setIsStale] = useState(false);
  const activeQueryRef = useRef({ destination: initialDestination.label });
  const requestInFlightRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const destination = DESTINATION_OPTIONS[destinationIndex];
  const displayDestinationLabel = appliedDestinationLabel || destination.label;
  const displayCityLabel = getCityFromLabel(displayDestinationLabel);
  const visibleAlerts = liveAlerts;
  const safetyOverview = deriveSafetyOverview(visibleAlerts, displayDestinationLabel);
  const overallDescription = safetyOverview.description;
  const overallStyles = getOverallStyles(safetyOverview.level);
  const categoryCardWidth = useScrollableCategories ? 154 : "18.6%";

  const loadSafety = useCallback(async (query = activeQueryRef.current, initial = false) => {
    if (requestInFlightRef.current) {
      return;
    }
    requestInFlightRef.current = true;
    if (initial) {
      setSafetyLoading(true);
    }
    setSafetyError("");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Sign in to load live safety alerts.");
      }
      const payload = await dashboardApi.fetchSafetyAlerts(token, query);
      const mapped = mapSafetyAlertsForScreen(payload);
      setLiveAlerts(mapped);
      setSelectedAlertId((currentId) =>
        mapped.some((alert) => alert.id === currentId) ? currentId : mapped[0]?.id ?? null
      );
      setLastUpdated(new Date());
      setIsStale(false);
    } catch (error) {
      setSafetyError(error?.message || "Couldn't refresh safety alerts.");
      setIsStale(true);
    } finally {
      requestInFlightRef.current = false;
      setSafetyLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialSafety() {
      const location = await refreshLocation();
      if (cancelled) return;
      if (location?.lat != null && location?.lng != null) {
        const label =
          (await reverseGeocodeLabel(location.lat, location.lng)) || initialDestination.label;
        if (cancelled) return;
        activeQueryRef.current = { destination: label, lat: location.lat, lng: location.lng };
        setAppliedDestinationLabel(label);
      }
      await loadSafety(activeQueryRef.current, true);
    }
    loadInitialSafety();
    return () => {
      cancelled = true;
    };
  }, [loadSafety, refreshLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (appStateRef.current === "active") loadSafety();
    }, LIVE_REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        loadSafety();
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loadSafety]);

  function applyDestination(nextIndex, nextLabel) {
    const nextDestination = DESTINATION_OPTIONS[nextIndex];

    setDestinationIndex(nextIndex);
    setAppliedDestinationLabel(nextLabel);
    setLastUpdated(new Date());
    setSelectedAlertId(null);
    setSelectedCategoryId(nextDestination.categories[0]?.id ?? null);
    setSelectedTipId(null);
    setShowSafetyInfo(false);
  }

  async function handleSubmitDestination() {
    const trimmedDestination = destinationInput.trim();

    if (!trimmedDestination) {
      return;
    }

    const matchedIndex = getDestinationMatchIndex(trimmedDestination);

    if (matchedIndex >= 0) {
      const matchedDestination = DESTINATION_OPTIONS[matchedIndex];
      setDestinationInput(matchedDestination.label);
      const geocoded = await geocodeQuery(matchedDestination.label);
      applyDestination(matchedIndex, matchedDestination.label, false);
      activeQueryRef.current = {
        destination: matchedDestination.label,
        ...(geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : {}),
      };
      await loadSafety(activeQueryRef.current, true);
      return;
    }

    const formattedLabel = formatDestinationLabel(trimmedDestination);
    setDestinationInput(formattedLabel);
    applyDestination(destinationIndex, formattedLabel, true);
    const geocoded = await geocodeQuery(formattedLabel);
    activeQueryRef.current = {
      destination: geocoded?.label || formattedLabel,
      ...(geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : {}),
    };
    if (geocoded?.label) {
      setAppliedDestinationLabel(geocoded.label);
    }
    await loadSafety(activeQueryRef.current, true);
  }

  function handleClearDestinationInput() {
    setDestinationInput("");
  }

  function handleRefreshTimestamp() {
    loadSafety();
  }

  async function handleDismissAlert(alertId) {
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to dismiss alerts.");
      await dashboardApi.dismissSafetyAlert(token, alertId);
      setLiveAlerts((alerts) => alerts.filter((alert) => alert.id !== alertId));
      setSelectedAlertId(null);
    } catch (error) {
      setSafetyError(error?.message || "Couldn't dismiss this alert.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, styles.scrollContentWithBottomNav]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.pageInner, { maxWidth: pageMaxWidth }]}>
            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onGoBack || onNavigateHome}
                style={styles.roundHeaderButton}
              >
                <Ionicons name="arrow-back" size={28} color="#14253E" />
              </DimPressable>

              <View style={styles.brandSlot}>
                <WayfinderBrand
                  containerStyle={styles.headerBrandRow}
                  textStyle={styles.headerBrandText}
                />
              </View>

              <View style={styles.headerActions}>
                <HeaderIconButton
                  accessibilityLabel="Notifications"
                  iconName="notifications-outline"
                  iconSize={28}
                  onPress={() => onNavigate?.("notifications")}
                  showDot
                />
                <HeaderIconButton
                  accessibilityLabel="Profile"
                  iconName="person-circle-outline"
                  iconSize={32}
                  onPress={() => onNavigate?.("profile")}
                />
              </View>
            </View>

            <View style={[styles.heroSection, heroShadowStyle, isPhone && styles.heroSectionPhone]}>
              <SkylineBackdrop />

              <View style={[styles.heroCopy, isPhone && styles.heroCopyPhone]}>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.heroTitle, isPhone && styles.heroTitlePhone]}>Safety</Text>
                  <Ionicons
                    name="shield-checkmark"
                    size={isPhone ? 34 : 44}
                    color="#1F78FF"
                  />
                </View>
                <Text style={[styles.heroSubtitle, isPhone && styles.heroSubtitlePhone]}>
                  Safety updates and alerts{"\n"}
                  for your destination.
                </Text>
              </View>

              <View style={[styles.heroArtworkWrap, isPhone && styles.heroArtworkWrapPhone]}>
                <Image
                  source={heroRobotImage}
                  resizeMode="cover"
                  style={styles.heroArtworkImage}
                />
              </View>
            </View>

            <View style={[styles.destinationPanel, heroShadowStyle, isPhone && styles.destinationPanelCompact]}>
              <View style={styles.destinationPanelGlow} />

              <View style={[styles.destinationPanelCopy, isPhone && styles.destinationPanelCopyCompact]}>
                <Text style={styles.destinationPanelTitle}>Where are you going?</Text>
                <Text style={styles.destinationPanelSubtitle}>
                  Get real-time safety updates{"\n"}
                  for your destination.
                </Text>
              </View>

              <View style={[styles.destinationPanelControls, isPhone && styles.destinationPanelControlsCompact]}>
                <View style={styles.destinationSelector}>
                  <Ionicons name="search-outline" size={22} color="#1F78FF" />
                  <TextInput
                    accessibilityLabel="Search for a destination"
                    value={destinationInput}
                    onChangeText={setDestinationInput}
                    placeholder="Search for a destination..."
                    placeholderTextColor="#7B8CA9"
                    selectionColor="#1F78FF"
                    returnKeyType="search"
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={styles.destinationInput}
                    onSubmitEditing={handleSubmitDestination}
                  />
                  {destinationInput ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear destination search"
                      onPress={handleClearDestinationInput}
                      style={({ pressed }) => [
                        styles.destinationClearButton,
                        pressed && styles.destinationClearButtonPressed,
                      ]}
                    >
                      <Ionicons name="close-circle" size={22} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>

                <View style={[styles.destinationUpdatedRow, isPhone && styles.destinationUpdatedRowCompact]}>
                  <Text style={styles.destinationUpdatedText}>
                    Last updated: {formatTimestamp(lastUpdated)}{isStale ? " (stale)" : ""}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Refresh safety updates"
                    onPress={handleRefreshTimestamp}
                    style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshButtonPressed]}
                  >
                    <Ionicons name="refresh" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, cardShadowStyle]}>
              <View style={[styles.sectionHeaderRow, isPhone && styles.sectionHeaderRowCompact]}>
                <Text style={styles.sectionHeaderTitle}>Overall Safety Level</Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowSafetyInfo((currentValue) => !currentValue)}
                  style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
                >
                  <Text style={styles.sectionLinkText}>About safety levels</Text>
                  <Ionicons name="information-circle-outline" size={20} color="#1F78FF" />
                </Pressable>
              </View>

              {showSafetyInfo ? (
                <View style={styles.safetyInfoBanner}>
                  <Text style={styles.safetyInfoText}>{destination.overall.about}</Text>
                </View>
              ) : null}

              <View style={[styles.overallRow, isPhone && styles.overallRowCompact]}>
                <View style={styles.overallCopyBlock}>
                  <View style={[styles.overallIconCircle, { backgroundColor: overallStyles.softBackground }]}>
                    <View style={[styles.overallIconInner, { backgroundColor: overallStyles.color }]}>
                      <Ionicons name={overallStyles.iconName} size={34} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.overallCopy}>
                    <Text style={[styles.overallLabel, { color: overallStyles.color }]}>
                      {safetyOverview.label}
                    </Text>
                    <Text style={styles.overallDescription}>{overallDescription}</Text>
                  </View>
                </View>

                <View style={styles.overallScaleBlock}>
                  <SafetyScale indicatorLeft={safetyOverview.indicatorLeft} />
                </View>
              </View>
            </View>

            <View style={styles.sectionTopRow}>
              <View style={styles.activeAlertsTitleWrap}>
                <Text style={styles.largeSectionTitle}>Active Alerts</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{visibleAlerts.length}</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedAlertId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={styles.sectionLinkText}>View all alerts</Text>
                <Ionicons name="chevron-forward" size={18} color="#1F78FF" />
              </Pressable>
            </View>

            <View style={styles.alertsList}>
              {safetyError ? <Text style={styles.liveStateText}>{safetyError}</Text> : null}
              {safetyLoading && visibleAlerts.length === 0 ? (
                <Text style={styles.liveStateText}>Loading current safety alerts...</Text>
              ) : null}
              {!safetyLoading && visibleAlerts.length === 0 ? (
                <Text style={styles.liveStateText}>No active alerts for this destination.</Text>
              ) : null}
              {visibleAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  isSelected={selectedAlertId === alert.id}
                  onPress={() =>
                    setSelectedAlertId((currentId) => (currentId === alert.id ? null : alert.id))
                  }
                  onDismiss={() => handleDismissAlert(alert.id)}
                  isPhone={isPhone}
                />
              ))}
            </View>

            <View style={styles.sectionTopRow}>
              <Text style={styles.largeSectionTitle}>Safety Categories</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCategoryId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={styles.sectionLinkText}>View all</Text>
              </Pressable>
            </View>

            {useScrollableCategories ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {destination.categories.map((item) => (
                  <CategoryCard
                    key={item.id}
                    item={item}
                    width={categoryCardWidth}
                    isSelected={selectedCategoryId === item.id}
                    onPress={() =>
                      setSelectedCategoryId((currentId) => (currentId === item.id ? null : item.id))
                    }
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.categoryGrid}>
                {destination.categories.map((item) => (
                  <CategoryCard
                    key={item.id}
                    item={item}
                    width={categoryCardWidth}
                    isSelected={selectedCategoryId === item.id}
                    onPress={() =>
                      setSelectedCategoryId((currentId) => (currentId === item.id ? null : item.id))
                    }
                  />
                ))}
              </View>
            )}

            <View style={styles.sectionTopRow}>
              <Text style={styles.largeSectionTitle}>Safety Tips for {displayCityLabel}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTipId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={styles.sectionLinkText}>View all tips</Text>
              </Pressable>
            </View>

            <View style={[styles.tipsCard, cardShadowStyle]}>
              {destination.tips.map((tip, index) => (
                <TipRow
                  key={tip.id}
                  tip={tip}
                  isSelected={selectedTipId === tip.id}
                  isLast={index === destination.tips.length - 1}
                  onPress={() =>
                    setSelectedTipId((currentId) => (currentId === tip.id ? null : tip.id))
                  }
                />
              ))}
            </View>

            <View style={[styles.pushBanner, cardShadowStyle, isPhone && styles.pushBannerCompact]}>
              <View style={styles.pushBannerMain}>
                <View style={styles.pushRobotWrap}>
                  <Image source={bannerRobotImage} resizeMode="contain" style={styles.pushRobotImage} />
                </View>

                <View style={styles.pushBannerCopy}>
                  <Text style={styles.pushBannerTitle}>Live safety updates are active.</Text>
                  <Text style={styles.pushBannerDescription}>
                    Alerts refresh every five minutes while the app is open.
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh live safety alerts"
                onPress={() => loadSafety()}
                style={({ pressed }) => [
                  styles.pushBannerButton,
                  styles.pushBannerButtonEnabled,
                  pressed && styles.pushBannerButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.pushBannerButtonText,
                    styles.pushBannerButtonTextEnabled,
                  ]}
                >
                  Refresh Alerts
                </Text>
                <Ionicons
                  name="refresh"
                  size={21}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <BottomNav activeLabel="Safety" items={SAFETY_NAV_ITEMS} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },

  liveStateText: {
    color: "#51607D",
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 16,
  },

  alertDismissButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#B9D4FF",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  alertDismissText: {
    color: "#1F78FF",
    fontSize: 13,
    fontWeight: "700",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },

  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  scrollContentWithBottomNav: {
    paddingBottom: BOTTOM_NAV_CONTENT_PADDING + 28,
  },

  pageInner: {
    width: "100%",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  roundHeaderButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  brandSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  headerBrandRow: {
    alignSelf: "auto",
    marginRight: 0,
  },

  headerBrandText: {
    fontSize: 26,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerActionButton: {
    width: 50,
    height: 50,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionButtonPressed: {
    opacity: 0.7,
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF7A32",
  },

  heroSection: {
    position: "relative",
    marginTop: 16,
    minHeight: 236,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
  },

  heroSectionPhone: {
    minHeight: 220,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },

  skylineBackdrop: {
    ...StyleSheet.absoluteFillObject,
    bottom: 16,
    left: 16,
    right: 16,
  },

  skylineBuilding: {
    position: "absolute",
    bottom: 2,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: "rgba(31, 120, 255, 0.08)",
  },

  skylineCloud: {
    position: "absolute",
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(31, 120, 255, 0.06)",
  },

  skylineCloudLeft: {
    top: 84,
    left: "8%",
    width: 54,
  },

  skylineCloudMiddle: {
    top: 60,
    left: "44%",
    width: 70,
  },

  skylineCloudRight: {
    top: 104,
    right: "10%",
    width: 48,
  },

  heroCopy: {
    zIndex: 2,
    flex: 1,
    minWidth: 0,
    maxWidth: "55%",
    paddingRight: 14,
  },

  heroCopyPhone: {
    maxWidth: "56%",
    paddingRight: 10,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  heroTitle: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -1.4,
  },

  heroTitlePhone: {
    fontSize: 44,
    lineHeight: 48,
  },

  heroSubtitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "500",
    color: "#3F4F6B",
    letterSpacing: -0.3,
  },

  heroSubtitlePhone: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },

  heroArtworkWrap: {
    zIndex: 2,
    position: "relative",
    width: "41%",
    minWidth: 252,
    maxWidth: 376,
    height: 168,
    overflow: "hidden",
    borderRadius: 24,
    alignItems: "stretch",
    justifyContent: "center",
  },

  heroArtworkWrapPhone: {
    width: "42%",
    minWidth: 148,
    maxWidth: 176,
    height: 136,
    borderRadius: 18,
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  destinationPanel: {
    position: "relative",
    marginTop: 12,
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    backgroundColor: "#0D68F2",
  },

  destinationPanelCompact: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    flexDirection: "column",
    alignItems: "stretch",
  },

  destinationPanelGlow: {
    position: "absolute",
    top: -84,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  destinationPanelCopy: {
    flex: 1,
    maxWidth: 320,
  },

  destinationPanelCopyCompact: {
    maxWidth: "100%",
  },

  destinationPanelTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.7,
  },

  destinationPanelSubtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 28,
    color: "rgba(255, 255, 255, 0.92)",
  },

  destinationPanelControls: {
    width: "52%",
    minWidth: 290,
    alignItems: "stretch",
  },

  destinationPanelControlsCompact: {
    width: "100%",
    minWidth: 0,
  },

  destinationSelector: {
    minHeight: 72,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  destinationInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: "#0F2140",
  },

  destinationClearButton: {
    marginLeft: 8,
    padding: 2,
  },

  destinationClearButtonPressed: {
    opacity: 0.7,
  },

  destinationUpdatedRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  destinationUpdatedRowCompact: {
    alignItems: "flex-start",
  },

  destinationUpdatedText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.96)",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  refreshButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  sectionCard: {
    marginTop: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  sectionHeaderRow: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E6EEF9",
  },

  sectionHeaderRowCompact: {
    alignItems: "flex-start",
  },

  sectionHeaderTitle: {
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#0F2140",
    letterSpacing: -0.4,
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  sectionLinkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#1F78FF",
  },

  linkPressed: {
    opacity: 0.7,
  },

  safetyInfoBanner: {
    marginHorizontal: 22,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#EEF5FF",
  },

  safetyInfoText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#385173",
  },

  overallRow: {
    paddingTop: 22,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  overallRowCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  overallCopyBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  overallIconCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: "center",
    justifyContent: "center",
  },

  overallIconInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  overallCopy: {
    flex: 1,
  },

  overallLabel: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  overallDescription: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 28,
    color: "#32435F",
  },

  overallScaleBlock: {
    width: 320,
    maxWidth: "100%",
  },

  scaleTrack: {
    position: "relative",
    height: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#E6EEF9",
  },

  scaleSegment: {
    flex: 1,
    height: "100%",
  },

  scaleSegmentStart: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },

  scaleSegmentEnd: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },

  scaleIndicator: {
    position: "absolute",
    top: -7,
    width: 14,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1E2D5A",
    backgroundColor: "#283F73",
    transform: [{ translateX: -7 }],
  },

  scaleLabelsRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scaleLabelText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#21314F",
  },

  sectionTopRow: {
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  activeAlertsTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  largeSectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#0F2140",
    letterSpacing: -0.4,
  },

  countBadge: {
    minWidth: 31,
    height: 31,
    paddingHorizontal: 9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F04D33",
  },

  countBadgeText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  alertsList: {
    gap: 14,
  },

  alertCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },

  alertCardSelected: {
    borderWidth: 2,
  },

  alertCardPressed: {
    opacity: 0.96,
  },

  alertCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  alertCardTopRowCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
  },

  alertBadge: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  alertBadgeText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },

  alertTimestamp: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5B6D8A",
  },

  alertCardBody: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  alertIconWrap: {
    width: 66,
    height: 66,
    marginRight: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  alertCopy: {
    flex: 1,
  },

  alertTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -0.4,
  },

  alertLocationRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  alertLocationText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#3366C5",
  },

  alertDescription: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 26,
    color: "#2F405C",
  },

  alertDetailText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#51637E",
  },

  alertChevron: {
    marginLeft: 12,
    marginTop: 18,
  },

  categoryScrollContent: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 14,
  },

  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  categoryCard: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6EEF9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  categoryCardSelected: {
    backgroundColor: "#FAFCFF",
  },

  categoryCardPressed: {
    opacity: 0.95,
  },

  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryTitle: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#0F2140",
  },

  categoryStatus: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },

  tipsCard: {
    marginTop: 2,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  tipRow: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },

  tipRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEF9",
  },

  tipRowSelected: {
    backgroundColor: "#F9FBFF",
  },

  tipRowPressed: {
    opacity: 0.97,
  },

  tipRowMain: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  tipIconWrap: {
    width: 52,
    height: 52,
    marginRight: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  tipCopy: {
    flex: 1,
  },

  tipTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -0.3,
  },

  tipDescription: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 24,
    color: "#32435F",
  },

  tipDetail: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#587093",
  },

  tipChevron: {
    marginLeft: 10,
    marginTop: 14,
  },

  pushBanner: {
    marginTop: 22,
    marginBottom: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    backgroundColor: "#EEF5FF",
  },

  pushBannerCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  pushBannerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  pushRobotWrap: {
    width: 62,
    height: 62,
    marginRight: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  pushRobotImage: {
    width: 46,
    height: 46,
  },

  pushBannerCopy: {
    flex: 1,
  },

  pushBannerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -0.3,
  },

  pushBannerDescription: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: "#40516D",
  },

  pushBannerButton: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#B9D3FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },

  pushBannerButtonEnabled: {
    borderColor: "#1F78FF",
    backgroundColor: "#1F78FF",
  },

  pushBannerButtonPressed: {
    opacity: 0.96,
  },

  pushBannerButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#1F78FF",
  },

  pushBannerButtonTextEnabled: {
    color: "#FFFFFF",
  },
});
