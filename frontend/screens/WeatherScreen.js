import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroRobotImage = require("../assets/images/weather-hero-robot-reference.png");
const weatherCardSceneImage = require("../assets/images/weather-card-scene-reference.png");

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
  { left: "34%", width: 22, height: 38 },
  { left: "42%", width: 14, height: 72 },
  { left: "50%", width: 26, height: 50 },
  { left: "60%", width: 18, height: 64 },
  { left: "69%", width: 36, height: 82 },
  { left: "82%", width: 18, height: 46 },
  { left: "89%", width: 14, height: 60 },
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

function HeaderActionButton({ iconName, onPress, showDot = false, iconSize = 22 }) {
  return (
    <DimPressable accessibilityRole="button" onPress={onPress} style={styles.headerActionButton}>
      <Ionicons name={iconName} size={iconSize} color="#111827" />
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
      <View style={styles.metricIconWrap}>{renderIcon(item.iconFamily, item.iconName, 15, "#EAF3FF")}</View>
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

function HourlyForecastItem({ item, active, onPress, itemWidth }) {
  const icon = getConditionIcon(item.condition);

  return (
    <DimPressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.hourlyItem,
        itemWidth ? { width: itemWidth } : null,
        active && styles.hourlyItemActive,
      ]}
    >
      <Text style={[styles.hourlyLabel, active && styles.hourlyLabelActive]}>{item.label}</Text>
      <View style={styles.hourlyIconWrap}>
        {item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={{ width: 26, height: 26 }} resizeMode="contain" />
        ) : (
          renderIcon(icon.family, icon.name, 26, icon.color)
        )}
      </View>
      <Text style={styles.hourlyTemperature}>{item.temperature}</Text>
      <View style={styles.hourlyWindRow}>
        <MaterialCommunityIcons name="weather-windy" size={12} color="#7E8AA4" />
        <Text style={styles.hourlyWindText}>{item.wind}</Text>
      </View>
    </DimPressable>
  );
}

function DailyForecastRow({ item, expanded, onPress, compact }) {
  const icon = getConditionIcon(item.condition);
  const iconSize = compact ? 18 : 20;

  return (
    <DimPressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.dailyRow, compact && styles.dailyRowCompact]}
    >
      <View style={styles.dailyRowMain}>
        <Text
          style={[styles.dailyDayText, compact && styles.dailyDayTextCompact]}
          numberOfLines={1}
        >
          {item.day}
        </Text>

        <View style={[styles.dailyConditionWrap, compact && styles.dailyConditionWrapCompact]}>
          {item.iconUrl ? (
            <Image
              source={{ uri: item.iconUrl }}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
            />
          ) : (
            renderIcon(icon.family, icon.name, iconSize, icon.color)
          )}
          <Text
            style={[styles.dailyConditionText, compact && styles.dailyConditionTextCompact]}
            numberOfLines={1}
          >
            {item.condition}
          </Text>
        </View>

        <View style={[styles.dailyMetaWrap, compact && styles.dailyMetaWrapCompact]}>
          <Text style={[styles.dailyTemperatureText, compact && styles.dailyTemperatureTextCompact]}>
            <Text style={styles.dailyLowTemp}>{item.low}</Text>
            <Text style={styles.dailyTemperatureSlash}> / </Text>
            <Text style={styles.dailyHighTemp}>{item.high}</Text>
          </Text>

          <View style={[styles.dailyPrecipitationWrap, compact && styles.dailyPrecipitationWrapCompact]}>
            <Ionicons name="water-outline" size={compact ? 12 : 13} color="#1F78FF" />
            <Text
              style={[styles.dailyPrecipitationText, compact && styles.dailyPrecipitationTextCompact]}
            >
              {item.precipitation}
            </Text>
          </View>

          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={compact ? 14 : 16}
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
          {renderIcon(item.iconFamily, item.iconName, 22, item.colors.iconColor)}
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

          <Text style={styles.alertDescription} numberOfLines={expanded ? 8 : 2}>
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
          {renderIcon(item.iconFamily, item.iconName, compact ? 18 : 20, "#3E88FF")}
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

  const filterActive = searchText.trim().length > 0;
  const isPhone = width < 520;
  const isCompactPhone = width < 400;
  // Keep title + robot side-by-side to match the reference; only stack on very narrow screens.
  const isHeroStacked = width < 340;
  // Reference keeps destination + Current location on one row on phone-width layouts.
  const stackLocationControls = width < 360;
  const stackCurrentWeather = width < 780;
  // Keep daily rows on one line with compact sizing on phone widths.
  const compactForecastRows = width < 520;
  const compactAlerts = width < 700;
  const compactSummary = width < 560;
  const bottomPadding = getBottomNavContentPadding(insets);
  const pageMaxWidth = width >= 1100 ? 780 : width >= 900 ? 740 : 700;
  const pageWidth = Math.min(Math.max(width - (isCompactPhone ? 20 : isPhone ? 24 : 28), 280), pageMaxWidth);
  const pagePaddingHorizontal = isCompactPhone ? 10 : isPhone ? 12 : 14;
  const showBackButton = width < 760 && typeof onBack === "function";
  // Hero art is 360×220 — size near natural resolution (avoid soft upscaling / cropping).
  const heroAspectRatio = 360 / 220;
  const heroArtworkWidth = isHeroStacked
    ? Math.min(pageWidth * 0.78, 220)
    : isCompactPhone
      ? Math.min(pageWidth * 0.42, 150)
      : isPhone
        ? Math.min(pageWidth * 0.4, 168)
        : width < 900
          ? Math.min(pageWidth * 0.38, 240)
          : Math.min(pageWidth * 0.36, 268);
  const heroArtworkHeight = Math.round(heroArtworkWidth / heroAspectRatio);
  const heroTitleSize = isCompactPhone ? 32 : isPhone ? 36 : width < 900 ? 42 : 46;
  const heroSubtitleSize = isCompactPhone ? 12 : isPhone ? 13 : 14;
  const headerIconSize = isPhone ? 20 : 22;
  const profileIconSize = isPhone ? 26 : 28;
  const weatherIconSize = isCompactPhone ? 64 : isPhone ? 72 : 80;
  const temperatureSize = isCompactPhone ? 56 : isPhone ? 64 : 72;
  const hourlyFitCount = Math.min(Math.max(weather.hourly.length, 1), 8);
  const hourlyItemWidth = Math.max(
    70,
    Math.min(86, Math.floor((pageWidth - 32 - (hourlyFitCount - 1) * 6) / hourlyFitCount))
  );
  const currentWeather = weather.current;
  const hourlyForecast = weather.hourly;
  const dailyForecast = weather.daily;
  const weatherAlerts = weather.alerts;
  const weatherSummary = weather.summary;
  const conditionIcon = getConditionIcon(currentWeather.condition);

  const loadWeather = useCallback(async (query) => {
    setLoading(true);
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
      setSelectedLocationLabel(mapped.destination || query?.destination || FALLBACK_LOCATION.label);
      setSelectedHourlyId(mapped.hourly[0]?.id || "now");
      setExpandedDayIds([]);
      setExpandedAlertIds([]);
    } catch (err) {
      setError(err?.message || "Couldn't load weather.");
    } finally {
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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: bottomPadding,
              paddingHorizontal: pagePaddingHorizontal,
              paddingTop: isPhone ? 8 : 10,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageGlowTop} />
          <View style={styles.pageGlowBottom} />

          <View style={[styles.pageInner, { width: pageWidth, maxWidth: pageMaxWidth }]}>
            <View style={styles.headerRow}>
              {showBackButton ? (
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={onBack}
                  style={styles.headerBackButton}
                >
                  <Ionicons name="arrow-back" size={isPhone ? 18 : 20} color="#14253E" />
                </DimPressable>
              ) : null}

              <View style={styles.headerActions}>
                <HeaderActionButton
                  iconName="notifications-outline"
                  onPress={() => onNavigate?.("notifications")}
                  showDot
                  iconSize={headerIconSize}
                />
                <HeaderActionButton
                  iconName="person-circle-outline"
                  onPress={() => onNavigate?.("profile")}
                  iconSize={profileIconSize}
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
              <HeroSkylineBackdrop />

              <View
                style={[
                  styles.heroTextBlock,
                  isHeroStacked && styles.heroTextBlockStacked,
                  isPhone && styles.heroTextBlockPhone,
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
                    Weather
                  </Text>
                  <Ionicons
                    name="partly-sunny"
                    size={isCompactPhone ? 26 : isPhone ? 30 : 34}
                    color="#2F86FF"
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
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={[styles.controlsCard, surfaceShadowStyle]}>
              <View style={[styles.searchRow, filterActive && styles.searchRowActive]}>
                <Ionicons name="search-outline" size={22} color="#7888A3" />
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
                  <ActivityIndicator color="#1F78FF" style={{ marginRight: 4 }} />
                ) : (
                  <DimPressable
                    accessibilityRole="button"
                    accessibilityLabel="Search weather"
                    onPress={handleSearchSubmit}
                    style={[styles.filterButton, filterActive && styles.filterButtonActive]}
                  >
                    <Ionicons
                      name="arrow-forward-circle"
                      size={22}
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
                    <Ionicons name="location" size={18} color="#1F78FF" />
                    <Text style={styles.locationSelectorText} numberOfLines={1}>
                      {selectedLocationLabel}
                    </Text>
                  </View>
                  <Ionicons
                    name={locationMenuOpen ? "chevron-up" : "chevron-down"}
                    size={18}
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
                    <Ionicons name="locate-outline" size={18} color="#1F78FF" />
                  )}
                  <Text style={styles.currentLocationButtonText} numberOfLines={1}>
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
                <Text style={styles.statusBannerText}>{error}</Text>
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
                              weatherIconSize,
                              conditionIcon.color === "#8FA0BA" ? "#FFC83D" : conditionIcon.color
                            )}
                          </View>

                          <View style={styles.currentWeatherHeadlineWrap}>
                            <View style={styles.currentWeatherTemperatureRow}>
                              <Text
                                style={[
                                  styles.currentWeatherTemperature,
                                  {
                                    fontSize: temperatureSize,
                                    lineHeight: temperatureSize + 4,
                                  },
                                ]}
                              >
                                {currentWeather.temperature}
                              </Text>
                              <Text
                                style={[
                                  styles.currentWeatherUnit,
                                  isPhone && styles.currentWeatherUnitPhone,
                                ]}
                              >
                                {currentWeather.unit}
                              </Text>
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
                  <Ionicons name="chevron-forward" size={16} color="#1F78FF" />
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
                      itemWidth={hourlyItemWidth}
                      active={selectedHourlyId === item.id || (!hourlyFocusActive && index === 0)}
                      onPress={() => setSelectedHourlyId(item.id)}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            <View style={[styles.sectionCard, styles.dailySectionCard, surfaceShadowStyle]}>
              <View style={[styles.sectionHeaderRow, styles.dailySectionHeader]}>
                <Text style={[styles.sectionTitle, styles.dailySectionTitle]} numberOfLines={1}>
                  {dailyForecast.length ? `${dailyForecast.length}-Day Forecast` : "Forecast"}
                </Text>
                <DimPressable
                  accessibilityRole="button"
                  onPress={toggleAllDailyDetails}
                  style={[styles.sectionLinkButton, styles.dailySectionLinkButton]}
                >
                  <Text style={[styles.sectionLinkText, styles.dailySectionLinkText]} numberOfLines={1}>
                    View daily details
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color="#1F78FF" />
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

        <BottomNav activeLabel="Weather" onNavigate={onNavigate} />
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
    paddingTop: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },

  pageGlowTop: {
    position: "absolute",
    top: 40,
    left: -48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 235, 187, 0.22)",
  },

  pageGlowBottom: {
    position: "absolute",
    right: -48,
    bottom: 100,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(182, 215, 255, 0.18)",
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
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8C3A",
  },

  heroSection: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
    gap: 6,
    overflow: "visible",
  },

  heroSectionPhone: {
    marginTop: 0,
    gap: 2,
    alignItems: "flex-start",
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
    top: 4,
  },

  heroCloud: {
    position: "absolute",
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },

  heroCloudSmall: {
    top: 18,
    right: "41%",
    width: 48,
    height: 18,
  },

  heroCloudLarge: {
    top: 6,
    right: "15%",
    width: 64,
    height: 22,
  },

  heroSkylineRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 4,
    height: 88,
  },

  heroBuilding: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: "rgba(141, 181, 232, 0.16)",
  },

  heroTextBlock: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 360,
    paddingTop: 8,
    paddingBottom: 0,
    paddingRight: 8,
    zIndex: 2,
  },

  heroTextBlockStacked: {
    width: "100%",
    maxWidth: "100%",
    paddingBottom: 4,
  },

  heroTextBlockPhone: {
    maxWidth: "56%",
    paddingRight: 2,
    paddingBottom: 0,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroTitle: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "800",
    color: "#173366",
    letterSpacing: -1.4,
  },

  heroTitleIcon: {
    marginLeft: 8,
    marginTop: 2,
  },

  heroSubtitle: {
    marginTop: 6,
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
    color: "#27467A",
  },

  heroArtworkWrap: {
    flexShrink: 0,
    alignSelf: "flex-start",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginTop: -4,
    overflow: "visible",
    backgroundColor: "transparent",
    zIndex: 1,
  },

  heroArtworkWrapStacked: {
    maxWidth: 280,
    marginTop: 2,
    alignSelf: "center",
  },

  heroArtwork: {
    width: "100%",
    height: "100%",
  },

  controlsCard: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 12,
  },

  searchRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D7E4F7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
  },

  searchRowActive: {
    borderColor: "#BFD8FF",
    backgroundColor: "#F9FCFF",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    fontSize: 15,
    color: "#223D69",
    paddingVertical: 10,
  },

  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  locationControlsRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  locationSelector: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2E7FFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
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
    minWidth: 0,
    marginRight: 8,
  },

  locationSelectorText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F78FF",
  },

  currentLocationButton: {
    marginLeft: 10,
    minHeight: 44,
    minWidth: 0,
    flexShrink: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D5E4F8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  currentLocationButtonStacked: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    marginLeft: 0,
    marginTop: 10,
  },

  currentLocationButtonLoading: {
    backgroundColor: "#F8FBFF",
  },

  currentLocationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#1F78FF",
    flexShrink: 1,
  },

  locationMenu: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDE8F7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  locationMenuItem: {
    minHeight: 46,
    paddingHorizontal: 14,
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
    marginTop: 12,
    borderRadius: 22,
  },

  currentWeatherCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#3B8BFF",
    position: "relative",
  },

  currentWeatherGlowLeft: {
    position: "absolute",
    left: -48,
    bottom: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(177, 213, 255, 0.2)",
  },

  currentWeatherGlowRight: {
    position: "absolute",
    right: -44,
    top: -64,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(158, 203, 255, 0.18)",
  },

  currentWeatherSceneWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  currentWeatherScene: {
    width: "100%",
    height: "100%",
    marginLeft: 0,
    opacity: 0.32,
  },

  currentWeatherSceneMobile: {
    opacity: 0.26,
  },

  currentWeatherSceneCompact: {
    width: "100%",
    height: "100%",
    marginLeft: 0,
    marginRight: 0,
    alignSelf: "stretch",
  },

  currentWeatherContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    minHeight: 176,
    zIndex: 1,
  },

  currentWeatherContentStacked: {
    flexDirection: "column",
    minHeight: 0,
  },

  currentWeatherPrimary: {
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
    paddingRight: 16,
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
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  currentWeatherIcon: {
    width: 72,
    height: 72,
  },

  weatherLoadingBlock: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },

  weatherLoadingText: {
    color: "#FFFFFF",
    fontSize: 14,
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
    fontSize: 72,
    lineHeight: 76,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.8,
  },

  currentWeatherUnit: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  currentWeatherUnitPhone: {
    fontSize: 22,
    lineHeight: 24,
    marginTop: 4,
  },

  currentWeatherCondition: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  currentWeatherFeelsLike: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#EAF3FF",
  },

  currentWeatherTimestamp: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
    color: "#F3F8FF",
  },

  metricsGrid: {
    width: 168,
    maxWidth: "40%",
    paddingTop: 2,
    flexShrink: 0,
    justifyContent: "center",
  },

  metricsGridStacked: {
    width: "100%",
    maxWidth: "100%",
    marginTop: 14,
    flexDirection: "column",
  },

  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  metricItemCompact: {
    width: "100%",
    marginBottom: 8,
  },

  metricIconWrap: {
    width: 22,
    alignItems: "center",
  },

  metricTextWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 8,
    minWidth: 0,
  },

  metricTextWrapCompact: {
    marginLeft: 6,
  },

  metricLabel: {
    flex: 1,
    paddingRight: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#F2F7FF",
  },

  metricLabelCompact: {
    flex: 0,
    width: 78,
    paddingRight: 6,
    fontSize: 12,
  },

  metricValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "right",
    flexShrink: 0,
  },

  metricValueCompact: {
    flex: 1,
    fontSize: 12,
    textAlign: "right",
  },

  sectionCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#182E55",
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },

  sectionLinkButtonActive: {
    backgroundColor: "#F4F9FF",
    borderRadius: 999,
    paddingHorizontal: 8,
  },

  sectionLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F78FF",
  },

  hourlyScrollContent: {
    paddingTop: 10,
    paddingBottom: 2,
    flexGrow: 1,
    justifyContent: "space-between",
  },

  hourlyItem: {
    width: 84,
    minHeight: 118,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 6,
    backgroundColor: "#FFFFFF",
  },

  hourlyItemActive: {
    backgroundColor: "#EEF5FF",
  },

  hourlyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#203B67",
  },

  hourlyLabelActive: {
    color: "#1F78FF",
  },

  hourlyIconWrap: {
    marginTop: 4,
    marginBottom: 2,
  },

  hourlyTemperature: {
    fontSize: 15,
    fontWeight: "700",
    color: "#162B4F",
  },

  hourlyWindRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },

  hourlyWindText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "500",
    color: "#71809C",
  },

  dailySectionCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  dailySectionHeader: {
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },

  dailySectionTitle: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
  },

  dailySectionLinkButton: {
    flexShrink: 0,
    paddingVertical: 0,
  },

  dailySectionLinkText: {
    fontSize: 13,
  },

  dailyList: {
    marginTop: 2,
  },

  dailyRowWrap: {
    paddingVertical: 0,
  },

  dailyRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EDF8",
  },

  dailyRow: {
    paddingVertical: 6,
    minHeight: 34,
    justifyContent: "center",
  },

  dailyRowCompact: {
    paddingVertical: 5,
    minHeight: 30,
  },

  dailyRowMain: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    minWidth: 0,
  },

  dailyDayText: {
    width: 104,
    maxWidth: "34%",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#1D335A",
    flexShrink: 0,
  },

  dailyDayTextCompact: {
    width: 86,
    maxWidth: "32%",
    fontSize: 11,
    lineHeight: 14,
  },

  dailyConditionWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 8,
  },

  dailyConditionWrapCompact: {
    marginLeft: 8,
    marginRight: 6,
  },

  dailyConditionText: {
    flexShrink: 1,
    minWidth: 0,
    marginLeft: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#3A5077",
  },

  dailyConditionTextCompact: {
    fontSize: 11,
    lineHeight: 14,
    marginLeft: 5,
  },

  dailyMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 4,
  },

  dailyMetaWrapCompact: {
    marginLeft: 2,
  },

  dailyTemperatureText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },

  dailyTemperatureTextCompact: {
    fontSize: 12,
    lineHeight: 14,
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
    marginLeft: 10,
  },

  dailyPrecipitationWrapCompact: {
    marginLeft: 8,
  },

  dailyPrecipitationText: {
    marginLeft: 3,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
    color: "#345279",
  },

  dailyPrecipitationTextCompact: {
    fontSize: 11,
  },

  dailyChevron: {
    marginLeft: 8,
  },

  dailyDetailText: {
    marginTop: 4,
    marginLeft: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#5E6D89",
  },

  alertsList: {
    marginTop: 10,
    gap: 8,
  },

  alertCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },

  alertCardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  alertCardMainCompact: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  alertIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    gap: 6,
    marginBottom: 4,
  },

  alertTitle: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#183158",
  },

  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },

  alertBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  alertDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: "#35507B",
  },

  alertDetailText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: "#5B6C89",
  },

  alertFooterRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  alertTimestamp: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: "500",
    color: "#53627F",
  },

  alertButton: {
    flexShrink: 0,
    minHeight: 30,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  alertButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  summaryCard: {
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "stretch",
  },

  summaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
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
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  summaryIconBubbleCompact: {
    width: 24,
    height: 24,
    marginRight: 0,
    marginBottom: 2,
  },

  summaryTextWrap: {
    minWidth: 0,
    alignItems: "flex-start",
    flexShrink: 1,
  },

  summaryTextWrapCompact: {
    width: "100%",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#667592",
  },

  summaryLabelCompact: {
    width: "100%",
    fontSize: 10,
    textAlign: "center",
  },

  summaryValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#163056",
  },

  summaryValueCompact: {
    textAlign: "center",
    fontSize: 12,
  },
});
