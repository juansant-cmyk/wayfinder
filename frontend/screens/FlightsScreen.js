import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
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

const flightsHeroArt = require("../assets/images/flights/flights-hero-reference-crop.png");
const flightsSearchDecorArt = require("../assets/images/flights/flights-search-card-decor-crop.png");
const trackerBotArt = require("../assets/images/itinerary-tip-bot-reference.png");
const SEARCH_DECOR_ART_ASPECT_RATIO = 272 / 74;

const COLORS = {
  background: "#EAF2FC",
  card: "#FFFFFF",
  border: "#D6E4F8",
  text: "#10213B",
  subtext: "#51607D",
  muted: "#7A88A4",
  blue: "#1F78FF",
  blueDeep: "#0B5FE7",
  blueLight: "#DDEBFF",
  orange: "#FF7A32",
};

const DEFAULT_ORIGIN = {
  code: "LAX",
  label: "Los Angeles",
  aliases: ["lax", "los angeles", "los angeles international", "la"],
  icon: "ellipse",
};

const DESTINATION_PRESETS = [
  {
    code: "NRT",
    label: "Tokyo (Narita)",
    aliases: ["nrt", "tokyo", "narita", "tokyo narita", "japan"],
  },
  {
    code: "DPS",
    label: "Bali (Denpasar)",
    aliases: ["dps", "bali", "denpasar", "indonesia"],
  },
  {
    code: "LIS",
    label: "Lisbon",
    aliases: ["lis", "lisbon", "portugal"],
  },
  {
    code: "ZRH",
    label: "Zurich",
    aliases: ["zrh", "zurich", "switzerland"],
  },
];

const AIRPORT_PRESETS = [DEFAULT_ORIGIN, ...DESTINATION_PRESETS];

const DEPARTURE_OPTIONS = ["Jul 12, 2025", "Jul 14, 2025", "Jul 18, 2025"];
const RETURN_OPTIONS = ["Jul 19, 2025", "Jul 21, 2025", "Jul 25, 2025"];
const TRAVELER_OPTIONS = [
  {
    id: "solo-economy",
    label: "1 Traveler, Economy",
    description: "Best for flexible solo trips.",
  },
  {
    id: "duo-premium",
    label: "2 Travelers, Premium Economy",
    description: "A little more room for the long haul.",
  },
  {
    id: "family-business",
    label: "3 Travelers, Business",
    description: "Added comfort for a bigger trip.",
  },
];

const BENEFITS = [
  {
    title: "Best Prices",
    description: "We compare so you save more",
    icon: "pricetag-outline",
    iconFamily: "ion",
    iconColor: "#1F78FF",
    iconBackground: "#EAF2FF",
  },
  {
    title: "No Hidden Fees",
    description: "What you see is what you pay",
    icon: "checkmark-circle-outline",
    iconFamily: "ion",
    iconColor: "#19A64A",
    iconBackground: "#EAF9F0",
  },
  {
    title: "Secure Booking",
    description: "Book with confidence every time",
    icon: "lock-closed-outline",
    iconFamily: "ion",
    iconColor: "#7A5AF8",
    iconBackground: "#F0EBFF",
  },
  {
    title: "24/7 Support",
    description: "We're here to help anytime",
    icon: "headset",
    iconFamily: "material",
    iconColor: "#FF7A32",
    iconBackground: "#FFF1E8",
  },
];

const SORT_OPTIONS = [
  { key: "bestPrice", label: "Best Price" },
  { key: "shortestDuration", label: "Shortest Duration" },
  { key: "bestOverall", label: "Best Overall" },
];

const FLIGHT_LIBRARY = [
  {
    id: "ana",
    airline: "All Nippon Airways",
    displayName: "ANA",
    category: "Best Overall",
    categoryBackground: "#DCF5DF",
    categoryColor: "#147E38",
    departureTime: "11:15 AM",
    arrivalTime: "3:35 PM",
    arrivalOffset: "+1",
    duration: "11h 20m",
    durationMinutes: 680,
    stopInfo: "Nonstop",
    stopColor: "#149647",
    stopsCount: 0,
    price: 765,
    details:
      "This mock itinerary keeps the route simple with a nonstop flight and a comfortable midday departure.",
    summary:
      "Balanced timing, reliable connection-free routing, and one of the smoothest overall mock itineraries.",
  },
  {
    id: "korean-air",
    airline: "Korean Air",
    displayName: "KOREAN AIR",
    category: "Best Price",
    categoryBackground: "#E7EEFF",
    categoryColor: "#2C6AE6",
    departureTime: "1:20 PM",
    arrivalTime: "6:05 PM",
    arrivalOffset: "+1",
    duration: "13h 45m",
    durationMinutes: 825,
    stopInfo: "1 stop · ICN",
    stopColor: "#41567D",
    stopsCount: 1,
    price: 612,
    details:
      "A good placeholder itinerary when price matters most and you do not mind a single connection in Seoul.",
    summary:
      "The most budget-friendly option in the mock results, with one Incheon connection built in.",
  },
  {
    id: "jal",
    airline: "Japan Airlines",
    displayName: "JAPAN AIRLINES",
    category: "Shortest Duration",
    categoryBackground: "#F0E8FF",
    categoryColor: "#6E4BE6",
    departureTime: "12:45 PM",
    arrivalTime: "4:20 PM",
    arrivalOffset: "+1",
    duration: "10h 35m",
    durationMinutes: 635,
    stopInfo: "Nonstop",
    stopColor: "#149647",
    stopsCount: 0,
    price: 812,
    details:
      "This placeholder itinerary is optimized for total duration, making it the fastest option on the screen.",
    summary:
      "Ideal when total travel time matters more than fare and you want the quickest direct route.",
  },
];

const cardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 10px 22px rgba(143, 163, 191, 0.12)",
  },
  default: {
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});

const searchCardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 18px 34px rgba(31, 120, 255, 0.22)",
  },
  default: {
    shadowColor: "#1F78FF",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
});

function renderIcon(iconFamily, iconName, color, size) {
  if (iconFamily === "material") {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }

  return <Ionicons name={iconName} size={size} color={color} />;
}

function titleCase(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAirportInput(value) {
  const nextValue = value.replace(/\s{2,}/g, " ");
  const compactValue = nextValue.replace(/\s+/g, "");

  if (/^[a-zA-Z]{1,4}$/.test(compactValue) && !nextValue.includes(" ")) {
    return compactValue.toUpperCase();
  }

  return nextValue;
}

function getAirportPreset(query, fallbackPreset = DESTINATION_PRESETS[0]) {
  if (!query) {
    return fallbackPreset;
  }

  const normalized = query.trim().toLowerCase();
  const preset = AIRPORT_PRESETS.find((option) => {
    const aliases = option.aliases || [];
    return (
      option.code.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized ||
      aliases.some((alias) => normalized.includes(alias))
    );
  });

  if (preset) {
    return preset;
  }

  return {
    code: query.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "---",
    label: titleCase(query),
  };
}

function getDefaultDestinationPreset(destinationName) {
  return getAirportPreset(destinationName, DESTINATION_PRESETS[0]);
}

function buildAirportFromQuery(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      code: "---",
      label: "",
    };
  }

  const preset = getAirportPreset(trimmedQuery);
  return {
    code: preset.code,
    label: preset.label,
  };
}

function getAirportHelperLabel(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return "";
  }

  const preset = AIRPORT_PRESETS.find((option) => option.code === trimmedQuery.toUpperCase());
  return preset ? preset.label : "";
}

function buildFlights(origin, destination) {
  return FLIGHT_LIBRARY.map((flight) => ({
    ...flight,
    originCode: origin.code,
    destinationCode: destination.code,
    routeLabel: `${origin.code} to ${destination.code}`,
  }));
}

function getSortedFlights(flights, sortKey) {
  const nextFlights = [...flights];

  if (sortKey === "bestPrice") {
    return nextFlights.sort((left, right) => left.price - right.price);
  }

  if (sortKey === "shortestDuration") {
    return nextFlights.sort((left, right) => left.durationMinutes - right.durationMinutes);
  }

  if (sortKey === "bestOverall") {
    const preferredOrder = ["ana", "korean-air", "jal"];
    return nextFlights.sort(
      (left, right) => preferredOrder.indexOf(left.id) - preferredOrder.indexOf(right.id)
    );
  }

  return nextFlights;
}

function HeroArtwork() {
  return (
    <View style={styles.heroArtworkShell}>
      <View style={styles.heroArtworkFrame}>
        <Image
          source={flightsHeroArt}
          resizeMode="contain"
          style={styles.heroArtworkImage}
        />
      </View>
    </View>
  );
}

function SearchField({
  label,
  primaryText,
  secondaryText,
  iconName,
  iconFamily = "ion",
  onPress,
  accessibilityLabel,
  isPhone,
  style,
}) {
  const Wrapper = onPress ? DimPressable : View;

  return (
    <Wrapper
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.fieldCard, isPhone && styles.fieldCardPhone, style]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>
        <View style={styles.fieldIconWrap}>
          {renderIcon(iconFamily, iconName, COLORS.blue, isPhone ? 20 : 22)}
        </View>
        <View style={styles.fieldTextWrap}>
          <Text style={[styles.fieldPrimaryText, isPhone && styles.fieldPrimaryTextPhone]}>
            {primaryText}
          </Text>
          {secondaryText ? <Text style={styles.fieldSecondaryText}>{secondaryText}</Text> : null}
        </View>
      </View>
    </Wrapper>
  );
}

function AirportInputField({
  label,
  value,
  helperText,
  iconName,
  iconFamily = "ion",
  onChangeText,
  placeholder,
  isPhone,
  style,
}) {
  return (
    <View style={[styles.fieldCard, styles.airportInputCard, isPhone && styles.fieldCardPhone, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>
        <View style={styles.fieldIconWrap}>
          {renderIcon(iconFamily, iconName, COLORS.blue, isPhone ? 19 : 21)}
        </View>
        <View style={styles.fieldTextWrap}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#8F9BB3"
            autoCapitalize="words"
            autoCorrect={false}
            selectionColor={COLORS.blue}
            style={[styles.airportInput, isPhone && styles.airportInputPhone]}
          />
          {helperText ? <Text style={styles.fieldSecondaryText}>{helperText}</Text> : null}
        </View>
      </View>
    </View>
  );
}

function BenefitCard({ item, isPhone }) {
  const shouldCenterCardContent =
    item.title === "Best Prices" || item.title === "24/7 Support";

  return (
    <View
      style={[
        styles.benefitCard,
        shouldCenterCardContent && styles.benefitCardContentCentered,
        isPhone && styles.benefitCardPhone,
        cardShadowStyle,
      ]}
    >
      <View style={[styles.benefitIconWrap, { backgroundColor: item.iconBackground }]}>
        {renderIcon(item.iconFamily, item.icon, item.iconColor, 22)}
      </View>
      <View style={styles.benefitCopy}>
        <Text style={styles.benefitTitle}>{item.title}</Text>
        <Text style={styles.benefitDescription}>{item.description}</Text>
      </View>
    </View>
  );
}

function AirlineMark({ flight, isPhone }) {
  if (flight.id === "ana") {
    return (
      <View style={styles.airlineWrap}>
        <View style={styles.anaLogoRow}>
          <Text style={[styles.anaLogoText, isPhone && styles.anaLogoTextPhone]}>ANA</Text>
          <View style={styles.anaLogoWing} />
        </View>
        <Text style={styles.airlineSubtitle}>{flight.airline}</Text>
      </View>
    );
  }

  if (flight.id === "korean-air") {
    return (
      <View style={styles.airlineWrap}>
        <View style={styles.airlineBrandRow}>
          <View style={styles.koreanBadge}>
            <View style={styles.koreanBadgeTop} />
            <View style={styles.koreanBadgeBottom} />
          </View>
          <Text style={[styles.airlineWordmark, isPhone && styles.airlineWordmarkPhone]}>
            {flight.displayName}
          </Text>
        </View>
        <Text style={styles.airlineSubtitle}>{flight.airline}</Text>
      </View>
    );
  }

  return (
    <View style={styles.airlineWrap}>
      <View style={styles.airlineBrandRow}>
        <View style={styles.jalBadge}>
          <Text style={styles.jalBadgeText}>JAL</Text>
        </View>
        <Text style={[styles.airlineWordmark, isPhone && styles.airlineWordmarkPhone]}>
          {flight.displayName}
        </Text>
      </View>
      <Text style={styles.airlineSubtitle}>{flight.airline}</Text>
    </View>
  );
}

function RouteSummary({ flight, isPhone }) {
  return (
    <View style={[styles.routeSummaryWrap, isPhone && styles.routeSummaryWrapPhone]}>
      <View style={styles.routeEndpoint}>
        <Text style={[styles.routeTimeText, isPhone && styles.routeTimeTextPhone]}>
          {flight.departureTime}
        </Text>
        <Text style={styles.routeCodeText}>{flight.originCode}</Text>
      </View>

      <View style={[styles.routeMiddle, isPhone && styles.routeMiddlePhone]}>
        <Text style={styles.routeDurationText}>{flight.duration}</Text>
        <View style={styles.routeLineRow}>
          <View style={styles.routeDot} />
          <View style={styles.routeLine} />
          <View style={styles.routeDot} />
        </View>
        <Text style={[styles.routeStopText, { color: flight.stopColor }]}>{flight.stopInfo}</Text>
      </View>

      <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
        <Text style={[styles.routeTimeText, isPhone && styles.routeTimeTextPhone]}>
          {flight.arrivalTime} <Text style={styles.routeOffsetText}>{flight.arrivalOffset}</Text>
        </Text>
        <Text style={styles.routeCodeText}>{flight.destinationCode}</Text>
      </View>
    </View>
  );
}

function FlightCard({ flight, isPhone, onToggleSaved, isSaved, onViewDetails }) {
  return (
    <View style={[styles.flightCard, cardShadowStyle]}>
      <View style={styles.flightCardTopRow}>
        <View
          style={[
            styles.flightBadge,
            { backgroundColor: flight.categoryBackground },
          ]}
        >
          <Text style={[styles.flightBadgeText, { color: flight.categoryColor }]}>
            {flight.category}
          </Text>
        </View>

        <DimPressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove ${flight.airline} from saved` : `Save ${flight.airline}`}
          onPress={onToggleSaved}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={24}
            color={isSaved ? "#FF5A4E" : COLORS.text}
          />
        </DimPressable>
      </View>

      <View style={[styles.flightCardMainRow, isPhone && styles.flightCardMainRowPhone]}>
        <View style={[styles.flightInfoColumn, isPhone && styles.flightInfoColumnPhone]}>
          <AirlineMark flight={flight} isPhone={isPhone} />
          <RouteSummary flight={flight} isPhone={isPhone} />
        </View>

        <View style={[styles.flightPriceColumn, isPhone && styles.flightPriceColumnPhone]}>
          <View>
            <Text style={[styles.flightPriceValue, isPhone && styles.flightPriceValuePhone]}>
              ${flight.price}
            </Text>
            <Text style={styles.flightPriceCaption}>round trip</Text>
          </View>

          <DimPressable
            accessibilityRole="button"
            accessibilityLabel={`View details for ${flight.airline}`}
            onPress={onViewDetails}
            style={[styles.detailsButton, isPhone && styles.detailsButtonPhone]}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </DimPressable>
        </View>
      </View>
    </View>
  );
}

function SheetModal({ visible, title, subtitle, onClose, children }) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, cardShadowStyle]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={22} color={COLORS.text} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export default function FlightsScreen({
  onGoBack,
  onNavigateHome,
  onNavigate,
  params = {},
}) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width } = useWindowDimensions();
  const isPhone = width < 520;
  const isNarrow = width < 760;
  const defaultDestinationPreset = getDefaultDestinationPreset(params.destination);

  const [fromQuery, setFromQuery] = useState(DEFAULT_ORIGIN.code);
  const [toQuery, setToQuery] = useState(() => defaultDestinationPreset.code);
  const [departDate, setDepartDate] = useState(DEPARTURE_OPTIONS[0]);
  const [returnDate, setReturnDate] = useState(RETURN_OPTIONS[0]);
  const [travelerOption, setTravelerOption] = useState(TRAVELER_OPTIONS[0]);
  const [selectedSortKey, setSelectedSortKey] = useState(SORT_OPTIONS[0].key);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [savedFlightIds, setSavedFlightIds] = useState([]);
  const [activePicker, setActivePicker] = useState(null);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [isTrackingRoute, setIsTrackingRoute] = useState(false);
  const [searchMessage, setSearchMessage] = useState(
    "Showing curated mock fares for your next adventure."
  );

  useEffect(() => {
    const nextDestination = getDefaultDestinationPreset(params.destination);
    setFromQuery(DEFAULT_ORIGIN.code);
    setToQuery(nextDestination.code);
    setSearchMessage(`Ready to compare fares from ${DEFAULT_ORIGIN.code} to ${nextDestination.code}.`);
    setIsTrackingRoute(false);
    setIsSortMenuOpen(false);
    setActivePicker(null);
    setSelectedFlightId(null);
  }, [params.destination]);

  const fromAirport = buildAirportFromQuery(fromQuery);
  const toAirport = buildAirportFromQuery(toQuery);
  const selectedSortOption = SORT_OPTIONS.find((option) => option.key === selectedSortKey) || SORT_OPTIONS[0];
  const flights = getSortedFlights(buildFlights(fromAirport, toAirport), selectedSortKey);
  const selectedFlight = flights.find((flight) => flight.id === selectedFlightId) || null;
  const fromHelperText = getAirportHelperLabel(fromQuery);
  const toHelperText = getAirportHelperLabel(toQuery);

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
      return;
    }

    if (onNavigateHome) {
      onNavigateHome();
      return;
    }

    onNavigate?.("home");
  };

  const handleSwapAirports = () => {
    const nextFromQuery = toQuery;
    const nextToQuery = fromQuery;
    const nextOrigin = buildAirportFromQuery(nextFromQuery);
    const nextDestination = buildAirportFromQuery(nextToQuery);

    setFromQuery(nextFromQuery);
    setToQuery(nextToQuery);
    setSearchMessage(`Route swapped to ${nextOrigin.code} to ${nextDestination.code}.`);
    setIsTrackingRoute(false);
    setIsSortMenuOpen(false);
  };

  const handleSearch = () => {
    setSearchMessage(
      `Refreshed 3 mock flight options for ${fromAirport.code} to ${toAirport.code} • ${travelerOption.label}.`
    );
    setIsSortMenuOpen(false);
  };

  const handleToggleTracking = () => {
    const nextTrackingState = !isTrackingRoute;
    setIsTrackingRoute(nextTrackingState);
    setSearchMessage(
      nextTrackingState
        ? `Tracking price updates for ${fromAirport.code} to ${toAirport.code}.`
        : `Stopped tracking ${fromAirport.code} to ${toAirport.code}.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          <View style={styles.page}>
            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={handleGoBack}
                style={[styles.backButton, styles.headerBackButton]}
              >
                <Ionicons name="arrow-back" size={28} color={COLORS.text} />
              </DimPressable>

              <View style={styles.brandSlot}>
                <WayfinderBrand
                  containerStyle={styles.headerBrandRow}
                  textStyle={styles.headerBrandText}
                />
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  style={styles.headerActionButton}
                >
                  <Ionicons name="notifications-outline" size={28} color="#111827" />
                  <View style={styles.notificationDot} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                  style={styles.headerActionButton}
                >
                  <Ionicons name="person-circle-outline" size={33} color="#111827" />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroSection}>
              <View style={styles.heroCopyColumn}>
                <Text style={styles.heading}>Flights</Text>
                <Text style={styles.subtitle}>
                  Find the best flights for{" "}
                  <Text style={styles.subtitleAccent}>your next adventure.</Text>
                </Text>
              </View>

              <HeroArtwork />
            </View>

            <View style={[styles.searchCard, searchCardShadowStyle]}>
              <Image
                source={flightsSearchDecorArt}
                resizeMode="contain"
                style={[styles.searchDecorArtwork, isPhone && styles.searchDecorArtworkPhone]}
              />

              <View style={[styles.searchHeaderRow, isPhone && styles.searchHeaderRowPhone]}>
                <View style={[styles.searchIconBadge, isPhone && styles.searchIconBadgePhone]}>
                  <MaterialCommunityIcons
                    name="airplane"
                    size={isPhone ? 22 : 27}
                    color={COLORS.blueDeep}
                  />
                </View>

                <View style={[styles.searchHeaderCopy, isPhone && styles.searchHeaderCopyPhone]}>
                  <View style={styles.searchTitleRow}>
                    <Text style={[styles.searchTitle, isPhone && styles.searchTitlePhone]}>
                      Search Flights
                    </Text>
                    <Ionicons
                      name="sparkles"
                      size={18}
                      color="#FFD86B"
                      style={styles.searchSparkles}
                    />
                  </View>
                  <Text style={[styles.searchSubtitle, isPhone && styles.searchSubtitlePhone]}>
                    Compare prices and book with confidence.
                  </Text>
                </View>
              </View>

              <View style={[styles.airportRow, isNarrow && styles.airportRowStacked]}>
                <AirportInputField
                  label="From"
                  iconName={DEFAULT_ORIGIN.icon}
                  value={fromQuery}
                  helperText={fromHelperText}
                  onChangeText={(value) => setFromQuery(formatAirportInput(value))}
                  placeholder="Enter departure city or airport"
                  isPhone={isPhone}
                  style={styles.airportField}
                />

                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Swap origin and destination"
                  onPress={handleSwapAirports}
                  style={[
                    styles.swapButton,
                    isNarrow ? styles.swapButtonStacked : styles.swapButtonInline,
                  ]}
                >
                  <Ionicons name="swap-horizontal" size={24} color={COLORS.blue} />
                </DimPressable>

                <AirportInputField
                  label="To"
                  iconName="location"
                  value={toQuery}
                  helperText={toHelperText}
                  onChangeText={(value) => setToQuery(formatAirportInput(value))}
                  placeholder="Enter destination city or airport"
                  isPhone={isPhone}
                  style={styles.airportField}
                />
              </View>

              <View style={[styles.metaFieldGrid, isPhone && styles.metaFieldGridPhone]}>
                <SearchField
                  label="Depart"
                  iconName="calendar-outline"
                  primaryText={departDate}
                  onPress={() => setActivePicker("depart")}
                  accessibilityLabel="Select departure date"
                  isPhone={isPhone}
                  style={isPhone ? styles.metaFieldHalf : styles.metaField}
                />

                <SearchField
                  label="Return"
                  iconName="calendar-outline"
                  primaryText={returnDate}
                  onPress={() => setActivePicker("return")}
                  accessibilityLabel="Select return date"
                  isPhone={isPhone}
                  style={isPhone ? styles.metaFieldHalf : styles.metaField}
                />

                <SearchField
                  label="Travelers"
                  iconName="person-outline"
                  primaryText={travelerOption.label}
                  onPress={() => setActivePicker("travelers")}
                  accessibilityLabel="Choose travelers and cabin"
                  isPhone={isPhone}
                  style={styles.travelerField}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search flights"
                onPress={handleSearch}
                style={styles.searchButton}
              >
                <Text style={styles.searchButtonText}>Search Flights</Text>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={styles.searchButtonSparkles} />
              </Pressable>
            </View>

            <View style={[styles.feedbackCard, cardShadowStyle]}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.blue} />
              <Text style={styles.feedbackText}>{searchMessage}</Text>
            </View>

            <View style={styles.benefitsGrid}>
              {BENEFITS.map((item) => (
                <BenefitCard key={item.title} item={item} isPhone={isPhone} />
              ))}
            </View>

            <View style={[styles.resultsHeader, isPhone && styles.resultsHeaderPhone]}>
              <View>
                <Text style={styles.resultsTitle}>Best Flights</Text>
                <Text style={styles.resultsSubtitle}>Top picks for your search</Text>
              </View>

              <View style={[styles.sortDropdownWrap, isPhone && styles.sortDropdownWrapPhone]}>
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Change flight sort"
                  onPress={() => setIsSortMenuOpen((currentValue) => !currentValue)}
                  style={[styles.sortButton, isPhone && styles.sortButtonPhone]}
                >
                  <Ionicons name="funnel-outline" size={17} color={COLORS.blue} />
                  <Text style={styles.sortButtonText}>Sort by: {selectedSortOption.label}</Text>
                  <Ionicons
                    name={isSortMenuOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={COLORS.blue}
                  />
                </DimPressable>

                {isSortMenuOpen ? (
                  <View style={[styles.sortMenu, cardShadowStyle, isPhone && styles.sortMenuPhone]}>
                    {SORT_OPTIONS.map((option, index) => {
                      const isSelected = option.key === selectedSortKey;

                      return (
                        <Pressable
                          key={option.key}
                          accessibilityRole="button"
                          onPress={() => {
                            setSelectedSortKey(option.key);
                            setIsSortMenuOpen(false);
                          }}
                          style={[
                            styles.sortMenuItem,
                            index > 0 && styles.sortMenuItemBorder,
                            isSelected && styles.sortMenuItemSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sortMenuItemText,
                              isSelected && styles.sortMenuItemTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected ? (
                            <Ionicons name="checkmark" size={18} color={COLORS.blue} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            {flights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                isPhone={isPhone}
                isSaved={savedFlightIds.includes(flight.id)}
                onToggleSaved={() =>
                  setSavedFlightIds((currentSavedFlights) =>
                    currentSavedFlights.includes(flight.id)
                      ? currentSavedFlights.filter((savedId) => savedId !== flight.id)
                      : [...currentSavedFlights, flight.id]
                  )
                }
                onViewDetails={() => setSelectedFlightId(flight.id)}
              />
            ))}

            <View
              style={[
                styles.trackerBanner,
                cardShadowStyle,
                isTrackingRoute && styles.trackerBannerActive,
              ]}
            >
              <View style={styles.trackerCopyRow}>
                <Image source={trackerBotArt} resizeMode="contain" style={styles.trackerBotImage} />
                <View style={styles.trackerCopy}>
                  <Text style={styles.trackerTitle}>Not sure when to book?</Text>
                  <Text style={styles.trackerDescription}>
                    Wayfinder analyzes prices daily and will notify you when prices drop.
                  </Text>
                </View>
              </View>

              <DimPressable
                accessibilityRole="button"
                accessibilityLabel={isTrackingRoute ? "Stop tracking this route" : "Track this route"}
                onPress={handleToggleTracking}
                style={[styles.trackButton, isTrackingRoute && styles.trackButtonActive]}
              >
                <Ionicons
                  name={isTrackingRoute ? "checkmark-circle" : "notifications-outline"}
                  size={20}
                  color={isTrackingRoute ? "#FFFFFF" : COLORS.blue}
                />
                <Text style={[styles.trackButtonText, isTrackingRoute && styles.trackButtonTextActive]}>
                  {isTrackingRoute ? "Tracking Route" : "Track This Route"}
                </Text>
              </DimPressable>
            </View>
          </View>
        </ScrollView>

        <BottomNav activeLabel="Flights" onNavigate={onNavigate} />
      </View>

      <SheetModal
        visible={activePicker === "depart"}
        title="Departure Date"
        subtitle="Choose a mock departure date for this placeholder flow."
        onClose={() => setActivePicker(null)}
      >
        {DEPARTURE_OPTIONS.map((option) => {
          const isSelected = option === departDate;

          return (
            <DimPressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                setDepartDate(option);
                setActivePicker(null);
              }}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            >
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {option}
              </Text>
              {isSelected ? <Ionicons name="checkmark" size={20} color={COLORS.blue} /> : null}
            </DimPressable>
          );
        })}
      </SheetModal>

      <SheetModal
        visible={activePicker === "return"}
        title="Return Date"
        subtitle="Choose a mock return date for the round-trip search card."
        onClose={() => setActivePicker(null)}
      >
        {RETURN_OPTIONS.map((option) => {
          const isSelected = option === returnDate;

          return (
            <DimPressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                setReturnDate(option);
                setActivePicker(null);
              }}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            >
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {option}
              </Text>
              {isSelected ? <Ionicons name="checkmark" size={20} color={COLORS.blue} /> : null}
            </DimPressable>
          );
        })}
      </SheetModal>

      <SheetModal
        visible={activePicker === "travelers"}
        title="Travelers"
        subtitle="Swap between a few local cabin presets."
        onClose={() => setActivePicker(null)}
      >
        {TRAVELER_OPTIONS.map((option) => {
          const isSelected = option.id === travelerOption.id;

          return (
            <DimPressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => {
                setTravelerOption(option);
                setActivePicker(null);
              }}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            >
              <View style={styles.optionCopy}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {isSelected ? <Ionicons name="checkmark" size={20} color={COLORS.blue} /> : null}
            </DimPressable>
          );
        })}
      </SheetModal>

      <SheetModal
        visible={Boolean(selectedFlight)}
        title={selectedFlight ? `${selectedFlight.airline} details` : "Flight details"}
        subtitle={selectedFlight ? selectedFlight.routeLabel : ""}
        onClose={() => setSelectedFlightId(null)}
      >
        {selectedFlight ? (
          <View style={styles.detailContent}>
            <View style={styles.detailSummaryCard}>
              <Text style={styles.detailSummaryTitle}>
                {selectedFlight.departureTime} to {selectedFlight.arrivalTime}
              </Text>
              <Text style={styles.detailSummaryCopy}>{selectedFlight.details}</Text>
            </View>

            <View style={styles.detailChipRow}>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>{selectedFlight.duration}</Text>
              </View>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>{selectedFlight.stopInfo}</Text>
              </View>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>${selectedFlight.price} round trip</Text>
              </View>
            </View>

            <Text style={styles.detailSummaryCopy}>{selectedFlight.summary}</Text>
          </View>
        ) : null}
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingTop: 18,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  page: {
    width: "100%",
    maxWidth: 1040,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBackButton: {
    flexShrink: 0,
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

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.orange,
  },

  heroSection: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  heroSectionPhone: {
    alignItems: "flex-end",
  },

  heroCopyColumn: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 230,
    maxWidth: 410,
    paddingTop: 8,
    paddingRight: 14,
  },

  heroCopyColumnPhone: {
    maxWidth: 410,
    paddingTop: 8,
    paddingRight: 14,
  },

  backButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  backButtonPhone: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },

  heading: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "800",
    letterSpacing: -2,
    color: COLORS.text,
  },

  headingPhone: {
    fontSize: 52,
    lineHeight: 56,
  },

  subtitle: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 30,
    color: COLORS.subtext,
  },

  subtitlePhone: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 30,
  },

  subtitleAccent: {
    color: COLORS.blue,
    fontWeight: "700",
  },

  heroArtworkShell: {
    flexGrow: 1,
    minWidth: 220,
    maxWidth: 430,
    height: 212,
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },

  heroArtworkShellPhone: {
    minWidth: 220,
    maxWidth: 430,
    height: 212,
  },

  heroArtworkFrame: {
    width: "100%",
    height: "100%",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  heroCloudLarge: {
    position: "absolute",
    top: 16,
    right: 62,
    width: 62,
    height: 22,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },

  heroCloudSmall: {
    position: "absolute",
    top: 30,
    left: 18,
    width: 38,
    height: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.62)",
  },

  heroPinWrap: {
    position: "absolute",
    top: 16,
    right: 12,
    zIndex: 3,
  },

  heroPlaneWrap: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 104,
    height: 62,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 120, 255, 0.9)",
    transform: [{ rotate: "-18deg" }],
    zIndex: 3,
  },

  heroPlaneWrapPhone: {
    width: 82,
    height: 48,
    left: 8,
    bottom: 8,
  },

  heroPlaneIcon: {
    transform: [{ rotate: "16deg" }],
  },

  searchCard: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderRadius: 28,
    backgroundColor: COLORS.blue,
    overflow: "hidden",
  },

  searchDecorArtwork: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 286,
    aspectRatio: SEARCH_DECOR_ART_ASPECT_RATIO,
  },

  searchDecorArtworkPhone: {
    width: 212,
  },

  searchDecorLarge: {
    position: "absolute",
    top: -28,
    right: -30,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  searchDecorSmall: {
    position: "absolute",
    right: 22,
    top: 56,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },

  searchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  searchHeaderRowPhone: {
    alignItems: "flex-start",
  },

  searchIconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },

  searchIconBadgePhone: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },

  searchHeaderCopy: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 18,
  },

  searchHeaderCopyPhone: {
    paddingRight: 8,
  },

  searchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  searchTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },

  searchTitlePhone: {
    fontSize: 20,
  },

  searchSparkles: {
    marginLeft: 6,
  },

  searchSubtitle: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 21,
    color: "rgba(255, 255, 255, 0.92)",
  },

  searchSubtitlePhone: {
    fontSize: 14,
    lineHeight: 19,
  },

  airportRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  airportRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  airportField: {
    flex: 1,
  },

  swapButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: "#D9E8FF",
    zIndex: 2,
  },

  swapButtonInline: {
    marginHorizontal: 10,
  },

  swapButtonStacked: {
    alignSelf: "center",
    marginVertical: -4,
  },

  metaFieldGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  metaFieldGridPhone: {
    marginTop: 12,
  },

  metaField: {
    width: "31.5%",
  },

  metaFieldHalf: {
    width: "48.3%",
    marginBottom: 12,
  },

  travelerField: {
    width: "100%",
  },

  fieldCard: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: "center",
  },

  fieldCardPhone: {
    minHeight: 70,
  },

  airportInputCard: {
    minHeight: 82,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },

  fieldValueRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  fieldIconWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  fieldTextWrap: {
    flex: 1,
    marginLeft: 8,
  },

  fieldPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 22,
  },

  fieldPrimaryTextPhone: {
    fontSize: 15,
    lineHeight: 20,
  },

  airportInput: {
    paddingVertical: 0,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  airportInputPhone: {
    fontSize: 15,
  },

  fieldSecondaryText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.subtext,
  },

  searchButton: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  searchButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  searchButtonSparkles: {
    marginLeft: 8,
  },

  feedbackCard: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
  },

  feedbackText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.subtext,
  },

  benefitsGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  benefitCard: {
    width: "48.7%",
    minHeight: 88,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  benefitCardPhone: {
    width: "48.4%",
    minHeight: 98,
  },

  benefitCardContentCentered: {
    alignItems: "center",
  },

  benefitIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitCopy: {
    flex: 1,
    marginLeft: 10,
  },

  benefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  benefitDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.subtext,
  },

  resultsHeader: {
    marginTop: 18,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    zIndex: 6,
  },

  resultsHeaderPhone: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  resultsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.8,
  },

  resultsSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.subtext,
  },

  sortDropdownWrap: {
    minWidth: 210,
    alignItems: "flex-end",
    position: "relative",
    zIndex: 8,
  },

  sortDropdownWrapPhone: {
    width: "100%",
    minWidth: 0,
    marginTop: 10,
    alignItems: "stretch",
  },

  sortButton: {
    minHeight: 42,
    marginLeft: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
  },

  sortButtonPhone: {
    marginLeft: 0,
    justifyContent: "center",
  },

  sortButtonText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.blue,
  },

  sortMenu: {
    position: "absolute",
    top: 48,
    right: 0,
    width: 210,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    zIndex: 12,
  },

  sortMenuPhone: {
    top: 48,
    left: 0,
    right: 0,
    width: "100%",
  },

  sortMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sortMenuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#E6EEF9",
  },

  sortMenuItemSelected: {
    backgroundColor: "#F5F8FF",
  },

  sortMenuItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  sortMenuItemTextSelected: {
    color: COLORS.blue,
  },

  flightCard: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 22,
    backgroundColor: COLORS.card,
  },

  flightCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  flightBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  flightBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },

  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  flightCardMainRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },

  flightCardMainRowPhone: {
    flexDirection: "column",
  },

  flightInfoColumn: {
    flex: 1,
    paddingRight: 14,
  },

  flightInfoColumnPhone: {
    paddingRight: 0,
  },

  airlineWrap: {
    marginBottom: 12,
  },

  anaLogoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  anaLogoText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1756D9",
    letterSpacing: -1,
    fontStyle: "italic",
  },

  anaLogoTextPhone: {
    fontSize: 22,
  },

  anaLogoWing: {
    width: 24,
    height: 9,
    marginLeft: 6,
    backgroundColor: "#1756D9",
    transform: [{ skewX: "-28deg" }],
  },

  airlineBrandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  airlineWordmark: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  airlineWordmarkPhone: {
    fontSize: 16,
  },

  airlineSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.subtext,
  },

  koreanBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  koreanBadgeTop: {
    flex: 1,
    backgroundColor: "#F14D58",
  },

  koreanBadgeBottom: {
    flex: 1,
    backgroundColor: "#2757E7",
  },

  jalBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E33935",
  },

  jalBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  routeSummaryWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  routeSummaryWrapPhone: {
    alignItems: "flex-start",
  },

  routeEndpoint: {
    minWidth: 66,
  },

  routeEndpointRight: {
    alignItems: "flex-end",
  },

  routeMiddle: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  routeMiddlePhone: {
    paddingHorizontal: 8,
  },

  routeTimeText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#0A0F16",
  },

  routeTimeTextPhone: {
    fontSize: 18,
  },

  routeCodeText: {
    marginTop: 4,
    fontSize: 15,
    color: "#314360",
  },

  routeDurationText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#314360",
  },

  routeLineRow: {
    width: "100%",
    marginTop: 8,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  routeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 2,
    borderColor: "#7E90B0",
    backgroundColor: "#FFFFFF",
  },

  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#AFC1DD",
  },

  routeStopText: {
    fontSize: 13,
    fontWeight: "700",
  },

  routeOffsetText: {
    color: "#FF3434",
    fontSize: 16,
  },

  flightPriceColumn: {
    width: 132,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  flightPriceColumnPhone: {
    width: "100%",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E6EEF9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  flightPriceValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    color: COLORS.blue,
  },

  flightPriceValuePhone: {
    fontSize: 24,
  },

  flightPriceCaption: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.subtext,
  },

  detailsButton: {
    minWidth: 118,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#C7DBFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  detailsButtonPhone: {
    marginTop: 0,
    minWidth: 118,
  },

  detailsButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.blue,
  },

  trackerBanner: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: "#E9F2FF",
    borderWidth: 1,
    borderColor: "#C8DBFF",
  },

  trackerBannerActive: {
    backgroundColor: "#DBE9FF",
    borderColor: "#9FC1FF",
  },

  trackerCopyRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  trackerBotImage: {
    width: 54,
    height: 54,
  },

  trackerCopy: {
    flex: 1,
    marginLeft: 10,
  },

  trackerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  trackerDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.subtext,
  },

  trackButton: {
    minHeight: 46,
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#BFD4FF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  trackButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  trackButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.blue,
  },

  trackButtonTextActive: {
    color: "#FFFFFF",
  },

  modalBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 15, 22, 0.34)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 430,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  modalCopy: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  modalSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.subtext,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FC",
  },

  optionRow: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionRowSelected: {
    borderColor: "#A9C7FF",
    backgroundColor: "#F4F8FF",
  },

  optionCopy: {
    flex: 1,
    paddingRight: 12,
  },

  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  optionLabelSelected: {
    color: COLORS.blue,
  },

  optionDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.subtext,
  },

  detailContent: {
    marginTop: 16,
  },

  detailSummaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailSummaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  detailSummaryCopy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.subtext,
  },

  detailChipRow: {
    marginTop: 14,
    marginBottom: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  detailChip: {
    marginRight: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
  },

  detailChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.blue,
  },
});
