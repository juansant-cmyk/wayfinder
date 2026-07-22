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

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
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
const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function isSameDay(left, right) {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBeforeDay(left, right) {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
}

function formatDisplayDate(date) {
  if (!date) {
    return "Select date";
  }

  return `${SHORT_MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function createDefaultDepartDate() {
  return addDays(new Date(), 1);
}

function createDefaultReturnDate(departDate) {
  return addDays(departDate || createDefaultDepartDate(), 7);
}

function getMonthMatrix(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const cells = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
}

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

function HeroArtwork({ width: artworkWidth, aspectRatio }) {
  return (
    <View
      style={[
        styles.heroArtworkShell,
        {
          width: artworkWidth,
          maxWidth: artworkWidth,
          aspectRatio,
        },
      ]}
    >
      <Image
        source={flightsHeroArt}
        resizeMode="contain"
        style={styles.heroArtworkImage}
      />
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
          {renderIcon(iconFamily, iconName, COLORS.blue, isPhone ? 12 : 13)}
        </View>
        <View style={styles.fieldTextWrap}>
          <Text style={[styles.fieldPrimaryText, isPhone && styles.fieldPrimaryTextPhone]} numberOfLines={1}>
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
          {renderIcon(iconFamily, iconName, COLORS.blue, isPhone ? 12 : 13)}
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
          {helperText ? (
            <Text style={styles.fieldSecondaryText} numberOfLines={1}>
              {helperText}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function BenefitCard({ item, isPhone, showFourAcross }) {
  return (
    <View
      style={[
        styles.benefitCard,
        isPhone && styles.benefitCardPhone,
        showFourAcross && styles.benefitCardFourAcross,
        cardShadowStyle,
      ]}
    >
      <View
        style={[
          styles.benefitIconWrap,
          showFourAcross && styles.benefitIconWrapCompact,
          { backgroundColor: item.iconBackground },
        ]}
      >
        {renderIcon(
          item.iconFamily,
          item.icon,
          item.iconColor,
          showFourAcross ? 14 : isPhone ? 15 : 16
        )}
      </View>
      <View style={styles.benefitCopy}>
        <Text
          style={[styles.benefitTitle, showFourAcross && styles.benefitTitleCompact]}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.benefitDescription, showFourAcross && styles.benefitDescriptionCompact]}
        >
          {item.description}
        </Text>
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
        <Text style={styles.airlineSubtitle} numberOfLines={1}>
          {flight.airline}
        </Text>
      </View>
    );
  }

  if (flight.id === "korean-air") {
    return (
      <View style={styles.airlineWrap}>
        <View style={styles.airlineBrandRow}>
          <View style={[styles.koreanBadge, isPhone && styles.koreanBadgePhone]}>
            <View style={styles.koreanBadgeTop} />
            <View style={styles.koreanBadgeBottom} />
          </View>
          <Text
            style={[styles.airlineWordmark, isPhone && styles.airlineWordmarkPhone]}
            numberOfLines={1}
          >
            {flight.displayName}
          </Text>
        </View>
        <Text style={styles.airlineSubtitle} numberOfLines={1}>
          {flight.airline}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.airlineWrap}>
      <View style={styles.airlineBrandRow}>
        <View style={[styles.jalBadge, isPhone && styles.jalBadgePhone]}>
          <Text style={styles.jalBadgeText}>JAL</Text>
        </View>
        <Text
          style={[styles.airlineWordmark, isPhone && styles.airlineWordmarkPhone]}
          numberOfLines={1}
        >
          {flight.displayName}
        </Text>
      </View>
      <Text style={styles.airlineSubtitle} numberOfLines={1}>
        {flight.airline}
      </Text>
    </View>
  );
}

function RouteSummary({ flight, isPhone }) {
  return (
    <View style={styles.routeSummaryWrap}>
      <View style={[styles.routeEndpoint, isPhone && styles.routeEndpointPhone]}>
        <Text
          style={[styles.routeTimeText, isPhone && styles.routeTimeTextPhone]}
          numberOfLines={1}
        >
          {flight.departureTime}
        </Text>
        <Text style={[styles.routeCodeText, isPhone && styles.routeCodeTextPhone]}>
          {flight.originCode}
        </Text>
      </View>

      <View style={[styles.routeMiddle, isPhone && styles.routeMiddlePhone]}>
        <Text style={[styles.routeDurationText, isPhone && styles.routeDurationTextPhone]}>
          {flight.duration}
        </Text>
        <View style={styles.routeLineRow}>
          <View style={styles.routeDot} />
          <View style={styles.routeLine} />
          <View style={styles.routeDot} />
        </View>
        <Text
          style={[
            styles.routeStopText,
            isPhone && styles.routeStopTextPhone,
            { color: flight.stopColor },
          ]}
          numberOfLines={1}
        >
          {flight.stopInfo}
        </Text>
      </View>

      <View
        style={[
          styles.routeEndpoint,
          styles.routeEndpointRight,
          isPhone && styles.routeEndpointPhone,
        ]}
      >
        <Text
          style={[styles.routeTimeText, isPhone && styles.routeTimeTextPhone]}
          numberOfLines={1}
        >
          {flight.arrivalTime}{" "}
          <Text style={[styles.routeOffsetText, isPhone && styles.routeOffsetTextPhone]}>
            {flight.arrivalOffset}
          </Text>
        </Text>
        <Text style={[styles.routeCodeText, isPhone && styles.routeCodeTextPhone]}>
          {flight.destinationCode}
        </Text>
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
            size={isPhone ? 15 : 16}
            color={isSaved ? "#FF5A4E" : COLORS.text}
          />
        </DimPressable>
      </View>

      <View style={styles.flightCardMainRow}>
        <View style={[styles.flightAirlineColumn, isPhone && styles.flightAirlineColumnPhone]}>
          <AirlineMark flight={flight} isPhone={isPhone} />
        </View>

        <View style={styles.flightRouteColumn}>
          <RouteSummary flight={flight} isPhone={isPhone} />
        </View>

        <View style={[styles.flightPriceColumn, isPhone && styles.flightPriceColumnPhone]}>
          <View style={styles.flightPriceBlock}>
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
            <Text style={[styles.detailsButtonText, isPhone && styles.detailsButtonTextPhone]}>
              View Details
            </Text>
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

function DatePickerModal({
  visible,
  mode,
  value,
  minimumDate,
  onCancel,
  onConfirm,
}) {
  const today = startOfDay(new Date());
  const effectiveMinimum = startOfDay(minimumDate || today);
  const initialValue =
    value && !isBeforeDay(value, effectiveMinimum) ? startOfDay(value) : effectiveMinimum;

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialValue.getFullYear(), initialValue.getMonth(), 1)
  );
  const [draftDate, setDraftDate] = useState(initialValue);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const todayStart = startOfDay(new Date());
    const minDate = startOfDay(minimumDate || todayStart);
    const nextValue =
      value && !isBeforeDay(value, minDate) ? startOfDay(value) : minDate;
    setDraftDate(nextValue);
    setVisibleMonth(new Date(nextValue.getFullYear(), nextValue.getMonth(), 1));
  }, [visible, value, mode, minimumDate]);

  const monthRows = getMonthMatrix(visibleMonth);
  const fieldLabel = mode === "return" ? "Return" : "Depart";
  const canGoPreviousMonth =
    visibleMonth.getFullYear() > effectiveMinimum.getFullYear() ||
    (visibleMonth.getFullYear() === effectiveMinimum.getFullYear() &&
      visibleMonth.getMonth() > effectiveMinimum.getMonth());

  const handleConfirm = () => {
    if (!draftDate || isBeforeDay(draftDate, effectiveMinimum)) {
      return;
    }

    onConfirm(startOfDay(draftDate));
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.datePickerCard, cardShadowStyle]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalCopy}>
              <Text style={styles.modalTitle}>Select {fieldLabel} Date</Text>
              <Text style={styles.modalSubtitle}>
                Choosing a {fieldLabel.toLowerCase()} date for your trip.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
              onPress={onCancel}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.datePickerFieldChip}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.blue} />
            <Text style={styles.datePickerFieldChipText}>{fieldLabel}</Text>
          </View>

          <View style={styles.datePickerMonthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              disabled={!canGoPreviousMonth}
              onPress={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                )
              }
              style={[
                styles.datePickerNavButton,
                !canGoPreviousMonth && styles.datePickerNavButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={canGoPreviousMonth ? COLORS.text : COLORS.muted}
              />
            </Pressable>

            <Text style={styles.datePickerMonthLabel}>
              {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                )
              }
              style={styles.datePickerNavButton}
            >
              <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.datePickerWeekRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.datePickerWeekday}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.datePickerGrid}>
            {monthRows.map((row, rowIndex) => (
              <View key={`week-${rowIndex}`} style={styles.datePickerWeek}>
                {row.map((day, dayIndex) => {
                  if (!day) {
                    return <View key={`empty-${rowIndex}-${dayIndex}`} style={styles.datePickerDay} />;
                  }

                  const disabled = isBeforeDay(day, effectiveMinimum);
                  const selected = isSameDay(day, draftDate);
                  const isToday = isSameDay(day, today);

                  return (
                    <Pressable
                      key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled, selected }}
                      disabled={disabled}
                      onPress={() => setDraftDate(startOfDay(day))}
                      style={[
                        styles.datePickerDay,
                        isToday && !selected && styles.datePickerDayToday,
                        selected && styles.datePickerDaySelected,
                        disabled && styles.datePickerDayDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.datePickerDayText,
                          selected && styles.datePickerDayTextSelected,
                          disabled && styles.datePickerDayTextDisabled,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <Text style={styles.datePickerSelectedLabel}>
            Selected: {formatDisplayDate(draftDate)}
          </Text>

          <View style={styles.datePickerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel date selection"
              onPress={onCancel}
              style={styles.datePickerCancelButton}
            >
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Confirm ${fieldLabel.toLowerCase()} date`}
              onPress={handleConfirm}
              style={styles.datePickerConfirmButton}
            >
              <Text style={styles.datePickerConfirmText}>Done</Text>
            </Pressable>
          </View>
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
  const isCompactPhone = width < 400;
  const isNarrow = width < 360;
  const showFourBenefits = width >= 700;
  const keepResultsHeaderInline = width >= 340;
  const keepTrackerInline = width >= 360;
  const pageMaxWidth = width >= 1100 ? 780 : width >= 900 ? 720 : 680;
  const pagePaddingHorizontal = isCompactPhone ? 10 : isPhone ? 12 : 14;

  // Flights hero art is 444×172 — size near natural resolution (avoid soft upscaling).
  const heroAspectRatio = 444 / 172;
  const heroArtworkWidth = isCompactPhone
    ? Math.min(Math.round(width * 0.4), 132)
    : isPhone
      ? Math.min(Math.round(width * 0.38), 150)
      : width < 900
        ? Math.min(Math.round(width * 0.28), 200)
        : Math.min(Math.round(width * 0.24), 230);
  const heroTitleSize = isCompactPhone ? 24 : isPhone ? 28 : width < 900 ? 32 : 34;
  const heroSubtitleSize = isCompactPhone ? 11 : isPhone ? 12 : 13;
  const backButtonSize = isCompactPhone ? 34 : isPhone ? 38 : 40;
  const headerIconSize = isPhone ? 20 : 22;
  const profileIconSize = isPhone ? 26 : 28;
  const trackerBotSize = isPhone ? 30 : 34;
  const defaultDestinationPreset = getDefaultDestinationPreset(params.destination);

  const [fromQuery, setFromQuery] = useState(DEFAULT_ORIGIN.code);
  const [toQuery, setToQuery] = useState(() => defaultDestinationPreset.code);
  const [departDate, setDepartDate] = useState(() => createDefaultDepartDate());
  const [returnDate, setReturnDate] = useState(() =>
    createDefaultReturnDate(createDefaultDepartDate())
  );
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
      `Refreshed 3 mock flight options for ${fromAirport.code} to ${toAirport.code} • ${formatDisplayDate(departDate)} – ${formatDisplayDate(returnDate)} • ${travelerOption.label}.`
    );
    setIsSortMenuOpen(false);
  };

  const handleConfirmDepartDate = (nextDepartDate) => {
    setDepartDate(nextDepartDate);
    setReturnDate((currentReturnDate) =>
      !currentReturnDate || isBeforeDay(currentReturnDate, nextDepartDate)
        ? nextDepartDate
        : currentReturnDate
    );
    setActivePicker(null);
  };

  const handleConfirmReturnDate = (nextReturnDate) => {
    setReturnDate(nextReturnDate);
    setActivePicker(null);
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
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          <View style={[styles.page, { maxWidth: pageMaxWidth }]}>
            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={handleGoBack}
                style={[
                  styles.backButton,
                  styles.headerBackButton,
                  {
                    width: backButtonSize,
                    height: backButtonSize,
                    borderRadius: backButtonSize / 2,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={isPhone ? 18 : 20} color={COLORS.text} />
              </DimPressable>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  style={[styles.headerActionButton, isPhone && styles.headerActionButtonPhone]}
                >
                  <Ionicons name="notifications-outline" size={headerIconSize} color="#111827" />
                  <View style={[styles.notificationDot, isPhone && styles.notificationDotPhone]} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                  style={[styles.headerActionButton, isPhone && styles.headerActionButtonPhone]}
                >
                  <Ionicons name="person-circle-outline" size={profileIconSize} color="#111827" />
                </Pressable>
              </View>
            </View>

            <View style={[styles.heroSection, isPhone && styles.heroSectionPhone]}>
              <View style={[styles.heroCopyColumn, isPhone && styles.heroCopyColumnPhone]}>
                <Text
                  style={[
                    styles.heading,
                    {
                      fontSize: heroTitleSize,
                      lineHeight: heroTitleSize + 4,
                    },
                  ]}
                  numberOfLines={1}
                >
                  Flights
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    {
                      fontSize: heroSubtitleSize,
                      lineHeight: heroSubtitleSize + 8,
                      marginTop: isPhone ? 2 : 4,
                    },
                  ]}
                >
                  Find the best flights for{" "}
                  <Text style={styles.subtitleAccent}>your next adventure.</Text>
                </Text>
              </View>

              <HeroArtwork width={heroArtworkWidth} aspectRatio={heroAspectRatio} />
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
                    size={isPhone ? 14 : 15}
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
                      size={isPhone ? 10 : 11}
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
                  <Ionicons name="swap-horizontal" size={isPhone ? 14 : 15} color={COLORS.blue} />
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
                  primaryText={formatDisplayDate(departDate)}
                  onPress={() => setActivePicker("depart")}
                  accessibilityLabel="Select departure date"
                  isPhone={isPhone}
                  style={isNarrow ? styles.metaFieldHalf : styles.metaField}
                />

                <SearchField
                  label="Return"
                  iconName="calendar-outline"
                  primaryText={formatDisplayDate(returnDate)}
                  onPress={() => setActivePicker("return")}
                  accessibilityLabel="Select return date"
                  isPhone={isPhone}
                  style={isNarrow ? styles.metaFieldHalf : styles.metaField}
                />

                <SearchField
                  label="Travelers"
                  iconName="person-outline"
                  primaryText={travelerOption.label}
                  onPress={() => setActivePicker("travelers")}
                  accessibilityLabel="Choose travelers and cabin"
                  isPhone={isPhone}
                  style={isNarrow ? styles.travelerField : styles.metaField}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search flights"
                onPress={handleSearch}
                style={[styles.searchButton, isPhone && styles.searchButtonPhone]}
              >
                <Text style={[styles.searchButtonText, isPhone && styles.searchButtonTextPhone]}>
                  Search Flights
                </Text>
                <Ionicons
                  name="sparkles"
                  size={isPhone ? 10 : 11}
                  color="#FFFFFF"
                  style={styles.searchButtonSparkles}
                />
              </Pressable>
            </View>

            <View style={[styles.feedbackCard, cardShadowStyle]}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.blue} />
              <Text style={styles.feedbackText}>{searchMessage}</Text>
            </View>

            <View style={[styles.benefitsGrid, showFourBenefits && styles.benefitsGridFourAcross]}>
              {BENEFITS.map((item) => (
                <BenefitCard
                  key={item.title}
                  item={item}
                  isPhone={isPhone}
                  showFourAcross={showFourBenefits}
                />
              ))}
            </View>

            <View
              style={[
                styles.resultsHeader,
                !keepResultsHeaderInline && styles.resultsHeaderPhone,
              ]}
            >
              <View style={styles.resultsCopy}>
                <Text style={styles.resultsTitle}>Best Flights</Text>
                <Text style={styles.resultsSubtitle}>Top picks for your search</Text>
              </View>

              <View
                style={[
                  styles.sortDropdownWrap,
                  !keepResultsHeaderInline && styles.sortDropdownWrapPhone,
                ]}
              >
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Change flight sort"
                  onPress={() => setIsSortMenuOpen((currentValue) => !currentValue)}
                  style={[
                    styles.sortButton,
                    !keepResultsHeaderInline && styles.sortButtonPhone,
                  ]}
                >
                  <Ionicons name="funnel-outline" size={12} color={COLORS.blue} />
                  <Text style={styles.sortButtonText} numberOfLines={1}>
                    Sort by: {selectedSortOption.label}
                  </Text>
                  <Ionicons
                    name={isSortMenuOpen ? "chevron-up" : "chevron-down"}
                    size={12}
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
                keepTrackerInline && styles.trackerBannerWide,
              ]}
            >
              <View
                style={[styles.trackerCopyRow, keepTrackerInline && styles.trackerCopyRowWide]}
              >
                <Image
                  source={trackerBotArt}
                  resizeMode="contain"
                  style={[
                    styles.trackerBotImage,
                    { width: trackerBotSize, height: trackerBotSize },
                  ]}
                />
                <View style={styles.trackerCopy}>
                  <Text style={[styles.trackerTitle, isPhone && styles.trackerTitlePhone]}>
                    Not sure when to book?
                  </Text>
                  <Text
                    style={[styles.trackerDescription, isPhone && styles.trackerDescriptionPhone]}
                  >
                    Wayfinder analyzes prices daily and will notify you when prices drop.
                  </Text>
                </View>
              </View>

              <DimPressable
                accessibilityRole="button"
                accessibilityLabel={isTrackingRoute ? "Stop tracking this route" : "Track this route"}
                onPress={handleToggleTracking}
                style={[
                  styles.trackButton,
                  isTrackingRoute && styles.trackButtonActive,
                  keepTrackerInline && styles.trackButtonWide,
                  !keepTrackerInline && styles.trackButtonPhone,
                ]}
              >
                <Ionicons
                  name={isTrackingRoute ? "checkmark-circle" : "notifications-outline"}
                  size={14}
                  color={isTrackingRoute ? "#FFFFFF" : COLORS.blue}
                />
                <Text
                  style={[styles.trackButtonText, isTrackingRoute && styles.trackButtonTextActive]}
                  numberOfLines={1}
                >
                  {isTrackingRoute ? "Tracking Route" : "Track This Route"}
                </Text>
              </DimPressable>
            </View>
          </View>
        </ScrollView>

        <BottomNav activeLabel="Flights" onNavigate={onNavigate} />
      </View>

      <DatePickerModal
        visible={activePicker === "depart"}
        mode="depart"
        value={departDate}
        minimumDate={startOfDay(new Date())}
        onCancel={() => setActivePicker(null)}
        onConfirm={handleConfirmDepartDate}
      />

      <DatePickerModal
        visible={activePicker === "return"}
        mode="return"
        value={returnDate}
        minimumDate={departDate || startOfDay(new Date())}
        onCancel={() => setActivePicker(null)}
        onConfirm={handleConfirmReturnDate}
      />

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
    paddingTop: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },

  page: {
    width: "100%",
    maxWidth: 780,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBackButton: {
    flexShrink: 0,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  headerActionButton: {
    width: 34,
    height: 34,
    marginLeft: 0,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionButtonPhone: {
    width: 32,
    height: 32,
    marginLeft: 0,
  },

  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
  },

  notificationDotPhone: {
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  heroSection: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
    overflow: "visible",
  },

  heroSectionPhone: {
    marginTop: 4,
    gap: 2,
    alignItems: "flex-end",
  },

  heroCopyColumn: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 340,
    paddingTop: 0,
    paddingRight: 4,
    paddingBottom: 0,
    zIndex: 2,
  },

  heroCopyColumnPhone: {
    maxWidth: "58%",
    paddingTop: 0,
    paddingRight: 2,
    paddingBottom: 0,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  heading: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -1.4,
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.subtext,
  },

  subtitleAccent: {
    color: COLORS.blue,
    fontWeight: "700",
  },

  heroArtworkShell: {
    flexShrink: 0,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    position: "relative",
    overflow: "visible",
    zIndex: 1,
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
    marginTop: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    overflow: "hidden",
  },

  searchDecorArtwork: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 160,
    aspectRatio: SEARCH_DECOR_ART_ASPECT_RATIO,
  },

  searchDecorArtworkPhone: {
    width: 120,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },

  searchIconBadgePhone: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  searchHeaderCopy: {
    flex: 1,
    marginLeft: 6,
    paddingRight: 8,
    minWidth: 0,
  },

  searchHeaderCopyPhone: {
    paddingRight: 2,
  },

  searchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  searchTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  searchTitlePhone: {
    fontSize: 13,
  },

  searchSparkles: {
    marginLeft: 3,
  },

  searchSubtitle: {
    marginTop: 0,
    fontSize: 10,
    lineHeight: 13,
    color: "rgba(255, 255, 255, 0.92)",
  },

  searchSubtitlePhone: {
    fontSize: 9,
    lineHeight: 12,
  },

  airportRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 0,
  },

  airportRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  airportField: {
    flex: 1,
    minWidth: 0,
  },

  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: "#D9E8FF",
    zIndex: 2,
    flexShrink: 0,
  },

  swapButtonInline: {
    marginHorizontal: 4,
  },

  swapButtonStacked: {
    alignSelf: "center",
    marginVertical: -1,
  },

  metaFieldGrid: {
    marginTop: 5,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },

  metaFieldGridPhone: {
    marginTop: 5,
  },

  metaField: {
    width: "31.5%",
    minWidth: 0,
  },

  metaFieldHalf: {
    width: "48.5%",
    marginBottom: 5,
    minWidth: 0,
  },

  travelerField: {
    width: "100%",
    minWidth: 0,
  },

  fieldCard: {
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    justifyContent: "center",
  },

  fieldCardPhone: {
    minHeight: 40,
  },

  airportInputCard: {
    minHeight: 44,
  },

  fieldLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.muted,
  },

  fieldValueRow: {
    marginTop: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  fieldIconWrap: {
    width: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  fieldTextWrap: {
    flex: 1,
    marginLeft: 4,
    minWidth: 0,
  },

  fieldPrimaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 14,
  },

  fieldPrimaryTextPhone: {
    fontSize: 10,
    lineHeight: 13,
  },

  airportInput: {
    paddingVertical: 0,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 14,
  },

  airportInputPhone: {
    fontSize: 10,
  },

  fieldSecondaryText: {
    marginTop: 0,
    fontSize: 9,
    lineHeight: 11,
    color: COLORS.subtext,
  },

  searchButton: {
    marginTop: 6,
    minHeight: 30,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  searchButtonPhone: {
    minHeight: 28,
    paddingVertical: 5,
  },

  searchButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  searchButtonTextPhone: {
    fontSize: 11,
  },

  searchButtonSparkles: {
    marginLeft: 4,
  },

  feedbackCard: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
  },

  feedbackText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.subtext,
  },

  benefitsGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
  },

  benefitsGridFourAcross: {
    flexWrap: "nowrap",
    gap: 6,
  },

  benefitCard: {
    width: "48.7%",
    minHeight: 58,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
  },

  benefitCardPhone: {
    width: "48.5%",
    minHeight: 60,
  },

  benefitCardFourAcross: {
    width: "24%",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 56,
    marginBottom: 0,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },

  benefitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  benefitIconWrapCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  benefitCopy: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0,
    justifyContent: "center",
  },

  benefitTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 13,
  },

  benefitTitleCompact: {
    fontSize: 10,
    lineHeight: 12,
  },

  benefitDescription: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 12,
    color: COLORS.subtext,
    flexShrink: 1,
  },

  benefitDescriptionCompact: {
    fontSize: 8,
    lineHeight: 11,
  },

  resultsHeader: {
    marginTop: 10,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    zIndex: 6,
  },

  resultsHeaderPhone: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  resultsCopy: {
    flexShrink: 1,
    minWidth: 0,
  },

  resultsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.4,
  },

  resultsSubtitle: {
    marginTop: 0,
    fontSize: 11,
    color: COLORS.subtext,
  },

  sortDropdownWrap: {
    minWidth: 0,
    maxWidth: "52%",
    alignItems: "flex-end",
    position: "relative",
    zIndex: 8,
    flexShrink: 1,
  },

  sortDropdownWrapPhone: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    marginTop: 5,
    alignItems: "stretch",
  },

  sortButton: {
    minHeight: 28,
    marginLeft: 6,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
  },

  sortButtonPhone: {
    marginLeft: 0,
    justifyContent: "center",
  },

  sortButtonText: {
    marginHorizontal: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.blue,
    flexShrink: 1,
  },

  sortMenu: {
    position: "absolute",
    top: 32,
    right: 0,
    width: 160,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    zIndex: 12,
  },

  sortMenuPhone: {
    top: 32,
    left: 0,
    right: 0,
    width: "100%",
  },

  sortMenuItem: {
    paddingHorizontal: 8,
    paddingVertical: 7,
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
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },

  sortMenuItemTextSelected: {
    color: COLORS.blue,
  },

  flightCard: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },

  flightCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  flightBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  flightBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  favoriteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  flightCardMainRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  flightAirlineColumn: {
    width: 88,
    flexShrink: 0,
    minWidth: 0,
  },

  flightAirlineColumnPhone: {
    width: 72,
  },

  flightRouteColumn: {
    flex: 1,
    minWidth: 0,
  },

  airlineWrap: {
    marginBottom: 0,
    minWidth: 0,
  },

  anaLogoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  anaLogoText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1756D9",
    letterSpacing: -0.6,
    fontStyle: "italic",
  },

  anaLogoTextPhone: {
    fontSize: 12,
  },

  anaLogoWing: {
    width: 12,
    height: 5,
    marginLeft: 3,
    backgroundColor: "#1756D9",
    transform: [{ skewX: "-28deg" }],
  },

  airlineBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  airlineWordmark: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.text,
  },

  airlineWordmarkPhone: {
    fontSize: 9,
  },

  airlineSubtitle: {
    marginTop: 1,
    fontSize: 8,
    color: COLORS.subtext,
  },

  koreanBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },

  koreanBadgePhone: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 3,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E33935",
    flexShrink: 0,
  },

  jalBadgePhone: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 3,
  },

  jalBadgeText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  routeSummaryWrap: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  routeEndpoint: {
    minWidth: 48,
    flexShrink: 0,
  },

  routeEndpointPhone: {
    minWidth: 40,
  },

  routeEndpointRight: {
    alignItems: "flex-end",
  },

  routeMiddle: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    alignItems: "center",
  },

  routeMiddlePhone: {
    paddingHorizontal: 2,
  },

  routeTimeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#0A0F16",
  },

  routeTimeTextPhone: {
    fontSize: 11,
  },

  routeCodeText: {
    marginTop: 0,
    fontSize: 10,
    color: "#314360",
  },

  routeCodeTextPhone: {
    fontSize: 9,
  },

  routeDurationText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#314360",
  },

  routeDurationTextPhone: {
    fontSize: 8,
  },

  routeLineRow: {
    width: "100%",
    marginTop: 2,
    marginBottom: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#7E90B0",
    backgroundColor: "#FFFFFF",
  },

  routeLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#AFC1DD",
  },

  routeStopText: {
    fontSize: 9,
    fontWeight: "700",
  },

  routeStopTextPhone: {
    fontSize: 8,
  },

  routeOffsetText: {
    color: "#FF3434",
    fontSize: 10,
  },

  routeOffsetTextPhone: {
    fontSize: 9,
  },

  flightPriceColumn: {
    width: 86,
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },

  flightPriceColumnPhone: {
    width: 74,
  },

  flightPriceBlock: {
    alignItems: "flex-end",
  },

  flightPriceValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: COLORS.blue,
  },

  flightPriceValuePhone: {
    fontSize: 14,
  },

  flightPriceCaption: {
    marginTop: 0,
    fontSize: 9,
    color: COLORS.subtext,
  },

  detailsButton: {
    minWidth: 78,
    marginTop: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#C7DBFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  detailsButtonPhone: {
    minWidth: 68,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },

  detailsButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.blue,
  },

  detailsButtonTextPhone: {
    fontSize: 9,
  },

  trackerBanner: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E9F2FF",
    borderWidth: 1,
    borderColor: "#C8DBFF",
  },

  trackerBannerWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  trackerBannerActive: {
    backgroundColor: "#DBE9FF",
    borderColor: "#9FC1FF",
  },

  trackerCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  trackerCopyRowWide: {
    flex: 1,
    marginRight: 4,
  },

  trackerBotImage: {
    width: 34,
    height: 34,
    flexShrink: 0,
  },

  trackerCopy: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0,
  },

  trackerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },

  trackerTitlePhone: {
    fontSize: 11,
  },

  trackerDescription: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.subtext,
  },

  trackerDescriptionPhone: {
    fontSize: 9,
    lineHeight: 12,
  },

  trackButton: {
    minHeight: 30,
    marginTop: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BFD4FF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  trackButtonWide: {
    marginTop: 0,
    minWidth: 132,
    paddingHorizontal: 10,
  },

  trackButtonPhone: {
    minHeight: 28,
  },

  trackButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  trackButtonText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.blue,
  },

  trackButtonTextActive: {
    color: "#FFFFFF",
  },

  datePickerCard: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  datePickerFieldChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.blueLight,
  },

  datePickerFieldChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.blue,
  },

  datePickerMonthRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  datePickerNavButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FC",
  },

  datePickerNavButtonDisabled: {
    opacity: 0.45,
  },

  datePickerMonthLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  datePickerWeekRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  datePickerWeekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },

  datePickerGrid: {
    marginTop: 6,
  },

  datePickerWeek: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  datePickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    maxHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },

  datePickerDayToday: {
    borderWidth: 1,
    borderColor: "#C7DBFF",
  },

  datePickerDaySelected: {
    backgroundColor: COLORS.blue,
  },

  datePickerDayDisabled: {
    opacity: 0.35,
  },

  datePickerDayText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  datePickerDayTextSelected: {
    color: "#FFFFFF",
  },

  datePickerDayTextDisabled: {
    color: COLORS.muted,
  },

  datePickerSelectedLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.subtext,
  },

  datePickerActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  datePickerCancelButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  datePickerCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.subtext,
  },

  datePickerConfirmButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.blue,
  },

  datePickerConfirmText: {
    fontSize: 13,
    fontWeight: "800",
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
