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

import { WayfinderBrand } from "./AuthShared";
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

function getCityFromLabel(label) {
  return label.split(",")[0]?.trim() || label.trim();
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
      {isSelected ? (
        <Text style={styles.categoryDescription}>{item.description}</Text>
      ) : null}
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
          {isSelected ? (
            <>
              <Text style={styles.tipDetail}>{tip.detail}</Text>
              <Text style={styles.tipSource}>{tip.source}</Text>
            </>
          ) : null}
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
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width } = useWindowDimensions();
  const { refreshLocation } = useUserLocation();
  const isPhone = width < 560;
  const useScrollableCategories = width < 900;
  const pageMaxWidth = width >= 1180 ? 1020 : 960;

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
    categories: liveReport?.categories || [],
    tips: liveReport?.tips || [],
  };
  const displayDestinationLabel = liveReport?.destinationLabel || appliedDestinationLabel;
  const displayCityLabel = getCityFromLabel(displayDestinationLabel);
  const visibleAlerts = liveAlerts;
  const safetyOverview = destination.overall;
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
        mappedReport.categories.some((item) => item.id === currentId)
          ? currentId
          : mappedReport.categories[0]?.id ?? null
      );
      setSelectedAlertId((currentId) =>
        mapped.some((alert) => alert.id === currentId) ? currentId : mapped[0]?.id ?? null
      );
      setLastUpdated(mappedReport.fetchedAt);
      setIsStale(mappedReport.isStale);
    } catch (error) {
      if (!mountedRef.current) return;
      setSafetyError(error?.message || "Couldn't refresh safety alerts.");
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
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
                      <Ionicons name="close-circle" size={22} color="#94A3B8" />
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
                        <Ionicons name="location-outline" size={19} color="#1F78FF" />
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

                <Text style={styles.destinationScopeText}>
                  {liveReport?.scopeLabel || "Country-level risk information"}
                </Text>

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
                <Text style={styles.liveStateText}>Loading current safety report...</Text>
              ) : null}
              {!safetyLoading && visibleAlerts.length === 0 ? (
                <Text style={styles.liveStateText}>No active country or weather alerts were reported.</Text>
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
              <Text style={styles.largeSectionTitle}>
                General Preparedness Guidance for {displayCityLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTipId(null)}
                style={({ pressed }) => [styles.sectionLinkButton, pressed && styles.linkPressed]}
              >
                <Text style={styles.sectionLinkText}>View all guidance</Text>
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

  destinationSuggestionsList: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E4F7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  destinationSuggestionItem: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EDF8",
  },

  destinationSuggestionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#223D69",
  },

  destinationSuggestionState: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#6B7C99",
  },

  destinationUpdatedRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  destinationScopeText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.94)",
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

  categoryDescription: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: "#51637E",
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

  tipSource: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: "#6B7C99",
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
