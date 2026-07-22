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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import * as dashboardApi from "../src/api/dashboard";
import { mapSafetyReportForScreen } from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { geocodeQuery, reverseGeocodeQuery, suggestGeocodeQuery } from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";

const LIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const heroRobotImage = require("../assets/images/safety/safety-shield-robot.png");
const bannerRobotImage = require("../assets/images/itinerary-tip-bot-reference.png");

const PERMANENT_SAFETY_CATEGORIES = [
  {
    id: "crime",
    title: "Crime & Security",
    status: "Low Risk",
    description: "Exercise normal safety precautions and follow local guidance.",
    iconFamily: "ion",
    iconName: "shield-checkmark",
    iconColor: "#1F78FF",
    iconBackground: "#EAF3FF",
  },
  {
    id: "health",
    title: "Health",
    status: "Low Risk",
    description: "Follow standard health guidance and local medical recommendations.",
    iconFamily: "ion",
    iconName: "medkit",
    iconColor: "#149647",
    iconBackground: "#EAF9F0",
  },
  {
    id: "transportation",
    title: "Transportation",
    status: "Low Risk",
    description: "Check local transit updates before traveling.",
    iconFamily: "ion",
    iconName: "train",
    iconColor: "#7D58F2",
    iconBackground: "#F1EAFF",
  },
  {
    id: "laws",
    title: "Local Laws",
    status: "Low Risk",
    description: "Respect local laws and cultural norms while traveling.",
    iconFamily: "material",
    iconName: "bank",
    iconColor: "#D98200",
    iconBackground: "#FFF4DE",
  },
  {
    id: "updates",
    title: "Local Updates",
    status: "None",
    description: "No active local updates right now.",
    iconFamily: "ion",
    iconName: "megaphone",
    iconColor: "#7D58F2",
    iconBackground: "#F1EAFF",
  },
];

const PERMANENT_SAFETY_TIPS = [
  {
    id: "tip-belongings",
    title: "Secure your belongings",
    description: "Keep bags zipped and wallets in front pockets, especially in crowded areas.",
    detail: "Use hotel safes for passports and valuables when available.",
    source: "Wayfinder safety tips",
    iconFamily: "ion",
    iconName: "lock-closed",
    iconColor: "#1F78FF",
    iconBackground: "#EAF3FF",
  },
  {
    id: "tip-aware",
    title: "Stay aware of your surroundings",
    description: "Be mindful in busy places and avoid distractions while walking.",
    detail: "Stay in well-lit areas and trust your instincts if a situation feels unsafe.",
    source: "Wayfinder safety tips",
    iconFamily: "ion",
    iconName: "eye",
    iconColor: "#149647",
    iconBackground: "#EAF9F0",
  },
  {
    id: "tip-contacts",
    title: "Important Contacts",
    description: "Police: 110 • Ambulance/Fire: 119 • Tourist Hotline: 03-3201-3331",
    detail: "Save local emergency numbers and your consulate contacts before you travel.",
    source: "Wayfinder safety tips",
    iconFamily: "ion",
    iconName: "call",
    iconColor: "#7D58F2",
    iconBackground: "#F1EAFF",
  },
];

const RISK_STATUS_BY_LEVEL = {
  low: "Low Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
  extreme: "Extreme Risk",
};

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
  { left: "2%", width: 28, height: 36 },
  { left: "11%", width: 22, height: 24 },
  { left: "18%", width: 36, height: 52 },
  { left: "29%", width: 26, height: 32 },
  { left: "37%", width: 46, height: 72 },
  { left: "51%", width: 32, height: 56 },
  { left: "63%", width: 26, height: 40 },
  { left: "72%", width: 40, height: 68 },
  { left: "85%", width: 24, height: 44 },
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

function toPlainText(value) {
  if (value == null) {
    return "";
  }

  return String(value)
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const codePoint = Number.parseInt(hex, 16);
      if (!Number.isFinite(codePoint)) {
        return "";
      }
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return "";
      }
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const codePoint = Number.parseInt(dec, 10);
      if (!Number.isFinite(codePoint)) {
        return "";
      }
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return "";
      }
    })
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<\/\s*p\s*>/gi, " ")
    .replace(/<\s*p[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&ensp;|&emsp;|&thinsp;|&nnbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/[\u00A0\u202F\u2007\u2060\u2009\u200A]/g, " ")
    .replace(/&#\d+;|&#x[0-9a-fA-F]+;|&[a-zA-Z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ADVISORY_FALLBACK_MESSAGE =
  "Safety advisory details are currently unavailable. Please refresh or review the official travel advisory.";

function sanitizeAdvisoryDescription(value) {
  const plain = toPlainText(value);
  if (!plain || plain.length < 8) {
    return ADVISORY_FALLBACK_MESSAGE;
  }
  if (/&#\d+;|&#x[0-9a-fA-F]+;|&[a-zA-Z]+;/i.test(plain)) {
    return ADVISORY_FALLBACK_MESSAGE;
  }
  if (/^\s*[{[]/.test(plain) && /"(error|detail|message)"/i.test(plain)) {
    return ADVISORY_FALLBACK_MESSAGE;
  }
  if (/TRAVEL_RISK_API_KEY|Traceback|Exception:|HTTPException/i.test(plain)) {
    return ADVISORY_FALLBACK_MESSAGE;
  }
  return plain;
}

function dedupeRepeatedText(value) {
  const text = toPlainText(value);
  if (text.length < 40) {
    return text;
  }

  const midpoint = Math.floor(text.length / 2);
  const first = text.slice(0, midpoint).trim();
  const second = text.slice(midpoint).trim();
  if (first && first === second) {
    return first;
  }

  if (text.length % 2 === 0) {
    const left = text.slice(0, text.length / 2);
    const right = text.slice(text.length / 2);
    if (left === right) {
      return left.trim();
    }
  }

  return text;
}

function buildPermanentCategories(liveCategories, liveAlerts, riskLevel) {
  const byId = Object.fromEntries((liveCategories || []).map((item) => [item.id, item]));
  const alertCount = Array.isArray(liveAlerts) ? liveAlerts.length : 0;
  const advisory = byId.advisory;
  const disruptions = byId.disruptions;

  return PERMANENT_SAFETY_CATEGORIES.map((base) => {
    if (base.id === "crime") {
      const status =
        RISK_STATUS_BY_LEVEL[riskLevel] ||
        (/\blevel\s*[01]\b/i.test(String(advisory?.status || ""))
          ? "Low Risk"
          : base.status);
      return {
        ...base,
        status,
        description: toPlainText(advisory?.description) || base.description,
      };
    }

    if (base.id === "transportation") {
      const rawStatus = String(disruptions?.status || "");
      const status = !rawStatus || /none/i.test(rawStatus) ? "Low Risk" : "Caution";
      return {
        ...base,
        status,
        description: toPlainText(disruptions?.description) || base.description,
      };
    }

    if (base.id === "updates") {
      return {
        ...base,
        status: alertCount > 0 ? `${alertCount} Active` : "None",
        description:
          alertCount > 0
            ? "Current country hazards and destination weather warnings."
            : base.description,
      };
    }

    return base;
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

  if (level === "high" || level === "extreme") {
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
  if (status.toLowerCase().includes("extreme") || status.toLowerCase().includes("high")) {
    return "#E23D35";
  }
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
  const warningIconSize = isPhone ? 22 : 26;
  const chevronSize = isPhone ? 20 : 22;
  const description = dedupeRepeatedText(alert.description);
  const details = dedupeRepeatedText(alert.details);
  const showDetails = Boolean(isSelected && details && details !== description);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${alert.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.alertCard,
        isPhone && styles.alertCardPhone,
        cardShadowStyle,
        { borderColor: tone.borderColor, backgroundColor: tone.backgroundColor },
        isSelected && styles.alertCardSelected,
        pressed && styles.alertCardPressed,
      ]}
    >
      <View style={styles.alertCardTopRow}>
        <View style={[styles.alertBadge, isPhone && styles.alertBadgePhone, { backgroundColor: tone.badgeBackground }]}>
          <Text style={[styles.alertBadgeText, isPhone && styles.alertBadgeTextPhone, { color: tone.badgeColor }]}>
            {toPlainText(alert.label)}
          </Text>
        </View>
        <Text style={[styles.alertTimestamp, isPhone && styles.alertTimestampPhone]} numberOfLines={1}>
          {alert.timestamp}
        </Text>
      </View>

      <View style={[styles.alertCardBody, isPhone && styles.alertCardBodyPhone]}>
        <View
          style={[
            styles.alertIconWrap,
            isPhone && styles.alertIconWrapPhone,
            { backgroundColor: tone.iconBackground },
          ]}
        >
          <Ionicons name="warning" size={warningIconSize} color={tone.iconColor} />
        </View>

        <View style={styles.alertCopy}>
          <Text style={[styles.alertTitle, isPhone && styles.alertTitlePhone]}>
            {toPlainText(alert.title)}
          </Text>

          <View style={styles.alertLocationRow}>
            <Ionicons name="location" size={isPhone ? 13 : 14} color="#1F78FF" />
            <Text style={[styles.alertLocationText, isPhone && styles.alertLocationTextPhone]}>
              {alert.location}
            </Text>
          </View>

          <Text style={[styles.alertDescription, isPhone && styles.alertDescriptionPhone]}>
            {description}
          </Text>
          {showDetails ? <Text style={styles.alertDetailText}>{details}</Text> : null}
          {isSelected ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Dismiss ${alert.title}`}
              onPress={(event) => {
                event.stopPropagation?.();
                onDismiss();
              }}
              style={styles.alertDismissButton}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#1F78FF" />
              <Text style={styles.alertDismissText}>Dismiss alert</Text>
            </Pressable>
          ) : null}
        </View>

        <Ionicons
          name={isSelected ? "chevron-down" : "chevron-forward"}
          size={chevronSize}
          color="#0F2140"
          style={[styles.alertChevron, isPhone && styles.alertChevronPhone]}
        />
      </View>
    </Pressable>
  );
}

function CategoryCard({ item, isSelected, onPress, width, compact }) {
  const iconSize = compact ? 22 : 26;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        compact && styles.categoryCardCompact,
        cardShadowStyle,
        { width },
        isSelected && [styles.categoryCardSelected, { borderColor: item.iconColor }],
        pressed && styles.categoryCardPressed,
      ]}
    >
      <View
        style={[
          styles.categoryIconWrap,
          compact && styles.categoryIconWrapCompact,
          { backgroundColor: item.iconBackground },
        ]}
      >
        {renderIcon(item.iconFamily, item.iconName, item.iconColor, iconSize)}
      </View>

      <Text style={[styles.categoryTitle, compact && styles.categoryTitleCompact]}>{item.title}</Text>
      <Text
        style={[
          styles.categoryStatus,
          compact && styles.categoryStatusCompact,
          { color: getCategoryStatusColor(item.status) },
        ]}
      >
        {item.status}
      </Text>
      {isSelected ? (
        <Text style={styles.categoryDescription}>{item.description}</Text>
      ) : null}
    </Pressable>
  );
}

function TipRow({ tip, isSelected, isLast, onPress, compact }) {
  const iconSize = compact ? 20 : 22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read ${tip.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tipRow,
        compact && styles.tipRowCompact,
        !isLast && styles.tipRowDivider,
        isSelected && styles.tipRowSelected,
        pressed && styles.tipRowPressed,
      ]}
    >
      <View style={[styles.tipRowMain, compact && styles.tipRowMainCompact]}>
        <View
          style={[
            styles.tipIconWrap,
            compact && styles.tipIconWrapCompact,
            { backgroundColor: tip.iconBackground },
          ]}
        >
          {renderIcon(tip.iconFamily, tip.iconName, tip.iconColor, iconSize)}
        </View>

        <View style={styles.tipCopy}>
          <Text style={[styles.tipTitle, compact && styles.tipTitleCompact]}>{tip.title}</Text>
          <Text style={[styles.tipDescription, compact && styles.tipDescriptionCompact]}>
            {tip.description}
          </Text>
          {isSelected ? (
            <>
              <Text style={styles.tipDetail}>{tip.detail}</Text>
              <Text style={styles.tipSource}>{tip.source}</Text>
            </>
          ) : null}
        </View>

        <Ionicons
          name={isSelected ? "chevron-down" : "chevron-forward"}
          size={compact ? 18 : 20}
          color="#0F2140"
          style={[styles.tipChevron, compact && styles.tipChevronCompact]}
        />
      </View>
    </Pressable>
  );
}

export default function SafetyScreen({ onGoBack, onNavigateHome, onNavigate }) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width } = useWindowDimensions();
  const { refreshLocation } = useUserLocation();
  const isPhone = width < 520;
  const isCompactPhone = width < 400;
  const isHeroStacked = width < 360;
  const useScrollableCategories = width < 900;
  const pageMaxWidth = width >= 1100 ? 780 : width >= 900 ? 740 : 700;
  const pageWidth = Math.min(Math.max(width - (isCompactPhone ? 20 : isPhone ? 24 : 28), 280), pageMaxWidth);
  const pagePaddingHorizontal = isCompactPhone ? 10 : isPhone ? 12 : 14;
  const showBackButton = width < 760 && typeof (onGoBack || onNavigateHome) === "function";
  // Hero art is 1084×402 — size near natural aspect ratio (avoid soft upscaling / cropping).
  const heroAspectRatio = 1084 / 402;
  const heroArtworkMaxWidth = isHeroStacked
    ? Math.min(pageWidth * 0.9, 300)
    : isCompactPhone
      ? Math.min(pageWidth * 0.52, 190)
      : isPhone
        ? Math.min(pageWidth * 0.5, 220)
        : width < 900
          ? Math.min(pageWidth * 0.44, 280)
          : Math.min(pageWidth * 0.42, 320);
  const heroArtworkTargetHeight = isHeroStacked
    ? 108
    : isCompactPhone
      ? 82
      : isPhone
        ? 92
        : width < 900
          ? 104
          : 118;
  const heroArtworkWidth = Math.min(
    heroArtworkMaxWidth,
    Math.round(heroArtworkTargetHeight * heroAspectRatio)
  );
  const heroArtworkHeight = Math.round(heroArtworkWidth / heroAspectRatio);
  const heroTitleSize = isCompactPhone ? 32 : isPhone ? 36 : width < 900 ? 42 : 46;
  const heroSubtitleSize = isCompactPhone ? 12 : isPhone ? 13 : 14;
  const headerIconSize = isPhone ? 20 : 22;
  const profileIconSize = isPhone ? 26 : 28;
  const categoryCardWidth = useScrollableCategories
    ? isCompactPhone
      ? 118
      : isPhone
        ? 128
        : 138
    : "18.6%";
  const compactCards = isPhone;

  const initialDestinationLabel = "Bali, Indonesia";
  const [destinationInput, setDestinationInput] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [destinationSuggestLoading, setDestinationSuggestLoading] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [appliedDestinationLabel, setAppliedDestinationLabel] = useState(initialDestinationLabel);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedTipId, setSelectedTipId] = useState(null);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveReport, setLiveReport] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetyError, setSafetyError] = useState("");
  const [isStale, setIsStale] = useState(false);
  const activeQueryRef = useRef({ destination: initialDestinationLabel, countryIso: "IDN" });
  const requestInFlightRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const mountedRef = useRef(true);

  const destination = {
    overall: liveReport?.risk || {
      level: "low",
      label: "Loading risk",
      indicatorLeft: "1%",
      description: "Loading current country-level safety information.",
      about:
        "Risk information is country-level and does not represent a city crime, health, or transportation score.",
    },
    categories: buildPermanentCategories(
      liveReport?.categories,
      liveAlerts,
      liveReport?.risk?.level
    ),
    tips: PERMANENT_SAFETY_TIPS,
  };
  const displayDestinationLabel = liveReport?.destinationLabel || appliedDestinationLabel;
  const displayCountryLabel =
    liveReport?.countryName && liveReport.countryName !== "Unknown country"
      ? liveReport.countryName
      : displayDestinationLabel.split(",")[0]?.trim() || displayDestinationLabel;
  const visibleAlerts = liveAlerts;
  const safetyOverview = destination.overall;
  const overallDescription = sanitizeAdvisoryDescription(safetyOverview.description);
  const overallStyles = getOverallStyles(safetyOverview.level);
  const overallIconSize = isPhone ? 24 : 28;
  const overallCircleSize = isPhone ? 72 : 88;
  const overallInnerSize = isPhone ? 42 : 52;

  const loadSafety = useCallback(async (query = activeQueryRef.current, initial = false) => {
    if (requestInFlightRef.current) {
      return;
    }
    requestInFlightRef.current = true;
    setSafetyLoading(true);
    setSafetyError("");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Sign in to load live safety alerts.");
      }
      const payload = await dashboardApi.fetchSafetyReport(token, query);
      const mappedReport = mapSafetyReportForScreen(payload);
      if (!mountedRef.current) return;
      const mapped = mappedReport.alerts;
      activeQueryRef.current = {
        ...query,
        destination: mappedReport.destinationLabel,
        ...(mappedReport.countryIso ? { countryIso: mappedReport.countryIso } : {}),
      };
      setLiveReport(mappedReport);
      setLiveAlerts(mapped);
      setAppliedDestinationLabel(mappedReport.destinationLabel);
      setSelectedCategoryId((currentId) =>
        PERMANENT_SAFETY_CATEGORIES.some((item) => item.id === currentId) ? currentId : null
      );
      setSelectedAlertId((currentId) =>
        mapped.some((alert) => alert.id === currentId) ? currentId : null
      );
      setSelectedTipId((currentId) =>
        PERMANENT_SAFETY_TIPS.some((tip) => tip.id === currentId) ? currentId : null
      );
      setLastUpdated(mappedReport.fetchedAt);
      setIsStale(mappedReport.isStale);
    } catch (error) {
      if (!mountedRef.current) return;
      setSafetyError("Couldn't refresh safety updates. Please try again.");
      setIsStale(true);
    } finally {
      requestInFlightRef.current = false;
      if (mountedRef.current) setSafetyLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialSafety() {
      const location = await refreshLocation();
      if (cancelled) return;
      if (location?.lat != null && location?.lng != null) {
        const resolved = await reverseGeocodeQuery(location.lat, location.lng);
        const label = resolved?.label || initialDestinationLabel;
        if (cancelled) return;
        activeQueryRef.current = {
          destination: label,
          lat: location.lat,
          lng: location.lng,
          ...(resolved?.countryIso ? { countryIso: resolved.countryIso } : {}),
        };
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

  useEffect(() => {
    const query = destinationInput.trim();
    if (query.length < 2 || query.toLowerCase() === displayDestinationLabel.toLowerCase()) {
      setDestinationSuggestions([]);
      setDestinationSuggestLoading(false);
      setShowDestinationSuggestions(false);
      return undefined;
    }

    let cancelled = false;
    setDestinationSuggestLoading(true);
    setShowDestinationSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const results = await suggestGeocodeQuery(query, 5);
        if (!cancelled) {
          setDestinationSuggestions(results);
        }
      } catch {
        if (!cancelled) {
          setDestinationSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setDestinationSuggestLoading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destinationInput, displayDestinationLabel]);

  function applyDestination(nextLabel) {
    setAppliedDestinationLabel(nextLabel);
    setLastUpdated(new Date());
    setSelectedAlertId(null);
    setSelectedCategoryId(null);
    setSelectedTipId(null);
    setShowSafetyInfo(false);
  }

  async function handleSubmitDestination() {
    const trimmedDestination = destinationInput.trim();

    if (!trimmedDestination) {
      return;
    }

    if (destinationSuggestions.length > 0) {
      await handleSelectDestinationSuggestion(destinationSuggestions[0]);
      return;
    }

    const formattedLabel = formatDestinationLabel(trimmedDestination);
    setDestinationInput(formattedLabel);
    setShowDestinationSuggestions(false);
    applyDestination(formattedLabel);
    const geocoded = await geocodeQuery(formattedLabel);
    activeQueryRef.current = {
      destination: geocoded?.label || formattedLabel,
      ...(geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : {}),
      ...(geocoded?.countryIso ? { countryIso: geocoded.countryIso } : {}),
    };
    if (geocoded?.label) {
      setAppliedDestinationLabel(geocoded.label);
    }
    await loadSafety(activeQueryRef.current, true);
  }

  function handleClearDestinationInput() {
    setDestinationInput("");
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
  }

  async function handleSelectDestinationSuggestion(suggestion) {
    const label = suggestion.label;
    setDestinationInput(label);
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
    applyDestination(label);
    activeQueryRef.current = {
      destination: label,
      lat: suggestion.lat,
      lng: suggestion.lng,
      ...(suggestion.countryIso ? { countryIso: suggestion.countryIso } : {}),
    };
    await loadSafety(activeQueryRef.current, true);
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
      await loadSafety();
    } catch (error) {
      setSafetyError(error?.message || "Couldn't dismiss this alert.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: bottomNavPadding,
              paddingHorizontal: pagePaddingHorizontal,
              paddingTop: isPhone ? 8 : 10,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.pageInner, { width: pageWidth, maxWidth: pageMaxWidth }]}>
            <View style={styles.headerRow}>
              {showBackButton ? (
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={onGoBack || onNavigateHome}
                  style={styles.headerBackButton}
                >
                  <Ionicons name="arrow-back" size={isPhone ? 18 : 20} color="#14253E" />
                </DimPressable>
              ) : null}

              <View style={styles.headerActions}>
                <HeaderIconButton
                  accessibilityLabel="Notifications"
                  iconName="notifications-outline"
                  iconSize={headerIconSize}
                  onPress={() => onNavigate?.("notifications")}
                  showDot
                />
                <HeaderIconButton
                  accessibilityLabel="Profile"
                  iconName="person-circle-outline"
                  iconSize={profileIconSize}
                  onPress={() => onNavigate?.("profile")}
                />
              </View>
            </View>

            <View
              style={[
                styles.heroSection,
                isHeroStacked && styles.heroSectionStacked,
                isPhone && styles.heroSectionPhone,
              ]}
            >
              <SkylineBackdrop />

              <View
                style={[
                  styles.heroCopy,
                  isHeroStacked && styles.heroCopyStacked,
                  isPhone && styles.heroCopyPhone,
                ]}
              >
                <View style={styles.heroTitleRow}>
                  <Text
                    style={[
                      styles.heroTitle,
                      {
                        fontSize: heroTitleSize,
                        lineHeight: heroTitleSize + 4,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    Safety
                  </Text>
                  <Ionicons
                    name="shield-checkmark"
                    size={isCompactPhone ? 26 : isPhone ? 30 : 34}
                    color="#1F78FF"
                    style={styles.heroTitleIcon}
                  />
                </View>
                <Text
                  style={[
                    styles.heroSubtitle,
                    {
                      fontSize: heroSubtitleSize,
                      lineHeight: heroSubtitleSize + 6,
                      marginTop: isPhone ? 4 : 6,
                    },
                  ]}
                >
                  Safety updates and alerts for your destination.
                </Text>
              </View>

              <View
                style={[
                  styles.heroArtworkWrap,
                  isHeroStacked && styles.heroArtworkWrapStacked,
                  {
                    width: heroArtworkWidth,
                    height: heroArtworkHeight,
                  },
                ]}
              >
                <Image
                  source={heroRobotImage}
                  resizeMode="contain"
                  style={styles.heroArtworkImage}
                />
              </View>
            </View>

            <View
              style={[
                styles.destinationPanel,
                heroShadowStyle,
                isPhone && styles.destinationPanelCompact,
              ]}
            >
              <View style={styles.destinationPanelGlow} />

              <View style={[styles.destinationPanelCopy, isPhone && styles.destinationPanelCopyCompact]}>
                <Text style={[styles.destinationPanelTitle, isPhone && styles.destinationPanelTitlePhone]}>
                  Where are you going?
                </Text>
                <Text
                  style={[styles.destinationPanelSubtitle, isPhone && styles.destinationPanelSubtitlePhone]}
                >
                  Get real-time safety updates for your destination.
                </Text>
              </View>

              <View
                style={[
                  styles.destinationPanelControls,
                  isPhone && styles.destinationPanelControlsCompact,
                ]}
              >
                <View style={[styles.destinationSelector, isPhone && styles.destinationSelectorPhone]}>
                  <Ionicons name="search-outline" size={isPhone ? 18 : 20} color="#1F78FF" />
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
                    style={[styles.destinationInput, isPhone && styles.destinationInputPhone]}
                    onSubmitEditing={handleSubmitDestination}
                    onFocus={() => {
                      if (destinationSuggestions.length > 0) {
                        setShowDestinationSuggestions(true);
                      }
                    }}
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
                      <Ionicons name="close-circle" size={20} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>

                {showDestinationSuggestions ? (
                  <View style={styles.destinationSuggestionsList}>
                    {destinationSuggestions.map((suggestion) => (
                      <DimPressable
                        key={`${suggestion.label}-${suggestion.lat}-${suggestion.lng}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${suggestion.label}`}
                        onPress={() => handleSelectDestinationSuggestion(suggestion)}
                        style={styles.destinationSuggestionItem}
                      >
                        <Ionicons name="location-outline" size={17} color="#1F78FF" />
                        <Text style={styles.destinationSuggestionText} numberOfLines={1}>
                          {suggestion.label}
                        </Text>
                      </DimPressable>
                    ))}
                    {destinationSuggestLoading ? (
                      <Text style={styles.destinationSuggestionState}>Searching locations...</Text>
                    ) : null}
                    {!destinationSuggestLoading && destinationSuggestions.length === 0 ? (
                      <Text style={styles.destinationSuggestionState}>No matching locations</Text>
                    ) : null}
                  </View>
                ) : null}

                <Text style={[styles.destinationScopeText, isPhone && styles.destinationScopeTextPhone]}>
                  {liveReport?.scopeLabel || "Country-level risk information"}
                </Text>

                <View
                  style={[
                    styles.destinationUpdatedRow,
                    isPhone && styles.destinationUpdatedRowCompact,
                  ]}
                >
                  <Text
                    style={[styles.destinationUpdatedText, isPhone && styles.destinationUpdatedTextPhone]}
                  >
                    Last updated: {formatTimestamp(lastUpdated)}
                    {isStale ? " (stale)" : ""}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Refresh safety updates"
                    onPress={handleRefreshTimestamp}
                    style={({ pressed }) => [
                      styles.refreshButton,
                      isPhone && styles.refreshButtonPhone,
                      pressed && styles.refreshButtonPressed,
                    ]}
                  >
                    <Ionicons name="refresh" size={isPhone ? 18 : 20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, cardShadowStyle, isPhone && styles.sectionCardPhone]}>
              <View style={[styles.sectionHeaderRow, isPhone && styles.sectionHeaderRowCompact]}>
                <Text style={[styles.sectionHeaderTitle, isPhone && styles.sectionHeaderTitlePhone]}>
                  Overall Safety Level
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowSafetyInfo((currentValue) => !currentValue)}
                  style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
                >
                  <Text style={[styles.sectionLinkText, isPhone && styles.sectionLinkTextPhone]}>
                    About safety levels
                  </Text>
                  <Ionicons name="information-circle-outline" size={isPhone ? 16 : 18} color="#1F78FF" />
                </Pressable>
              </View>

              {showSafetyInfo ? (
                <View style={styles.safetyInfoBanner}>
                  <Text style={styles.safetyInfoText}>{destination.overall.about}</Text>
                </View>
              ) : null}

              <View style={[styles.overallRow, isPhone && styles.overallRowCompact]}>
                <View style={styles.overallCopyBlock}>
                  <View
                    style={[
                      styles.overallIconCircle,
                      {
                        backgroundColor: overallStyles.softBackground,
                        width: overallCircleSize,
                        height: overallCircleSize,
                        borderRadius: overallCircleSize / 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.overallIconInner,
                        {
                          backgroundColor: overallStyles.color,
                          width: overallInnerSize,
                          height: overallInnerSize,
                          borderRadius: isPhone ? 14 : 16,
                        },
                      ]}
                    >
                      <Ionicons name={overallStyles.iconName} size={overallIconSize} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.overallCopy}>
                    <Text
                      style={[
                        styles.overallLabel,
                        isPhone && styles.overallLabelPhone,
                        { color: overallStyles.color },
                      ]}
                    >
                      {safetyOverview.label}
                    </Text>
                    <Text
                      style={[styles.overallDescription, isPhone && styles.overallDescriptionPhone]}
                    >
                      {overallDescription}
                    </Text>
                  </View>
                </View>

                <View style={[styles.overallScaleBlock, isPhone && styles.overallScaleBlockPhone]}>
                  <SafetyScale indicatorLeft={safetyOverview.indicatorLeft} />
                </View>
              </View>
            </View>

            <View style={[styles.sectionTopRow, isPhone && styles.sectionTopRowPhone]}>
              <View style={styles.activeAlertsTitleWrap}>
                <Text style={[styles.largeSectionTitle, isPhone && styles.largeSectionTitlePhone]}>
                  Active Alerts
                </Text>
                <View style={[styles.countBadge, isPhone && styles.countBadgePhone]}>
                  <Text style={[styles.countBadgeText, isPhone && styles.countBadgeTextPhone]}>
                    {visibleAlerts.length}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedAlertId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={[styles.sectionLinkText, isPhone && styles.sectionLinkTextPhone]}>
                  View all alerts
                </Text>
                <Ionicons name="chevron-forward" size={isPhone ? 14 : 16} color="#1F78FF" />
              </Pressable>
            </View>

            <View style={[styles.alertsList, isPhone && styles.alertsListPhone]}>
              {safetyError ? <Text style={styles.liveStateText}>{safetyError}</Text> : null}
              {safetyLoading && visibleAlerts.length === 0 ? (
                <Text style={styles.liveStateText}>Loading current safety report...</Text>
              ) : null}
              {!safetyLoading && visibleAlerts.length === 0 && !safetyError ? (
                <Text style={styles.liveStateText}>
                  No current active alerts for {displayCountryLabel}.
                </Text>
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

            <View style={[styles.sectionTopRow, isPhone && styles.sectionTopRowPhone]}>
              <Text style={[styles.largeSectionTitle, isPhone && styles.largeSectionTitlePhone]}>
                Safety Categories
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCategoryId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={[styles.sectionLinkText, isPhone && styles.sectionLinkTextPhone]}>View all</Text>
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
                    compact={compactCards}
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
                    compact={compactCards}
                    isSelected={selectedCategoryId === item.id}
                    onPress={() =>
                      setSelectedCategoryId((currentId) => (currentId === item.id ? null : item.id))
                    }
                  />
                ))}
              </View>
            )}

            <View style={[styles.sectionTopRow, isPhone && styles.sectionTopRowPhone]}>
              <Text style={[styles.largeSectionTitle, isPhone && styles.largeSectionTitlePhone]}>
                Safety Tips
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTipId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={[styles.sectionLinkText, isPhone && styles.sectionLinkTextPhone]}>
                  View all tips
                </Text>
              </Pressable>
            </View>

            <View style={[styles.tipsCard, cardShadowStyle]}>
              {destination.tips.map((tip, index) => (
                <TipRow
                  key={tip.id}
                  tip={tip}
                  compact={compactCards}
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
                <View style={[styles.pushRobotWrap, isPhone && styles.pushRobotWrapPhone]}>
                  <Image
                    source={bannerRobotImage}
                    resizeMode="contain"
                    style={[styles.pushRobotImage, isPhone && styles.pushRobotImagePhone]}
                  />
                </View>

                <View style={styles.pushBannerCopy}>
                  <Text style={[styles.pushBannerTitle, isPhone && styles.pushBannerTitlePhone]}>
                    Live safety updates are active.
                  </Text>
                  <Text
                    style={[styles.pushBannerDescription, isPhone && styles.pushBannerDescriptionPhone]}
                  >
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
                  isPhone && styles.pushBannerButtonPhone,
                  styles.pushBannerButtonEnabled,
                  pressed && styles.pushBannerButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.pushBannerButtonText,
                    isPhone && styles.pushBannerButtonTextPhone,
                    styles.pushBannerButtonTextEnabled,
                  ]}
                >
                  Refresh Alerts
                </Text>
                <Ionicons name="refresh" size={isPhone ? 18 : 20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <BottomNav activeLabel={null} onNavigate={onNavigate} />
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
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
  },

  alertDismissButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "#B9D4FF",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  alertDismissText: {
    color: "#1F78FF",
    fontSize: 12,
    fontWeight: "700",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },

  scrollContent: {
    alignItems: "center",
  },

  pageInner: {
    width: "100%",
    maxWidth: 780,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 34,
    gap: 8,
  },

  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginRight: "auto",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  headerActionButton: {
    width: 34,
    height: 34,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionButtonPressed: {
    opacity: 0.7,
  },

  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7A32",
  },

  heroSection: {
    position: "relative",
    marginTop: 2,
    minHeight: 0,
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 4,
    borderRadius: 0,
    overflow: "visible",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    backgroundColor: "transparent",
  },

  heroSectionPhone: {
    marginTop: 0,
    gap: 2,
    alignItems: "flex-start",
  },

  heroSectionStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
    minHeight: 0,
  },

  skylineBackdrop: {
    ...StyleSheet.absoluteFillObject,
    bottom: 0,
    left: 0,
    right: 0,
  },

  skylineBuilding: {
    position: "absolute",
    bottom: 2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(31, 120, 255, 0.07)",
  },

  skylineCloud: {
    position: "absolute",
    height: 12,
    borderRadius: 8,
    backgroundColor: "rgba(31, 120, 255, 0.05)",
  },

  skylineCloudLeft: {
    top: 48,
    left: "8%",
    width: 40,
  },

  skylineCloudMiddle: {
    top: 28,
    left: "44%",
    width: 54,
  },

  skylineCloudRight: {
    top: 58,
    right: "10%",
    width: 36,
  },

  heroCopy: {
    zIndex: 2,
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 360,
    paddingTop: 8,
    paddingRight: 8,
  },

  heroCopyPhone: {
    maxWidth: "56%",
    paddingRight: 2,
    paddingTop: 4,
  },

  heroCopyStacked: {
    width: "100%",
    maxWidth: "100%",
    paddingBottom: 4,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  heroTitle: {
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -1.2,
  },

  heroTitleIcon: {
    marginTop: 2,
  },

  heroSubtitle: {
    marginTop: 6,
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#3F4F6B",
    letterSpacing: -0.2,
  },

  heroArtworkWrap: {
    zIndex: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginTop: -2,
    overflow: "visible",
    backgroundColor: "transparent",
  },

  heroArtworkWrapStacked: {
    maxWidth: 280,
    alignSelf: "center",
    alignItems: "center",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  destinationPanel: {
    position: "relative",
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    backgroundColor: "#0D68F2",
  },

  destinationPanelCompact: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },

  destinationPanelGlow: {
    position: "absolute",
    top: -84,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  destinationPanelCopy: {
    flex: 1,
    maxWidth: 280,
    justifyContent: "center",
  },

  destinationPanelCopyCompact: {
    maxWidth: "100%",
  },

  destinationPanelTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },

  destinationPanelTitlePhone: {
    fontSize: 18,
    lineHeight: 22,
  },

  destinationPanelSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.92)",
  },

  destinationPanelSubtitlePhone: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  destinationPanelControls: {
    width: "48%",
    minWidth: 240,
    alignItems: "stretch",
    justifyContent: "center",
  },

  destinationPanelControlsCompact: {
    width: "100%",
    minWidth: 0,
  },

  destinationSelector: {
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  destinationSelectorPhone: {
    minHeight: 44,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 12,
  },

  destinationInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#0F2140",
    paddingVertical: 10,
  },

  destinationInputPhone: {
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 8,
  },

  destinationClearButton: {
    marginLeft: 6,
    padding: 2,
  },

  destinationClearButtonPressed: {
    opacity: 0.7,
  },

  destinationSuggestionsList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7E4F7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  destinationSuggestionItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EDF8",
  },

  destinationSuggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    color: "#223D69",
  },

  destinationSuggestionState: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#6B7C99",
  },

  destinationUpdatedRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  destinationScopeText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.94)",
  },

  destinationScopeTextPhone: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
  },

  destinationUpdatedRowCompact: {
    alignItems: "center",
  },

  destinationUpdatedText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.96)",
  },

  destinationUpdatedTextPhone: {
    fontSize: 12,
    lineHeight: 16,
  },

  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  refreshButtonPhone: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  refreshButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  sectionCard: {
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  sectionCardPhone: {
    marginTop: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 16,
  },

  sectionHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E6EEF9",
    gap: 8,
  },

  sectionHeaderRowCompact: {
    alignItems: "center",
    flexWrap: "wrap",
  },

  sectionHeaderTitle: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#0F2140",
    letterSpacing: -0.3,
  },

  sectionHeaderTitlePhone: {
    fontSize: 16,
    lineHeight: 20,
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },

  sectionLinkText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#1F78FF",
  },

  sectionLinkTextPhone: {
    fontSize: 12,
    lineHeight: 16,
  },

  linkPressed: {
    opacity: 0.7,
  },

  safetyInfoBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
  },

  safetyInfoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#385173",
  },

  overallRow: {
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  overallRowCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },

  overallCopyBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  overallIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  overallIconInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  overallCopy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },

  overallLabel: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  overallLabelPhone: {
    fontSize: 18,
    lineHeight: 22,
  },

  overallDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#32435F",
    flexShrink: 1,
    flexWrap: "wrap",
  },

  overallDescriptionPhone: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  overallScaleBlock: {
    width: 240,
    maxWidth: "100%",
    flexShrink: 0,
  },

  overallScaleBlockPhone: {
    width: "100%",
  },

  scaleTrack: {
    position: "relative",
    height: 10,
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
    top: -6,
    width: 12,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#1E2D5A",
    backgroundColor: "#283F73",
    transform: [{ translateX: -6 }],
  },

  scaleLabelsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scaleLabelText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#21314F",
  },

  sectionTopRow: {
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTopRowPhone: {
    marginTop: 14,
    marginBottom: 8,
  },

  activeAlertsTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },

  largeSectionTitle: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#0F2140",
    letterSpacing: -0.3,
  },

  largeSectionTitlePhone: {
    fontSize: 16,
    lineHeight: 20,
  },

  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F04D33",
  },

  countBadgePhone: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
  },

  countBadgeText: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  countBadgeTextPhone: {
    fontSize: 12,
    lineHeight: 14,
  },

  alertsList: {
    gap: 10,
  },

  alertsListPhone: {
    gap: 8,
  },

  alertCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  alertCardPhone: {
    borderRadius: 14,
    padding: 10,
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
    gap: 8,
  },

  alertBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  alertBadgePhone: {
    paddingVertical: 3,
    paddingHorizontal: 7,
  },

  alertBadgeText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
  },

  alertBadgeTextPhone: {
    fontSize: 11,
    lineHeight: 14,
  },

  alertTimestamp: {
    fontSize: 12,
    lineHeight: 16,
    color: "#5B6D8A",
  },

  alertTimestampPhone: {
    fontSize: 11,
    lineHeight: 15,
  },

  alertCardBody: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  alertCardBodyPhone: {
    marginTop: 8,
  },

  alertIconWrap: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  alertIconWrapPhone: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
  },

  alertCopy: {
    flex: 1,
    minWidth: 0,
  },

  alertTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -0.3,
  },

  alertTitlePhone: {
    fontSize: 14,
    lineHeight: 18,
  },

  alertLocationRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  alertLocationText: {
    fontSize: 13,
    lineHeight: 17,
    color: "#3366C5",
  },

  alertLocationTextPhone: {
    fontSize: 12,
    lineHeight: 16,
  },

  alertDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#2F405C",
  },

  alertDescriptionPhone: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },

  alertDetailText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#51637E",
  },

  alertChevron: {
    marginLeft: 8,
    marginTop: 10,
  },

  alertChevronPhone: {
    marginLeft: 4,
    marginTop: 8,
  },

  categoryScrollContent: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 10,
  },

  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryCard: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EEF9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  categoryCardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
  },

  categoryCardSelected: {
    backgroundColor: "#FAFCFF",
  },

  categoryCardPressed: {
    opacity: 0.95,
  },

  categoryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryIconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },

  categoryTitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: "#0F2140",
  },

  categoryTitleCompact: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 15,
  },

  categoryStatus: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  categoryStatusCompact: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 14,
  },

  categoryDescription: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 15,
    color: "#51637E",
  },

  tipsCard: {
    marginTop: 2,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  tipRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },

  tipRowCompact: {
    paddingVertical: 11,
    paddingHorizontal: 12,
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
    alignItems: "center",
  },

  tipRowMainCompact: {
    alignItems: "center",
  },

  tipIconWrap: {
    width: 42,
    height: 42,
    marginRight: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  tipIconWrapCompact: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 12,
  },

  tipCopy: {
    flex: 1,
    minWidth: 0,
  },

  tipTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -0.2,
  },

  tipTitleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },

  tipDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#32435F",
  },

  tipDescriptionCompact: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },

  tipDetail: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: "#587093",
  },

  tipSource: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    color: "#6B7C99",
  },

  tipChevron: {
    marginLeft: 8,
  },

  tipChevronCompact: {
    marginLeft: 4,
  },

  pushBanner: {
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#EEF5FF",
  },

  pushBannerCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  pushBannerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  pushRobotWrap: {
    width: 48,
    height: 48,
    marginRight: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },

  pushRobotWrapPhone: {
    width: 42,
    height: 42,
    marginRight: 8,
    borderRadius: 12,
  },

  pushRobotImage: {
    width: 36,
    height: 36,
  },

  pushRobotImagePhone: {
    width: 30,
    height: 30,
  },

  pushBannerCopy: {
    flex: 1,
    minWidth: 0,
  },

  pushBannerTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#0F2140",
    letterSpacing: -0.2,
  },

  pushBannerTitlePhone: {
    fontSize: 13,
    lineHeight: 17,
  },

  pushBannerDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#40516D",
  },

  pushBannerDescriptionPhone: {
    fontSize: 11,
    lineHeight: 15,
  },

  pushBannerButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#B9D3FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },

  pushBannerButtonPhone: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
  },

  pushBannerButtonEnabled: {
    borderColor: "#1F78FF",
    backgroundColor: "#1F78FF",
  },

  pushBannerButtonPressed: {
    opacity: 0.96,
  },

  pushBannerButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#1F78FF",
  },

  pushBannerButtonTextPhone: {
    fontSize: 13,
    lineHeight: 17,
  },

  pushBannerButtonTextEnabled: {
    color: "#FFFFFF",
  },
});
