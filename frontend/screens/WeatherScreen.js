import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroRobotImage = require("../assets/images/weather-hero-robot-reference.png");
const weatherCardSceneImage = require("../assets/images/weather-card-scene-reference.png");

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

const HOURLY_FORECAST = [
  { id: "now", label: "Now", condition: "Sunny", temperature: "23°", wind: "8 km/h" },
  { id: "10am", label: "10 AM", condition: "Sunny", temperature: "24°", wind: "9 km/h" },
  { id: "11am", label: "11 AM", condition: "Sunny", temperature: "25°", wind: "10 km/h" },
  { id: "12pm", label: "12 PM", condition: "Partly Cloudy", temperature: "26°", wind: "11 km/h" },
  { id: "1pm", label: "1 PM", condition: "Partly Cloudy", temperature: "27°", wind: "11 km/h" },
  { id: "2pm", label: "2 PM", condition: "Partly Cloudy", temperature: "27°", wind: "12 km/h" },
  { id: "3pm", label: "3 PM", condition: "Partly Cloudy", temperature: "26°", wind: "12 km/h" },
  { id: "4pm", label: "4 PM", condition: "Sunny", temperature: "25°", wind: "11 km/h" },
];

const DAILY_FORECAST = [
  {
    id: "sat",
    day: "Saturday",
    condition: "Sunny",
    low: "18°",
    high: "27°",
    precipitation: "10%",
    detail: "Bright skies through the afternoon with light breezes and comfortable evening temperatures.",
  },
  {
    id: "sun",
    day: "Sunday",
    condition: "Partly Cloudy",
    low: "18°",
    high: "26°",
    precipitation: "20%",
    detail: "A few passing clouds later in the day, but most sightseeing windows stay dry and pleasant.",
  },
  {
    id: "mon",
    day: "Monday",
    condition: "Showers",
    low: "17°",
    high: "21°",
    precipitation: "60%",
    detail: "Showers become more likely around midday, so plan indoor stops or an umbrella for transit.",
  },
  {
    id: "tue",
    day: "Tuesday",
    condition: "Cloudy",
    low: "16°",
    high: "20°",
    precipitation: "30%",
    detail: "Cloud cover sticks around most of the day with cooler air and a small chance of light rain.",
  },
  {
    id: "wed",
    day: "Wednesday",
    condition: "Partly Cloudy",
    low: "15°",
    high: "22°",
    precipitation: "20%",
    detail: "A calmer split between clouds and sunshine makes this one of the easier sightseeing days.",
  },
  {
    id: "thu",
    day: "Thursday",
    condition: "Sunny",
    low: "16°",
    high: "24°",
    precipitation: "10%",
    detail: "Clearer skies return with warmer afternoon temperatures and very low rain risk.",
  },
  {
    id: "fri",
    day: "Friday",
    condition: "Mostly Sunny",
    low: "17°",
    high: "25°",
    precipitation: "10%",
    detail: "A bright finish to the week with just a touch of cloud cover and dry evening conditions.",
  },
];

const WEATHER_ALERTS = [
  {
    id: "uv",
    title: "High UV Index",
    badge: "Alert",
    description:
      "High UV levels expected today. Use sunscreen, wear protective clothing, and stay hydrated.",
    detail:
      "Peak exposure is expected from late morning through mid-afternoon, so lightweight layers and shaded breaks are recommended.",
    timestamp: "May 10, 2025 • 9:00 AM",
    iconFamily: "ion",
    iconName: "warning",
    colors: {
      border: "#F9C7B1",
      background: "#FFF8F3",
      iconBackground: "#FFF1E7",
      iconColor: "#F97316",
      badgeBackground: "#FFE4D3",
      badgeColor: "#E8632F",
      buttonBorder: "#F7B794",
      buttonText: "#E8632F",
    },
  },
  {
    id: "rain",
    title: "Heavy Rain Advisory",
    badge: "Advisory",
    description:
      "Periods of heavy rain expected Monday. Plan for possible travel delays and wet conditions.",
    detail:
      "Transit platforms and roadways may slow down during the heaviest rain bands, especially later in the day.",
    timestamp: "May 10, 2025 • 8:45 AM",
    iconFamily: "ion",
    iconName: "rainy",
    colors: {
      border: "#C9DCFF",
      background: "#F6FAFF",
      iconBackground: "#E7F0FF",
      iconColor: "#2F86FF",
      badgeBackground: "#E3EEFF",
      badgeColor: "#2C6AE6",
      buttonBorder: "#B4CEFF",
      buttonText: "#2C6AE6",
    },
  },
  {
    id: "storm",
    title: "Thunderstorm Watch",
    badge: "Watch",
    description:
      "Thunderstorms possible late Monday night through Tuesday morning. Stay tuned for updates.",
    detail:
      "If the timing holds, expect the strongest cells overnight with occasional lightning and short bursts of intense rain.",
    timestamp: "May 10, 2025 • 8:30 AM",
    iconFamily: "ion",
    iconName: "flash",
    colors: {
      border: "#E0CCFF",
      background: "#FBF7FF",
      iconBackground: "#F1E8FF",
      iconColor: "#8B5CF6",
      badgeBackground: "#EEE1FF",
      badgeColor: "#7C3AED",
      buttonBorder: "#D6BDFF",
      buttonText: "#7C3AED",
    },
  },
];

const WEATHER_SUMMARY = [
  {
    id: "sunrise",
    label: "Sunrise",
    value: "4:45 AM",
    iconFamily: "material",
    iconName: "weather-sunset-up",
  },
  {
    id: "sunset",
    label: "Sunset",
    value: "6:32 PM",
    iconFamily: "material",
    iconName: "weather-sunset-down",
  },
  {
    id: "precipitation",
    label: "Precipitation",
    value: "10%",
    iconFamily: "ion",
    iconName: "water",
  },
  {
    id: "air-quality",
    label: "Air Quality",
    value: "Good (28)",
    iconFamily: "ion",
    iconName: "leaf",
  },
];

const CURRENT_WEATHER = {
  temperature: "23",
  unit: "°C",
  condition: "Sunny",
  feelsLike: "Feels like 24°",
  timestamp: "May 10, 2025 • 9:30 AM",
  details: [
    { id: "humidity", label: "Humidity", value: "58%", iconFamily: "ion", iconName: "water-outline" },
    { id: "wind", label: "Wind", value: "8 km/h NE", iconFamily: "material", iconName: "weather-windy" },
    { id: "uv", label: "UV Index", value: "6 High", iconFamily: "material", iconName: "white-balance-sunny" },
    { id: "visibility", label: "Visibility", value: "10 km", iconFamily: "ion", iconName: "eye-outline" },
    { id: "pressure", label: "Pressure", value: "1016 hPa", iconFamily: "material", iconName: "gauge" },
  ],
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
  if (condition === "Sunny") {
    return { family: "ion", name: "sunny", color: "#FDB515" };
  }

  if (condition === "Mostly Sunny") {
    return { family: "ion", name: "partly-sunny", color: "#FDB515" };
  }

  if (condition === "Partly Cloudy") {
    return { family: "ion", name: "partly-sunny", color: "#FDB515" };
  }

  if (condition === "Showers") {
    return { family: "ion", name: "rainy", color: "#51A2FF" };
  }

  return { family: "ion", name: "cloud", color: "#8FA0BA" };
}

function HeaderActionButton({ iconName, onPress, showDot = false }) {
  return (
    <DimPressable accessibilityRole="button" onPress={onPress} style={styles.headerActionButton}>
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
        {renderIcon(icon.family, icon.name, 34, icon.color)}
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
          {renderIcon(icon.family, icon.name, 26, icon.color)}
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
    <View style={[styles.alertCard, { borderColor: item.colors.border, backgroundColor: item.colors.background }]}>
      <View style={[styles.alertCardMain, compact && styles.alertCardMainCompact]}>
        <View style={[styles.alertIconBubble, { backgroundColor: item.colors.iconBackground }]}>
          {renderIcon(item.iconFamily, item.iconName, 36, item.colors.iconColor)}
        </View>

        <View style={styles.alertBody}>
          <View style={[styles.alertHeaderRow, compact && styles.alertHeaderRowCompact]}>
            <View style={styles.alertTitleGroup}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <View style={[styles.alertBadge, { backgroundColor: item.colors.badgeBackground }]}>
                <Text style={[styles.alertBadgeText, { color: item.colors.badgeColor }]}>{item.badge}</Text>
              </View>
            </View>
            <Text style={styles.alertTimestamp}>{item.timestamp}</Text>
          </View>

          <Text style={styles.alertDescription}>{item.description}</Text>

          {expanded ? <Text style={styles.alertDetailText}>{item.detail}</Text> : null}
        </View>

        <DimPressable
          accessibilityRole="button"
          onPress={onPress}
          style={[styles.alertButton, compact && styles.alertButtonCompact, { borderColor: item.colors.buttonBorder }]}
        >
          <Text style={[styles.alertButtonText, { color: item.colors.buttonText }]}>View Details</Text>
        </DimPressable>
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
  const [searchText, setSearchText] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATION_OPTIONS[0].id);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hourlyFocusActive, setHourlyFocusActive] = useState(false);
  const [selectedHourlyId, setSelectedHourlyId] = useState(HOURLY_FORECAST[0].id);
  const [expandedDayIds, setExpandedDayIds] = useState([]);
  const [expandedAlertIds, setExpandedAlertIds] = useState([]);

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
  const selectedLocation =
    LOCATION_OPTIONS.find((locationOption) => locationOption.id === selectedLocationId) || LOCATION_OPTIONS[0];

  async function handleCurrentLocationPress() {
    if (locating) {
      return;
    }

    setLocating(true);
    setLocationMenuOpen(false);

    await new Promise((resolve) => {
      setTimeout(resolve, 850);
    });

    setSelectedLocationId("tokyo");
    setSearchText("");
    setLocating(false);
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
    if (expandedDayIds.length === DAILY_FORECAST.length) {
      setExpandedDayIds([]);
      return;
    }

    setExpandedDayIds(DAILY_FORECAST.map((item) => item.id));
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
                      iconName="notifications-outline"
                      onPress={() => onNavigate?.("notifications")}
                      showDot
                    />
                    <HeaderActionButton
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
                      iconName="notifications-outline"
                      onPress={() => onNavigate?.("notifications")}
                      showDot
                    />
                    <HeaderActionButton
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
                  onChangeText={setSearchText}
                  placeholder="Search destination or city"
                  placeholderTextColor="#7F8EA8"
                  style={styles.searchInput}
                  selectionColor="#1F78FF"
                  returnKeyType="search"
                />
                <DimPressable
                  accessibilityRole="button"
                  onPress={() => setFilterActive((currentValue) => !currentValue)}
                  style={[styles.filterButton, filterActive && styles.filterButtonActive]}
                >
                  <MaterialCommunityIcons
                    name="tune-variant"
                    size={22}
                    color={filterActive ? "#1F78FF" : "#7888A3"}
                  />
                </DimPressable>
              </View>

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
                    <Text style={styles.locationSelectorText}>{selectedLocation.label}</Text>
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
                          setSearchText(locationOption.label);
                          setLocationMenuOpen(false);
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
                  <View style={[styles.currentWeatherPrimary, stackCurrentWeather && styles.currentWeatherPrimaryStacked]}>
                    <View style={[styles.currentWeatherTopRow, stackCurrentWeather && styles.currentWeatherTopRowStacked]}>
                      <View style={styles.currentWeatherSunWrap}>
                        <Ionicons name="sunny" size={isPhone ? 108 : 126} color="#FFC83D" />
                      </View>

                      <View style={styles.currentWeatherHeadlineWrap}>
                        <View style={styles.currentWeatherTemperatureRow}>
                          <Text style={[styles.currentWeatherTemperature, isPhone && styles.currentWeatherTemperaturePhone]}>
                            {CURRENT_WEATHER.temperature}
                          </Text>
                          <Text style={styles.currentWeatherUnit}>{CURRENT_WEATHER.unit}</Text>
                        </View>
                        <Text style={styles.currentWeatherCondition}>{CURRENT_WEATHER.condition}</Text>
                        <Text style={styles.currentWeatherFeelsLike}>{CURRENT_WEATHER.feelsLike}</Text>
                      </View>
                    </View>

                    <Text style={styles.currentWeatherTimestamp}>{CURRENT_WEATHER.timestamp}</Text>
                  </View>

                  <View style={[styles.metricsGrid, stackCurrentWeather && styles.metricsGridStacked]}>
                    {CURRENT_WEATHER.details.map((item) => (
                      <WeatherMetric
                        key={item.id}
                        item={item}
                        compact={stackCurrentWeather}
                      />
                    ))}
                  </View>
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
                {HOURLY_FORECAST.map((item, index) => (
                  <HourlyForecastItem
                    key={item.id}
                    item={item}
                    active={selectedHourlyId === item.id || (!hourlyFocusActive && index === 0)}
                    onPress={() => setSelectedHourlyId(item.id)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={[styles.sectionCard, surfaceShadowStyle]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>7-Day Forecast</Text>
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
                {DAILY_FORECAST.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.dailyRowWrap, index < DAILY_FORECAST.length - 1 && styles.dailyRowBorder]}
                  >
                    <DailyForecastRow
                      item={item}
                      expanded={expandedDayIds.includes(item.id)}
                      onPress={() => toggleDailyRow(item.id)}
                      compact={compactForecastRows}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.sectionCard, surfaceShadowStyle]}>
              <Text style={styles.sectionTitle}>Weather Alerts & Advisories</Text>

              <View style={styles.alertsList}>
                {WEATHER_ALERTS.map((item) => (
                  <WeatherAlertCard
                    key={item.id}
                    item={item}
                    expanded={expandedAlertIds.includes(item.id)}
                    onPress={() => toggleAlert(item.id)}
                    compact={compactAlerts}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.summaryCard, surfaceShadowStyle]}>
              {WEATHER_SUMMARY.map((item, index) => (
                <WeatherSummaryItem
                  key={item.id}
                  item={item}
                  compact={compactSummary}
                  showDivider={index < WEATHER_SUMMARY.length - 1}
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
    backgroundColor: "#4690F5",
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  currentWeatherScene: {
    width: 356,
    height: 214,
    marginLeft: 138,
    opacity: 0.42,
  },

  currentWeatherSceneMobile: {
    opacity: 0.2,
  },

  currentWeatherSceneCompact: {
    width: 214,
    height: 128,
    marginLeft: 0,
    marginRight: 12,
    alignSelf: "flex-end",
  },

  currentWeatherContent: {
    paddingHorizontal: 26,
    paddingVertical: 22,
    flexDirection: "row",
    justifyContent: "space-between",
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
    width: 300,
    paddingTop: 8,
  },

  metricsGridStacked: {
    width: "100%",
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
  },

  alertCard: {
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
  },

  alertCardMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  alertCardMainCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  alertIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  alertBody: {
    flex: 1,
  },

  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  alertHeaderRowCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  alertTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  alertTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#183158",
  },

  alertBadge: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  alertBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  alertTimestamp: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#53627F",
  },

  alertDescription: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#35507B",
  },

  alertDetailText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#5B6C89",
  },

  alertButton: {
    minWidth: 126,
    minHeight: 42,
    marginLeft: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  alertButtonCompact: {
    marginLeft: 0,
    marginTop: 14,
    alignSelf: "flex-start",
  },

  alertButtonText: {
    fontSize: 14,
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
