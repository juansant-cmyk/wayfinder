import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import { mapWeatherForScreen } from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { reverseGeocodeLabel, suggestGeocodeQuery } from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";
import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroRobotImage = require("../assets/images/weather-hero-robot-reference.png");
const weatherCardSceneImage = require("../assets/images/weather-card-scene-reference.png");
const LIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const WEATHER_NAV_ITEMS = [
  { label: "Home", route: "home", icon: "home-outline", activeIcon: "home" },
  {
    label: "Itinerary",
    route: "itinerary",
    icon: "calendar-clear-outline",
    activeIcon: "calendar-clear",
  },
  { label: "Flights", route: "flights", icon: "airplane-outline", activeIcon: "airplane" },
  {
    label: "Weather",
    route: "weather",
    icon: "partly-sunny-outline",
    activeIcon: "partly-sunny",
  },
  { label: "Profile", route: "profile", icon: "person-outline", activeIcon: "person" },
];

const LOCATION_OPTIONS = [
  { id: "tokyo", label: "Tokyo, Japan" },
  { id: "kyoto", label: "Kyoto, Japan" },
  { id: "bali", label: "Bali, Indonesia" },
  { id: "lisbon", label: "Lisbon, Portugal" },
];

const FALLBACK_LOCATION = LOCATION_OPTIONS[0];

const EMPTY_WEATHER = {
  destination: FALLBACK_LOCATION.label,
  forecastSummary: "",
  current: {
    temperature: "—",
    unit: "°C",
    condition: "Loading…",
    feelsLike: "Feels like —",
    timestamp: "",
    iconUrl: null,
    details: [],
  },
  hourly: [],
  daily: [],
  alerts: [],
  summary: [],
};

const HERO_SKYLINE_BUILDINGS = [
  { left: "34%", width: 32, height: 54 },
  { left: "42%", width: 18, height: 102 },
  { left: "50%", width: 36, height: 72 },
  { left: "60%", width: 24, height: 92 },
  { left: "69%", width: 50, height: 118 },
  { left: "82%", width: 26, height: 66 },
  { left: "89%", width: 18, height: 86 },
];

const surfaceShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 10px 24px rgba(143, 163, 191, 0.12)",
  },
  default: {
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});

const weatherCardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 16px 32px rgba(31, 120, 255, 0.2)",
  },
  default: {
    shadowColor: "#2E73D9",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
});

function renderIcon(family, name, size, color) {
  if (family === "material") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Ionicons name={name} size={size} color={color} />;
}

function getConditionIcon(condition) {
  const key = String(condition || "").toLowerCase();
  if (key.includes("thunder") || key.includes("storm")) {
    return { family: "ion", name: "flash", color: "#8B5CF6" };
  }
  if (key.includes("rain") || key.includes("shower") || key.includes("drizzle")) {
    return { family: "ion", name: "rainy", color: "#51A2FF" };
  }
  if (key.includes("snow") || key.includes("sleet") || key.includes("ice")) {
    return { family: "ion", name: "snow", color: "#7DD3FC" };
  }
  if (key.includes("cloud") && (key.includes("part") || key.includes("mostly"))) {
    return { family: "ion", name: "partly-sunny", color: "#FDB515" };
  }
  if (key.includes("cloud") || key.includes("overcast") || key.includes("fog") || key.includes("mist")) {
    return { family: "ion", name: "cloud", color: "#8FA0BA" };
  }
  if (key.includes("sun") || key.includes("clear")) {
    return { family: "ion", name: "sunny", color: "#FDB515" };
  }
  return { family: "ion", name: "partly-sunny", color: "#FDB515" };
}

function HeaderActionButton({ accessibilityLabel, iconName, onPress, showDot = false }) {
  return (
    <DimPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.headerActionButton}>
      <Ionicons name={iconName} size={30} color="#111827" />
      {showDot ? <View style={styles.notificationDot} /> : null}
    </DimPressable>
  );
}

function HeroSkylineBackdrop() {
  return (
    <View pointerEvents="none" style={styles.heroBackdrop}>
      <View style={[styles.heroCloud, styles.heroCloudSmall]} />
      <View style={[styles.heroCloud, styles.heroCloudLarge]} />
      <View style={styles.heroSkylineRow}>
        {HERO_SKYLINE_BUILDINGS.map((building) => (
          <View
            key={`${building.left}-${building.height}`}
            style={[
              styles.heroBuilding,
              {
                left: building.left,
                width: building.width,
                height: building.height,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function WeatherMetric({ item, compact }) {
  return (
    <View style={[styles.metricItem, compact && styles.metricItemCompact]}>
      <View style={styles.metricIconWrap}>{renderIcon(item.iconFamily, item.iconName, 19, "#EAF3FF")}</View>
      <View style={[styles.metricTextWrap, compact && styles.metricTextWrapCompact]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={compact}
          minimumFontScale={0.82}
          style={[styles.metricLabel, compact && styles.metricLabelCompact]}
        >
          {item.label}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={compact}
          minimumFontScale={0.82}
          style={[styles.metricValue, compact && styles.metricValueCompact]}
        >
          {item.value}
        </Text>
      </View>
    </View>
  );
}

function HourlyForecastItem({ item, active, onPress }) {
  const icon = getConditionIcon(item.condition);

  return (
    <DimPressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.hourlyItem, active && styles.hourlyItemActive]}
    >
      <Text style={[styles.hourlyLabel, active && styles.hourlyLabelActive]}>{item.label}</Text>
      <View style={styles.hourlyIconWrap}>
        {item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={{ width: 34, height: 34 }} resizeMode="contain" />
        ) : (
          renderIcon(icon.family, icon.name, 34, icon.color)
        )}
      </View>
      <Text style={styles.hourlyTemperature}>{item.temperature}</Text>
      <View style={styles.hourlyWindRow}>
        <MaterialCommunityIcons name="weather-windy" size={14} color="#7E8AA4" />
        <Text style={styles.hourlyWindText}>{item.wind}</Text>
      </View>
    </DimPressable>
  );
}

function DailyForecastRow({ item, expanded, onPress, compact }) {
  const icon = getConditionIcon(item.condition);

  return (
    <DimPressable accessibilityRole="button" onPress={onPress} style={styles.dailyRow}>
      <View style={[styles.dailyRowMain, compact && styles.dailyRowMainCompact]}>
        <Text style={[styles.dailyDayText, compact && styles.dailyDayTextCompact]}>{item.day}</Text>

        <View style={[styles.dailyConditionWrap, compact && styles.dailyConditionWrapCompact]}>
          {item.iconUrl ? (
            <Image source={{ uri: item.iconUrl }} style={{ width: 26, height: 26 }} resizeMode="contain" />
          ) : (
            renderIcon(icon.family, icon.name, 26, icon.color)
          )}
          <Text style={styles.dailyConditionText}>{item.condition}</Text>
        </View>

        <View style={styles.dailyMetaWrap}>
          <Text style={styles.dailyTemperatureText}>
            <Text style={styles.dailyLowTemp}>{item.low}</Text>
            <Text style={styles.dailyTemperatureSlash}> / </Text>
            <Text style={styles.dailyHighTemp}>{item.high}</Text>
          </Text>

          <View style={styles.dailyPrecipitationWrap}>
            <Ionicons name="water-outline" size={15} color="#1F78FF" />
            <Text style={styles.dailyPrecipitationText}>{item.precipitation}</Text>
          </View>

          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#5D6B86"
            style={styles.dailyChevron}
          />
        </View>
      </View>

      {expanded ? <Text style={styles.dailyDetailText}>{item.detail}</Text> : null}
    </DimPressable>
  );
}

function WeatherAlertCard({ item, expanded, onPress, compact }) {
  return (
    <View
      style={[
        styles.alertCard,
        { borderColor: item.colors.border, backgroundColor: item.colors.background },
      ]}
    >
      <View style={[styles.alertCardMain, compact && styles.alertCardMainCompact]}>
        <View style={[styles.alertIconBubble, { backgroundColor: item.colors.iconBackground }]}>
          {renderIcon(item.iconFamily, item.iconName, 28, item.colors.iconColor)}
        </View>

        <View style={styles.alertBody}>
          <View style={styles.alertTitleRow}>
            <Text style={styles.alertTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.alertBadge, { backgroundColor: item.colors.badgeBackground }]}>
              <Text style={[styles.alertBadgeText, { color: item.colors.badgeColor }]}>
                {item.badge}
              </Text>
            </View>
          </View>

          <Text style={styles.alertDescription} numberOfLines={expanded ? 8 : 3}>
            {item.description}
          </Text>

          {expanded && item.detail ? (
            <Text style={styles.alertDetailText} numberOfLines={6}>
              {item.detail}
            </Text>
          ) : null}

          <View style={styles.alertFooterRow}>
            <Text style={styles.alertTimestamp} numberOfLines={1}>
              {item.timestamp}
            </Text>
            <DimPressable
              accessibilityRole="button"
              onPress={onPress}
              style={[styles.alertButton, { borderColor: item.colors.buttonBorder }]}
            >
              <Text style={[styles.alertButtonText, { color: item.colors.buttonText }]}>
                {expanded ? "Hide Details" : "View Details"}
              </Text>
            </DimPressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function WeatherSummaryItem({ item, compact, showDivider }) {
  return (
    <View
      style={[
        styles.summaryItem,
        showDivider && styles.summaryItemWithDivider,
      ]}
    >
      <View style={[styles.summaryContent, compact && styles.summaryContentCompact]}>
        <View style={[styles.summaryIconBubble, compact && styles.summaryIconBubbleCompact]}>
          {renderIcon(item.iconFamily, item.iconName, compact ? 22 : 24, "#3E88FF")}
        </View>
        <View style={[styles.summaryTextWrap, compact && styles.summaryTextWrapCompact]}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[styles.summaryLabel, compact && styles.summaryLabelCompact]}
          >
            {item.label}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[styles.summaryValue, compact && styles.summaryValueCompact]}
          >
            {item.value}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function WeatherScreen({ onNavigate, onBack }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { refreshLocation } = useUserLocation();
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchSuggestLoading, setSearchSuggestLoading] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("current");
  const [selectedLocationLabel, setSelectedLocationLabel] = useState("Locating…");
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hourlyFocusActive, setHourlyFocusActive] = useState(false);
  const [selectedHourlyId, setSelectedHourlyId] = useState("now");
  const [expandedDayIds, setExpandedDayIds] = useState([]);
  const [expandedAlertIds, setExpandedAlertIds] = useState([]);
  const [weather, setWeather] = useState(EMPTY_WEATHER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStale, setIsStale] = useState(false);
  const activeQueryRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const filterActive = searchText.trim().length > 0;
  const isPhone = width < 430;
  const isHeroStacked = width < 760;
  const stackLocationControls = width < 700;
  const stackCurrentWeather = width < 860;
  const compactForecastRows = width < 650;
  const compactAlerts = width < 760;
  const compactSummary = width < 620;
  const bottomPadding = BOTTOM_NAV_CONTENT_PADDING + insets.bottom + 32;
  const pageWidth = Math.min(Math.max(width - 36, 280), 1040);
  const showBackButton = width < 760 && typeof onBack === "function";
  const heroArtworkWidth = isHeroStacked ? Math.min(pageWidth, 340) : Math.min(pageWidth * 0.49, 408);
  const heroArtworkHeight = isHeroStacked ? 188 : 220;
  const currentWeather = weather.current;
  const hourlyForecast = weather.hourly;
  const dailyForecast = weather.daily;
  const weatherAlerts = weather.alerts;
  const weatherSummary = weather.summary;
  const conditionIcon = getConditionIcon(currentWeather.condition);

  const loadWeather = useCallback(async (query = activeQueryRef.current, initial = false) => {
    if (!query || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    activeQueryRef.current = query;
    if (initial) setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) {
        setError("Sign in to load live weather.");
        setWeather(EMPTY_WEATHER);
        return;
      }
      const payload = await dashboardApi.fetchWeather(token, query);
      const mapped = mapWeatherForScreen(payload);
      setWeather(mapped);
      setIsStale(false);
      setSelectedLocationLabel(mapped.destination || query?.destination || FALLBACK_LOCATION.label);
      setSelectedHourlyId(mapped.hourly[0]?.id || "now");
      setExpandedDayIds([]);
      setExpandedAlertIds([]);
    } catch (err) {
      setError(err?.message || "Couldn't load weather.");
      setIsStale(true);
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const loadDefaultWeather = useCallback(async () => {
    setSearchText("");
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
    setLocating(true);
    setSelectedLocationLabel("Locating…");

    try {
      const location = await refreshLocation();
      if (location?.lat != null && location?.lng != null) {
        const label =
          (await reverseGeocodeLabel(location.lat, location.lng)) ||
          `${Number(location.lat).toFixed(2)}, ${Number(location.lng).toFixed(2)}`;
        setSelectedLocationId("current");
        setSelectedLocationLabel(label);
        await loadWeather({
          lat: location.lat,
          lng: location.lng,
          destination: label,
        });
        return;
      }
    } catch {
      // Fall through to Tokyo.
    } finally {
      setLocating(false);
    }

    setSelectedLocationId(FALLBACK_LOCATION.id);
    setSelectedLocationLabel(FALLBACK_LOCATION.label);
    await loadWeather({ destination: FALLBACK_LOCATION.label });
  }, [loadWeather, refreshLocation]);

  useEffect(() => {
    loadDefaultWeather();
  }, [loadDefaultWeather]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (appStateRef.current === "active") loadWeather();
    }, LIVE_REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") loadWeather();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loadWeather]);

  useEffect(() => {
    const trimmed = searchText.trim();
    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      setSearchSuggestLoading(false);
      setShowSearchSuggestions(false);
      return undefined;
    }
    if (selectedLocationLabel.trim().toLowerCase() === trimmed.toLowerCase()) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return undefined;
    }

    let cancelled = false;
    setSearchSuggestLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await suggestGeocodeQuery(trimmed, 5);
        if (!cancelled) {
          setSearchSuggestions(results);
          setShowSearchSuggestions(true);
        }
      } catch {
        if (!cancelled) {
          setSearchSuggestions([]);
          setShowSearchSuggestions(true);
        }
      } finally {
        if (!cancelled) {
          setSearchSuggestLoading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText, selectedLocationLabel]);

  async function handleSelectSuggestion(suggestion) {
    const label = suggestion.label;
    setSearchText(label);
    setSelectedLocationId(null);
    setSelectedLocationLabel(label);
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
    setLocationMenuOpen(false);
    await loadWeather({
      destination: label,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
  }

  async function handleSearchSubmit() {
    const query = searchText.trim();
    if (!query) {
      return;
    }
    if (searchSuggestions.length > 0) {
      await handleSelectSuggestion(searchSuggestions[0]);
      return;
    }
    setLocationMenuOpen(false);
    setShowSearchSuggestions(false);
    setSelectedLocationId(null);
    await loadWeather({ destination: query });
  }

  async function handleCurrentLocationPress() {
    if (locating) {
      return;
    }

    setLocating(true);
    setLocationMenuOpen(false);

    try {
      const location = await refreshLocation();
      if (!location?.lat || !location?.lng) {
        setError("Location permission is required to use current location.");
        return;
      }
      const label =
        (await reverseGeocodeLabel(location.lat, location.lng)) ||
        `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`;
      setSelectedLocationId("current");
      setSelectedLocationLabel(label);
      setSearchText("");
      setShowSearchSuggestions(false);
      setSearchSuggestions([]);
      await loadWeather({ lat: location.lat, lng: location.lng, destination: label });
    } catch (err) {
      setError(err?.message || "Couldn't read your location.");
    } finally {
      setLocating(false);
    }
  }

  function toggleDailyRow(dayId) {
    setExpandedDayIds((currentIds) =>
      currentIds.includes(dayId)
        ? currentIds.filter((id) => id !== dayId)
        : [...currentIds, dayId]
    );
  }

  function toggleAlert(alertId) {
    setExpandedAlertIds((currentIds) =>
      currentIds.includes(alertId)
        ? currentIds.filter((id) => id !== alertId)
        : [...currentIds, alertId]
    );
  }

  function toggleAllDailyDetails() {
    if (expandedDayIds.length === dailyForecast.length) {
      setExpandedDayIds([]);
      return;
    }

    setExpandedDayIds(dailyForecast.map((item) => item.id));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageGlowTop} />
          <View style={styles.pageGlowBottom} />

          <View style={[styles.pageInner, { width: pageWidth }]}>
            <View style={styles.headerRow}>
              {showBackButton ? (
                <>
                  <DimPressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={onBack}
                    style={styles.headerBackButton}
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
                    <HeaderActionButton
                      accessibilityLabel="Refresh weather"
                      iconName="refresh"
                      onPress={() => loadWeather()}
                    />
                    <HeaderActionButton
                      accessibilityLabel="Notifications"
                      iconName="notifications-outline"
                      onPress={() => onNavigate?.("notifications")}
                      showDot
                    />
                    <HeaderActionButton
                      accessibilityLabel="Profile"
                      iconName="person-circle-outline"
                      onPress={() => onNavigate?.("profile")}
                    />
                  </View>
                </>
              ) : (
                <>
                  <WayfinderBrand
                    containerStyle={styles.headerBrandRow}
                    textStyle={styles.headerBrandText}
                  />

                  <View style={styles.headerActions}>
                    <HeaderActionButton
                      accessibilityLabel="Refresh weather"
                      iconName="refresh"
                      onPress={() => loadWeather()}
                    />
                    <HeaderActionButton
                      accessibilityLabel="Notifications"
                      iconName="notifications-outline"
                      onPress={() => onNavigate?.("notifications")}
                      showDot
                    />
                    <HeaderActionButton
                      accessibilityLabel="Profile"
                      iconName="person-circle-outline"
                      onPress={() => onNavigate?.("profile")}
                    />
                  </View>
                </>
              )}
            </View>

            <View
              style={[
                styles.heroSection,
                isHeroStacked && styles.heroSectionStacked,
                !isHeroStacked && styles.heroSectionWide,
              ]}
            >
              <HeroSkylineBackdrop />

              <View style={[styles.heroTextBlock, isHeroStacked && styles.heroTextBlockStacked]}>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.heroTitle, isPhone && styles.heroTitlePhone]}>Weather</Text>
                  <Ionicons
                    name="partly-sunny"
                    size={isPhone ? 46 : 56}
                    color="#2F86FF"
                    style={styles.heroTitleIcon}
                  />
                </View>

                <Text style={[styles.heroSubtitle, isPhone && styles.heroSubtitlePhone]}>
                  Accurate forecasts to help you plan your perfect trip.
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
                  style={styles.heroArtwork}
                  resizeMode={isHeroStacked ? "contain" : "cover"}
                />
              </View>
            </View>

            <View style={[styles.controlsCard, surfaceShadowStyle]}>
              <View style={[styles.searchRow, filterActive && styles.searchRowActive]}>
                <Ionicons name="search-outline" size={28} color="#7888A3" />
                <TextInput
                  value={searchText}
                  onChangeText={(value) => {
                    setSearchText(value);
                    setShowSearchSuggestions(true);
                  }}
                  placeholder="Search destination or city"
                  placeholderTextColor="#7F8EA8"
                  style={styles.searchInput}
                  selectionColor="#1F78FF"
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) {
                      setShowSearchSuggestions(true);
                    }
                  }}
                />
                {searchSuggestLoading ? (
                  <ActivityIndicator color="#1F78FF" style={{ marginRight: 8 }} />
                ) : (
                  <DimPressable
                    accessibilityRole="button"
                    accessibilityLabel="Search weather"
                    onPress={handleSearchSubmit}
                    style={[styles.filterButton, filterActive && styles.filterButtonActive]}
                  >
                    <Ionicons
                      name="arrow-forward-circle"
                      size={24}
                      color={filterActive ? "#1F78FF" : "#7888A3"}
                    />
                  </DimPressable>
                )}
              </View>

              {showSearchSuggestions && (searchSuggestions.length > 0 || searchSuggestLoading) ? (
                <View style={styles.searchSuggestionsList}>
                  {searchSuggestions.map((suggestion) => (
                    <DimPressable
                      key={`${suggestion.label}-${suggestion.lat}-${suggestion.lng}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${suggestion.label}`}
                      onPress={() => handleSelectSuggestion(suggestion)}
                      style={styles.searchSuggestionItem}
                    >
                      <Ionicons name="location-outline" size={18} color="#1F78FF" />
                      <Text style={styles.searchSuggestionText} numberOfLines={1}>
                        {suggestion.label}
                      </Text>
                    </DimPressable>
                  ))}
                  {!searchSuggestLoading && searchSuggestions.length === 0 ? (
                    <Text style={styles.searchSuggestionEmpty}>No matching locations</Text>
                  ) : null}
                </View>
              ) : null}

              <View
                style={[
                  styles.locationControlsRow,
                  stackLocationControls && styles.locationControlsRowStacked,
                ]}
              >
                <DimPressable
                  accessibilityRole="button"
                  onPress={() => setLocationMenuOpen((open) => !open)}
                  style={[
                    styles.locationSelector,
                    stackLocationControls && styles.locationSelectorStacked,
                    locationMenuOpen && styles.locationSelectorOpen,
                  ]}
                >
                  <View style={styles.locationSelectorContent}>
                    <Ionicons name="location" size={22} color="#1F78FF" />
                    <Text style={styles.locationSelectorText}>{selectedLocationLabel}</Text>
                  </View>
                  <Ionicons
                    name={locationMenuOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1F78FF"
                  />
                </DimPressable>

                <DimPressable
                  accessibilityRole="button"
                  onPress={handleCurrentLocationPress}
                  style={[
                    styles.currentLocationButton,
                    stackLocationControls && styles.currentLocationButtonStacked,
                    locating && styles.currentLocationButtonLoading,
                  ]}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color="#1F78FF" />
                  ) : (
                    <Ionicons name="locate-outline" size={22} color="#1F78FF" />
                  )}
                  <Text style={styles.currentLocationButtonText}>
                    {locating ? "Locating..." : "Current location"}
                  </Text>
                </DimPressable>
              </View>

              {locationMenuOpen ? (
                <View style={styles.locationMenu}>
                  {LOCATION_OPTIONS.map((locationOption) => {
                    const selected = locationOption.id === selectedLocationId;

                    return (
                      <DimPressable
                        key={locationOption.id}
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedLocationId(locationOption.id);
                          setSelectedLocationLabel(locationOption.label);
                          setSearchText(locationOption.label);
                          setLocationMenuOpen(false);
                          setShowSearchSuggestions(false);
                          setSearchSuggestions([]);
                          loadWeather({ destination: locationOption.label });
                        }}
                        style={[styles.locationMenuItem, selected && styles.locationMenuItemSelected]}
                      >
                        <Text
                          style={[
                            styles.locationMenuItemText,
                            selected && styles.locationMenuItemTextSelected,
                          ]}
                        >
                          {locationOption.label}
                        </Text>
                        {selected ? <Ionicons name="checkmark" size={18} color="#1F78FF" /> : null}
                      </DimPressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {error ? (
              <View style={styles.statusBanner}>
                <Text style={styles.statusBannerText}>
                  {error}{isStale && weather.destination ? " Showing the last successful update." : ""}
                </Text>
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry weather load"
                  onPress={() => loadDefaultWeather()}
                  style={styles.statusRetryButton}
                >
                  <Text style={styles.statusRetryText}>Retry</Text>
                </DimPressable>
              </View>
            ) : null}

            <View style={[styles.currentWeatherCardShell, weatherCardShadowStyle]}>
              <View style={styles.currentWeatherCard}>
                <View style={styles.currentWeatherGlowLeft} />
                <View style={styles.currentWeatherGlowRight} />
                <View style={styles.currentWeatherSceneWrap}>
                  <Image
                    source={weatherCardSceneImage}
                    style={[
                      styles.currentWeatherScene,
                      stackCurrentWeather && styles.currentWeatherSceneMobile,
                      stackCurrentWeather && styles.currentWeatherSceneCompact,
                    ]}
                    resizeMode="cover"
                  />
                </View>

                <View
                  style={[
                    styles.currentWeatherContent,
                    stackCurrentWeather && styles.currentWeatherContentStacked,
                  ]}
                >
                  {loading ? (
                    <View style={styles.weatherLoadingBlock}>
                      <ActivityIndicator color="#FFFFFF" size="large" />
                      <Text style={styles.weatherLoadingText}>Loading weather…</Text>
                    </View>
                  ) : (
                    <>
                      <View
                        style={[
                          styles.currentWeatherPrimary,
                          stackCurrentWeather && styles.currentWeatherPrimaryStacked,
                        ]}
                      >
                        <View
                          style={[
                            styles.currentWeatherTopRow,
                            stackCurrentWeather && styles.currentWeatherTopRowStacked,
                          ]}
                        >
                          <View style={styles.currentWeatherSunWrap}>
                            {renderIcon(
                              conditionIcon.family,
                              conditionIcon.name,
                              isPhone ? 96 : 118,
                              conditionIcon.color === "#8FA0BA" ? "#FFC83D" : conditionIcon.color
                            )}
                          </View>

                          <View style={styles.currentWeatherHeadlineWrap}>
                            <View style={styles.currentWeatherTemperatureRow}>
                              <Text
                                style={[
                                  styles.currentWeatherTemperature,
                                  isPhone && styles.currentWeatherTemperaturePhone,
                                ]}
                              >
                                {currentWeather.temperature}
                              </Text>
                              <Text style={styles.currentWeatherUnit}>{currentWeather.unit}</Text>
                            </View>
                            <Text style={styles.currentWeatherCondition}>
                              {currentWeather.condition}
                            </Text>
                            <Text style={styles.currentWeatherFeelsLike}>
                              {currentWeather.feelsLike}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.currentWeatherTimestamp}>
                          {currentWeather.timestamp}
                        </Text>
                      </View>

                      <View
                        style={[styles.metricsGrid, stackCurrentWeather && styles.metricsGridStacked]}
                      >
                        {currentWeather.details.map((item) => (
                          <WeatherMetric
                            key={item.id}
                            item={item}
                            compact={stackCurrentWeather}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, surfaceShadowStyle]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                <DimPressable
                  accessibilityRole="button"
                  onPress={() => setHourlyFocusActive((currentValue) => !currentValue)}
                  style={[styles.sectionLinkButton, hourlyFocusActive && styles.sectionLinkButtonActive]}
                >
                  <Text style={styles.sectionLinkText}>View full day</Text>
                  <Ionicons name="chevron-forward" size={18} color="#1F78FF" />
                </DimPressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyScrollContent}
              >
                {hourlyForecast.length === 0 ? (
                  <Text style={styles.emptySectionText}>Hourly details unavailable for this location.</Text>
                ) : (
                  hourlyForecast.map((item, index) => (
                    <HourlyForecastItem
                      key={item.id}
                      item={item}
                      active={selectedHourlyId === item.id || (!hourlyFocusActive && index === 0)}
                      onPress={() => setSelectedHourlyId(item.id)}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            <View style={[styles.sectionCard, surfaceShadowStyle]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {dailyForecast.length ? `${dailyForecast.length}-Day Forecast` : "Forecast"}
                </Text>
                <DimPressable
                  accessibilityRole="button"
                  onPress={toggleAllDailyDetails}
                  style={styles.sectionLinkButton}
                >
                  <Text style={styles.sectionLinkText}>View daily details</Text>
                  <Ionicons name="chevron-forward" size={18} color="#1F78FF" />
                </DimPressable>
              </View>

              <View style={styles.dailyList}>
                {dailyForecast.length === 0 ? (
                  <Text style={styles.emptySectionText}>No forecast days returned yet.</Text>
                ) : (
                  dailyForecast.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.dailyRowWrap,
                        index < dailyForecast.length - 1 && styles.dailyRowBorder,
                      ]}
                    >
                      <DailyForecastRow
                        item={item}
                        expanded={expandedDayIds.includes(item.id)}
                        onPress={() => toggleDailyRow(item.id)}
                        compact={compactForecastRows}
                      />
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={[styles.sectionCard, surfaceShadowStyle]}>
              <Text style={styles.sectionTitle}>Weather Alerts & Advisories</Text>

              <View style={styles.alertsList}>
                {weatherAlerts.length === 0 ? (
                  <Text style={styles.emptySectionText}>No active weather alerts for this area.</Text>
                ) : (
                  weatherAlerts.map((item) => (
                    <WeatherAlertCard
                      key={item.id}
                      item={item}
                      expanded={expandedAlertIds.includes(item.id)}
                      onPress={() => toggleAlert(item.id)}
                      compact={compactAlerts}
                    />
                  ))
                )}
              </View>
            </View>

            <View style={[styles.summaryCard, surfaceShadowStyle]}>
              {weatherSummary.map((item, index) => (
                <WeatherSummaryItem
                  key={item.id}
                  item={item}
                  compact={compactSummary}
                  showDivider={index < weatherSummary.length - 1}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <BottomNav activeLabel="Weather" items={WEATHER_NAV_ITEMS} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EDF4FE",
  },

  screen: {
    flex: 1,
    backgroundColor: "#EDF4FE",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#EDF4FE",
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  pageGlowTop: {
    position: "absolute",
    top: 60,
    left: -48,
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: "rgba(255, 235, 187, 0.26)",
  },

  pageGlowBottom: {
    position: "absolute",
    right: -56,
    bottom: 120,
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: "rgba(182, 215, 255, 0.22)",
  },

  pageInner: {
    maxWidth: 1040,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBackButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  headerBrandRow: {
    alignSelf: "auto",
    marginRight: 0,
  },

  headerBrandText: {
    fontSize: 26,
    color: "#16294A",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  headerActionButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 11,
    right: 9,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#FF8C3A",
  },

  heroSection: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    position: "relative",
  },

  heroSectionWide: {
    minHeight: 220,
  },

  heroSectionStacked: {
    alignItems: "flex-start",
    flexDirection: "column",
    minHeight: 0,
  },

  heroBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 18,
  },

  heroCloud: {
    position: "absolute",
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.74)",
  },

  heroCloudSmall: {
    top: 26,
    right: "41%",
    width: 64,
    height: 24,
  },

  heroCloudLarge: {
    top: 10,
    right: "15%",
    width: 84,
    height: 30,
  },

  heroSkylineRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    height: 124,
  },

  heroBuilding: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "rgba(141, 181, 232, 0.18)",
  },

  heroTextBlock: {
    flex: 1,
    maxWidth: 430,
    paddingTop: 20,
    paddingBottom: 24,
    paddingRight: 18,
    zIndex: 2,
  },

  heroTextBlockStacked: {
    width: "100%",
    maxWidth: "100%",
    paddingBottom: 12,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroTitle: {
    fontSize: 72,
    lineHeight: 76,
    fontWeight: "800",
    color: "#173366",
    letterSpacing: -1.7,
  },

  heroTitlePhone: {
    fontSize: 58,
    lineHeight: 60,
  },

  heroTitleIcon: {
    marginLeft: 10,
    marginTop: 8,
  },

  heroSubtitle: {
    marginTop: 14,
    maxWidth: 360,
    fontSize: 19,
    lineHeight: 34,
    fontWeight: "500",
    color: "#27467A",
  },

  heroSubtitlePhone: {
    fontSize: 17,
    lineHeight: 30,
  },

  heroArtworkWrap: {
    alignSelf: "flex-end",
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    zIndex: 1,
  },

  heroArtworkWrapStacked: {
    maxWidth: 360,
    marginTop: 4,
    alignSelf: "center",
  },

  heroArtwork: {
    width: "100%",
    height: "100%",
  },

  controlsCard: {
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 14,
  },

  searchRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#D7E4F7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
  },

  searchRowActive: {
    borderColor: "#BFD8FF",
    backgroundColor: "#F9FCFF",
  },

  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#223D69",
    paddingVertical: 14,
  },

  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: "#EAF3FF",
  },

  searchSuggestionsList: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7E4F7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  searchSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EDF8",
  },

  searchSuggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#223D69",
  },

  searchSuggestionEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#6B7C99",
  },

  locationControlsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  locationControlsRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  locationSelector: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#2E7FFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  locationSelectorStacked: {
    width: "100%",
  },

  locationSelectorOpen: {
    backgroundColor: "#F9FCFF",
  },

  locationSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  locationSelectorText: {
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#1F78FF",
  },

  currentLocationButton: {
    marginLeft: 14,
    minHeight: 50,
    minWidth: 210,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#D5E4F8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  currentLocationButtonStacked: {
    width: "100%",
    minWidth: 0,
    marginLeft: 0,
    marginTop: 12,
  },

  currentLocationButtonLoading: {
    backgroundColor: "#F8FBFF",
  },

  currentLocationButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F78FF",
  },

  locationMenu: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE8F7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  locationMenuItem: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEF4FC",
  },

  locationMenuItemSelected: {
    backgroundColor: "#F4F9FF",
  },

  locationMenuItemText: {
    fontSize: 15,
    color: "#27467A",
  },

  locationMenuItemTextSelected: {
    fontWeight: "700",
    color: "#1F78FF",
  },

  currentWeatherCardShell: {
    marginTop: 16,
    borderRadius: 28,
  },

  currentWeatherCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#3B8BFF",
    position: "relative",
  },

  currentWeatherGlowLeft: {
    position: "absolute",
    left: -58,
    bottom: -74,
    width: 266,
    height: 266,
    borderRadius: 133,
    backgroundColor: "rgba(177, 213, 255, 0.2)",
  },

  currentWeatherGlowRight: {
    position: "absolute",
    right: -56,
    top: -82,
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: "rgba(158, 203, 255, 0.18)",
  },

  currentWeatherSceneWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  currentWeatherScene: {
    width: "100%",
    height: 240,
    marginLeft: 0,
    opacity: 0.35,
  },

  currentWeatherSceneMobile: {
    opacity: 0.28,
  },

  currentWeatherSceneCompact: {
    width: "100%",
    height: 180,
    marginLeft: 0,
    marginRight: 0,
    alignSelf: "stretch",
  },

  currentWeatherContent: {
    paddingHorizontal: 26,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    minHeight: 220,
    zIndex: 1,
  },

  currentWeatherContentStacked: {
    flexDirection: "column",
  },

  currentWeatherPrimary: {
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
    paddingRight: 24,
  },

  currentWeatherPrimaryStacked: {
    paddingRight: 0,
  },

  currentWeatherTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  currentWeatherTopRowStacked: {
    alignItems: "flex-start",
  },

  currentWeatherSunWrap: {
    marginRight: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  currentWeatherIcon: {
    width: 104,
    height: 104,
  },

  weatherLoadingBlock: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
  },

  weatherLoadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  currentWeatherSummary: {
    marginTop: 8,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  statusBanner: {
    backgroundColor: "#FFECEA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 10,
  },

  statusBannerText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
  },

  statusRetryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1F78FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  statusRetryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  emptySectionText: {
    color: "#5D6B86",
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 8,
  },

  currentWeatherHeadlineWrap: {
    flexShrink: 1,
  },

  currentWeatherTemperatureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  currentWeatherTemperature: {
    fontSize: 92,
    lineHeight: 96,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2.2,
  },

  currentWeatherTemperaturePhone: {
    fontSize: 76,
    lineHeight: 80,
  },

  currentWeatherUnit: {
    marginTop: 10,
    marginLeft: 6,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  currentWeatherCondition: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  currentWeatherFeelsLike: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "500",
    color: "#EAF3FF",
  },

  currentWeatherTimestamp: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "500",
    color: "#F3F8FF",
  },

  metricsGrid: {
    width: 190,
    maxWidth: "42%",
    paddingTop: 4,
    flexShrink: 0,
  },

  metricsGridStacked: {
    width: "100%",
    maxWidth: "100%",
    marginTop: 20,
    flexDirection: "column",
  },

  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  metricItemCompact: {
    width: "100%",
    marginBottom: 14,
  },

  metricIconWrap: {
    width: 26,
    alignItems: "center",
  },

  metricTextWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 10,
  },

  metricTextWrapCompact: {
    marginLeft: 8,
  },

  metricLabel: {
    flex: 1,
    paddingRight: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#F2F7FF",
  },

  metricLabelCompact: {
    flex: 0,
    width: 86,
    paddingRight: 8,
    fontSize: 14,
  },

  metricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "right",
  },

  metricValueCompact: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },

  sectionCard: {
    marginTop: 16,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#182E55",
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },

  sectionLinkButtonActive: {
    backgroundColor: "#F4F9FF",
    borderRadius: 999,
    paddingHorizontal: 10,
  },

  sectionLinkText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F78FF",
  },

  hourlyScrollContent: {
    paddingTop: 14,
    paddingBottom: 4,
  },

  hourlyItem: {
    width: 98,
    minHeight: 142,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },

  hourlyItemActive: {
    backgroundColor: "#EEF5FF",
  },

  hourlyLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#203B67",
  },

  hourlyLabelActive: {
    color: "#1F78FF",
  },

  hourlyIconWrap: {
    marginTop: 6,
    marginBottom: 2,
  },

  hourlyTemperature: {
    fontSize: 18,
    fontWeight: "700",
    color: "#162B4F",
  },

  hourlyWindRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  hourlyWindText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "500",
    color: "#71809C",
  },

  dailyList: {
    marginTop: 10,
  },

  dailyRowWrap: {
    paddingVertical: 2,
  },

  dailyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FA",
  },

  dailyRow: {
    paddingVertical: 11,
  },

  dailyRowMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  dailyRowMainCompact: {
    flexWrap: "wrap",
    alignItems: "flex-start",
  },

  dailyDayText: {
    width: 158,
    fontSize: 15,
    fontWeight: "700",
    color: "#1D335A",
  },

  dailyDayTextCompact: {
    width: "100%",
    marginBottom: 10,
  },

  dailyConditionWrap: {
    flex: 1,
    minWidth: 160,
    flexDirection: "row",
    alignItems: "center",
  },

  dailyConditionWrapCompact: {
    minWidth: 0,
    marginBottom: 8,
  },

  dailyConditionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "500",
    color: "#3A5077",
  },

  dailyMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  dailyTemperatureText: {
    fontSize: 17,
    fontWeight: "700",
  },

  dailyLowTemp: {
    color: "#1F78FF",
  },

  dailyTemperatureSlash: {
    color: "#6B7A97",
  },

  dailyHighTemp: {
    color: "#FF513D",
  },

  dailyPrecipitationWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
  },

  dailyPrecipitationText: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: "500",
    color: "#345279",
  },

  dailyChevron: {
    marginLeft: 18,
  },

  dailyDetailText: {
    marginTop: 10,
    marginLeft: 38,
    fontSize: 14,
    lineHeight: 22,
    color: "#5E6D89",
  },

  alertsList: {
    marginTop: 14,
    gap: 12,
  },

  alertCard: {
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: "hidden",
  },

  alertCardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  alertCardMainCompact: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  alertIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  alertBody: {
    flex: 1,
    minWidth: 0,
  },

  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  alertTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#183158",
  },

  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },

  alertBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#35507B",
  },

  alertDetailText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#5B6C89",
  },

  alertFooterRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  alertTimestamp: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "500",
    color: "#53627F",
  },

  alertButton: {
    flexShrink: 0,
    minHeight: 36,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  alertButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  summaryCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: "row",
  },

  summaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },

  summaryItemWithDivider: {
    borderRightWidth: 1,
    borderRightColor: "#E9F0FA",
  },

  summaryContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryContentCompact: {
    flexDirection: "column",
  },

  summaryIconBubble: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  summaryIconBubbleCompact: {
    width: 30,
    height: 30,
    marginRight: 0,
    marginBottom: 3,
  },

  summaryTextWrap: {
    minWidth: 0,
    alignItems: "flex-start",
  },

  summaryTextWrapCompact: {
    width: "100%",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#667592",
  },

  summaryLabelCompact: {
    width: "100%",
    fontSize: 10.5,
    textAlign: "center",
  },

  summaryValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "700",
    color: "#163056",
  },

  summaryValueCompact: {
    textAlign: "center",
    fontSize: 14,
  },
});
