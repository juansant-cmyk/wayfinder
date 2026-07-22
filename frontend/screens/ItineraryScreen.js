import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import {
  PLAN_FAVORITE_ITEM_TYPE,
  PLAN_FAVORITE_PROVIDER,
  favoriteKeyFromItem,
  planFavoriteKey,
  planFavoritePayload,
} from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { formatDateRange, formatNights, mapPlanDetail } from "../src/itinerary/mapPlan";
import DestinationSuggestField, {
  INVALID_MESSAGE as INVALID_DESTINATION_MESSAGE,
} from "../src/itinerary/DestinationSuggestField";
import TripSwitcherSheet from "../src/itinerary/TripSwitcherSheet";
import { useUserLocation } from "../src/location/UserLocationContext";
import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroArtworkImage = require("../assets/images/itinerary-hero-reference.png");
const tripPreviewImage = require("../assets/images/itinerary-trip-reference.png");
const tipBotImage = require("../assets/images/itinerary-tip-bot-reference.png");

/** Local-only demo trip — never persisted to the API. */
const DEMO_TRIP = {
  title: "Los Angeles Trip",
  destination: "Los Angeles, California",
  dates: "Jul 12 - Jul 15, 2025",
  nights: "3 Nights",
  startDate: "2025-07-12",
  endDate: "2025-07-15",
  hotelName: "",
  hotelProviderId: "",
  nightsCount: 3,
  dayCount: 4,
};

function buildTag(label, backgroundColor, textColor) {
  return {
    label,
    iconName: "sparkles",
    backgroundColor,
    textColor,
  };
}

const activityCategories = [
  {
    key: "cafe",
    label: "Cafe",
    iconLibrary: "ionicons",
    iconName: "cafe-outline",
    iconBackground: "#2066F5",
    markerColor: "#2066F5",
    tagBackgroundColor: "#EAF2FF",
    tagTextColor: "#245BE2",
  },
  {
    key: "photo",
    label: "Photo Spot",
    iconLibrary: "ionicons",
    iconName: "camera-outline",
    iconBackground: "#FF6D1F",
    markerColor: "#FF6D1F",
    tagBackgroundColor: "#FFF1E4",
    tagTextColor: "#E87424",
  },
  {
    key: "food",
    label: "Food",
    iconLibrary: "ionicons",
    iconName: "restaurant-outline",
    iconBackground: "#30B45C",
    markerColor: "#30B45C",
    tagBackgroundColor: "#EAF9F0",
    tagTextColor: "#16974B",
  },
  {
    key: "culture",
    label: "Culture",
    iconLibrary: "material",
    iconName: "bank-outline",
    iconBackground: "#7A56EC",
    markerColor: "#7A56EC",
    tagBackgroundColor: "#F1EBFF",
    tagTextColor: "#6A48D7",
  },
  {
    key: "sunset",
    label: "Scenic",
    iconLibrary: "ionicons",
    iconName: "sunny-outline",
    iconBackground: "#EA4A90",
    markerColor: "#EA4A90",
    tagBackgroundColor: "#FFE8F1",
    tagTextColor: "#E1477E",
  },
  {
    key: "travel",
    label: "Travel",
    iconLibrary: "ionicons",
    iconName: "airplane-outline",
    iconBackground: "#1F78FF",
    markerColor: "#1F78FF",
    tagBackgroundColor: "#EAF2FF",
    tagTextColor: "#245BE2",
  },
];

const categoryByKey = Object.fromEntries(
  activityCategories.map((category) => [category.key, category])
);

const itineraryTips = [
  "Consider using rideshare or public transit to avoid parking and traffic.",
  "The Getty Center is easiest with a timed ticket and a little extra arrival time.",
  "Griffith Observatory gets busier close to sunset, so arriving early helps.",
];

/** Local-only demo days — never persisted to the API. */
const DEMO_DAYS = [
  {
    id: "day1",
    label: "Day 1",
    shortDate: "Jul 12",
    fullDate: "Saturday, Jul 12",
    weather: { icon: "sunny", label: "Sunny", temperature: "78°F" },
    activities: [
      {
        id: "day1-breakfast",
        kind: "seed",
        time: "9:00 AM",
        title: "Breakfast at Urth Caffé",
        location: "Santa Monica",
        distance: "2.1 mi",
        markerColor: "#2066F5",
        iconLibrary: "ionicons",
        iconName: "cafe-outline",
        iconBackground: "#2066F5",
        tag: buildTag("Recommended by Wayfinder", "#EAF2FF", "#245BE2"),
      },
      {
        id: "day1-pier",
        kind: "seed",
        time: "11:00 AM",
        title: "Santa Monica Pier",
        location: "Santa Monica",
        distance: "2.4 mi",
        markerColor: "#FF6D1F",
        iconLibrary: "ionicons",
        iconName: "camera-outline",
        iconBackground: "#FF6D1F",
        tag: buildTag("Photo spot", "#FFF1E4", "#E87424"),
      },
      {
        id: "day1-lunch",
        kind: "seed",
        time: "1:30 PM",
        title: "Lunch at The Albright",
        location: "Santa Monica",
        distance: "0.8 mi",
        markerColor: "#30B45C",
        iconLibrary: "ionicons",
        iconName: "restaurant-outline",
        iconBackground: "#30B45C",
        tag: null,
      },
      {
        id: "day1-getty",
        kind: "seed",
        time: "3:30 PM",
        title: "The Getty Center",
        location: "Brentwood",
        distance: "6.3 mi",
        markerColor: "#7A56EC",
        iconLibrary: "material",
        iconName: "bank-outline",
        iconBackground: "#7A56EC",
        tag: buildTag("Reserve tickets online", "#F1EBFF", "#6A48D7"),
      },
      {
        id: "day1-griffith",
        kind: "seed",
        time: "7:00 PM",
        title: "Sunset at Griffith Observatory",
        location: "Los Feliz",
        distance: "7.9 mi",
        markerColor: "#EA4A90",
        iconLibrary: "ionicons",
        iconName: "sunny-outline",
        iconBackground: "#EA4A90",
        tag: buildTag("Best sunset in LA", "#FFE8F1", "#E1477E"),
      },
      {
        id: "day1-dinner",
        kind: "seed",
        time: "9:00 PM",
        title: "Dinner in Downtown LA",
        location: "Downtown LA",
        distance: "5.2 mi",
        markerColor: "#FDB92B",
        iconLibrary: "ionicons",
        iconName: "wine-outline",
        iconBackground: "#FDB92B",
        tag: null,
      },
    ],
  },
  {
    id: "day2",
    label: "Day 2",
    shortDate: "Jul 13",
    fullDate: "Sunday, Jul 13",
    weather: { icon: "partly-sunny", label: "Warm", temperature: "80°F" },
    activities: [
      {
        id: "day2-coffee",
        kind: "seed",
        time: "8:30 AM",
        title: "Coffee in Venice",
        location: "Venice Beach",
        distance: "3.4 mi",
        markerColor: "#2066F5",
        iconLibrary: "ionicons",
        iconName: "cafe-outline",
        iconBackground: "#2066F5",
        tag: null,
      },
      {
        id: "day2-canals",
        kind: "seed",
        time: "10:00 AM",
        title: "Venice Canals Walk",
        location: "Venice",
        distance: "0.6 mi",
        markerColor: "#1F78FF",
        iconLibrary: "ionicons",
        iconName: "airplane-outline",
        iconBackground: "#1F78FF",
        tag: buildTag("Slow morning", "#EAF2FF", "#245BE2"),
      },
      {
        id: "day2-lunch",
        kind: "seed",
        time: "1:00 PM",
        title: "Lunch on Abbot Kinney",
        location: "Venice",
        distance: "1.2 mi",
        markerColor: "#30B45C",
        iconLibrary: "ionicons",
        iconName: "restaurant-outline",
        iconBackground: "#30B45C",
        tag: null,
      },
    ],
  },
  {
    id: "day3",
    label: "Day 3",
    shortDate: "Jul 14",
    fullDate: "Monday, Jul 14",
    weather: { icon: "sunny", label: "Clear", temperature: "76°F" },
    activities: [
      {
        id: "day3-hike",
        kind: "seed",
        time: "7:30 AM",
        title: "Runyon Canyon Hike",
        location: "Hollywood Hills",
        distance: "4.8 mi",
        markerColor: "#1F78FF",
        iconLibrary: "ionicons",
        iconName: "airplane-outline",
        iconBackground: "#1F78FF",
        tag: buildTag("Morning views", "#EAF2FF", "#245BE2"),
      },
      {
        id: "day3-museum",
        kind: "seed",
        time: "2:00 PM",
        title: "Academy Museum",
        location: "Miracle Mile",
        distance: "5.1 mi",
        markerColor: "#7A56EC",
        iconLibrary: "material",
        iconName: "bank-outline",
        iconBackground: "#7A56EC",
        tag: null,
      },
    ],
  },
  {
    id: "day4",
    label: "Day 4",
    shortDate: "Jul 15",
    fullDate: "Tuesday, Jul 15",
    weather: { icon: "sunny", label: "Bright", temperature: "75°F" },
    activities: [
      {
        id: "day4-broad",
        kind: "seed",
        time: "11:30 AM",
        title: "The Broad",
        location: "Downtown LA",
        distance: "1.1 mi",
        markerColor: "#7A56EC",
        iconLibrary: "material",
        iconName: "bank-outline",
        iconBackground: "#7A56EC",
        tag: null,
      },
      {
        id: "day4-transfer",
        kind: "seed",
        time: "5:30 PM",
        title: "Airport Transfer",
        location: "LAX",
        distance: "11.2 mi",
        markerColor: "#1F78FF",
        iconLibrary: "ionicons",
        iconName: "airplane-outline",
        iconBackground: "#1F78FF",
        tag: buildTag("Leave early for traffic", "#EAF2FF", "#245BE2"),
      },
    ],
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

function createEmptyTripDraft() {
  return {
    title: "",
    destination: "",
    selectedDestination: null,
    startDate: "",
    endDate: "",
    hotelName: "",
    hotelProviderId: "",
  };
}

function createTripDraftFromTrip(trip) {
  return {
    title: trip?.title || "",
    destination: trip?.destination || "",
    selectedDestination: trip?.destination
      ? { label: trip.destination, lat: null, lng: null }
      : null,
    startDate: trip?.startDate || "",
    endDate: trip?.endDate || "",
    hotelName: trip?.hotelName || "",
    hotelProviderId: trip?.hotelProviderId || "",
  };
}

function nightsFromDates(startDate, endDate) {
  if (!startDate || !endDate) {
    return null;
  }
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function createActivityDraft(dayId) {
  return {
    dayId,
    time: "12:00 PM",
    title: "",
    location: "",
    category: "food",
    tag: "",
  };
}

function parseTime(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hours === 12) {
    hours = 0;
  }

  if (meridiem === "PM") {
    hours += 12;
  }

  return hours * 60 + minutes;
}

function sortedActivities(activities) {
  return [...activities].sort((left, right) => parseTime(left.time) - parseTime(right.time));
}

/** Build a local (demo-only) activity; distance stays placeholder until GPS mapping. */
function buildActivityFromDraft(draft) {
  const category = categoryByKey[draft.category] || categoryByKey.food;
  const tagLabel = draft.tag.trim();

  return {
    id: `activity-${Date.now()}`,
    kind: "custom",
    time: draft.time.trim(),
    title: draft.title.trim(),
    location: draft.location.trim(),
    distance: "—",
    markerColor: category.markerColor,
    iconLibrary: category.iconLibrary,
    iconName: category.iconName,
    iconBackground: category.iconBackground,
    tag: tagLabel ? buildTag(tagLabel, category.tagBackgroundColor, category.tagTextColor) : null,
  };
}

function renderIcon(library, name, size, color) {
  if (library === "material") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Ionicons name={name} size={size} color={color} />;
}

function activityMapUrl(activity, destination) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${activity.title}, ${activity.location}, ${destination}`
  )}`;
}

function routeMapUrl(day, destination) {
  const stops = day.activities.map(
    (activity) => `${activity.title}, ${activity.location}, ${destination}`
  );

  if (stops.length < 2) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  }

  const [origin, ...rest] = stops;
  const destinationStop = rest[rest.length - 1];
  const waypoints = rest.slice(0, -1);
  const waypointQuery = waypoints.length
    ? `&waypoints=${encodeURIComponent(waypoints.join("|"))}`
    : "";

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destinationStop)}${waypointQuery}&travelmode=driving`;
}

async function openExternalUrl(url, onFailure) {
  try {
    await Linking.openURL(url);
  } catch (_error) {
    onFailure?.();
  }
}

function HeaderActionButton({ iconName, iconSize = 28, accessibilityLabel, onPress, showDot = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.headerActionButton}
    >
      <Ionicons name={iconName} size={iconSize} color="#16284A" />
      {showDot ? <View style={styles.headerActionDot} /> : null}
    </Pressable>
  );
}

function PillButton({ label, iconName, onPress, outlined = false, compact = false, accessibilityLabel, style }) {
  const Button = outlined ? DimPressable : Pressable;

  return (
    <Button
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={[
        styles.pillButton,
        outlined ? styles.pillButtonOutlined : styles.pillButtonSolid,
        compact && styles.pillButtonCompact,
        style,
      ]}
    >
      <Ionicons name={iconName} size={compact ? 14 : 18} color="#2463EB" />
      <Text style={[styles.pillButtonText, compact && styles.pillButtonTextCompact]}>{label}</Text>
    </Button>
  );
}

function GradientTab({ day, active, onPress, compact = false }) {
  const content = (
    <>
      {active ? (
        <>
          <View style={styles.activeTabGlowLarge} />
          <View style={styles.activeTabGlowSmall} />
        </>
      ) : null}
      <Text style={[styles.dayTabTitle, compact && styles.dayTabTitleCompact, active && styles.dayTabTitleActive]}>
        {day.label}
      </Text>
      <Text style={[styles.dayTabDate, compact && styles.dayTabDateCompact, active && styles.dayTabDateActive]}>
        {day.shortDate}
      </Text>
    </>
  );

  if (active) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${day.label}, ${day.shortDate}`}
        onPress={onPress}
        style={[styles.dayTab, compact && styles.dayTabCompact, styles.dayTabActive]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <DimPressable
      accessibilityRole="button"
      accessibilityLabel={`${day.label}, ${day.shortDate}`}
      onPress={onPress}
      style={[styles.dayTab, compact && styles.dayTabCompact]}
    >
      {content}
    </DimPressable>
  );
}

function TagBadge({ tag, compact = false }) {
  if (!tag) {
    return null;
  }

  return (
    <View
      style={[
        styles.tagBadge,
        compact && styles.tagBadgeCompact,
        { backgroundColor: tag.backgroundColor },
      ]}
    >
      <Ionicons name={tag.iconName} size={compact ? 9 : 10} color={tag.textColor} />
      <Text
        numberOfLines={1}
        style={[styles.tagBadgeText, compact && styles.tagBadgeTextCompact, { color: tag.textColor }]}
      >
        {tag.label}
      </Text>
    </View>
  );
}

function ActivityRow({ activity, compact = false, isFirst, isLast, onOpenDetails, onOpenMap, onDelete }) {
  const iconSize = compact ? 18 : 22;
  const markerIcon = compact ? 13 : 15;
  const chevronSize = compact ? 16 : 18;

  return (
    <View style={[styles.activityRow, compact && styles.activityRowCompact, isFirst && styles.activityRowFirst]}>
      <View style={[styles.timeColumn, compact && styles.timeColumnCompact]}>
        <Text style={[styles.timeText, compact && styles.timeTextCompact]}>{activity.time}</Text>
      </View>

      <View style={[styles.timelineColumn, compact && styles.timelineColumnCompact]}>
        <View style={[styles.timelineSegment, isFirst && styles.timelineSegmentHidden]} />
        <View
          style={[
            styles.timelineMarker,
            compact && styles.timelineMarkerCompact,
            { borderColor: activity.markerColor },
          ]}
        />
        <View style={[styles.timelineSegment, isLast && styles.timelineSegmentHidden]} />
      </View>

      <View style={[styles.iconColumn, compact && styles.iconColumnCompact]}>
        <View
          style={[
            styles.activityIconCircle,
            compact && styles.activityIconCircleCompact,
            { backgroundColor: activity.iconBackground },
          ]}
        >
          {renderIcon(activity.iconLibrary, activity.iconName, iconSize, "#FFFFFF")}
        </View>
      </View>

      <Pressable style={[styles.detailsColumn, compact && styles.detailsColumnCompact]} onPress={onOpenDetails}>
        <Text numberOfLines={2} style={[styles.activityTitle, compact && styles.activityTitleCompact]}>
          {activity.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={compact ? 11 : 13} color="#2463EB" />
          <Text numberOfLines={1} style={[styles.locationText, compact && styles.locationTextCompact]}>
            {activity.location}
          </Text>
        </View>
        <TagBadge tag={activity.tag} compact={compact} />
      </Pressable>

      <View style={[styles.routeActionColumn, compact && styles.routeActionColumnCompact]}>
        <Pressable onPress={onOpenMap} style={styles.routeActionRow}>
          <Ionicons name="location" size={markerIcon} color="#2463EB" />
          <Text style={[styles.distanceText, compact && styles.distanceTextCompact]}>{activity.distance}</Text>
          <Ionicons name="chevron-forward" size={chevronSize} color="#627089" />
        </Pressable>

        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${activity.title}`}
            onPress={onDelete}
            style={styles.deleteActivityButton}
          >
            <Ionicons name="trash-outline" size={15} color="#C2410C" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function TipCard({ onPress, compact = false }) {
  return (
    <View style={[styles.tipCard, cardShadowStyle, compact && styles.tipCardCompact]}>
      <Image
        source={tipBotImage}
        resizeMode="contain"
        style={[styles.tipRobotImage, compact && styles.tipRobotImageCompact]}
      />
      <View style={styles.tipCopyColumn}>
        <Text style={[styles.tipHeading, compact && styles.tipHeadingCompact]}>
          Wayfinder Tip <Text style={styles.tipSpark}>✦</Text>
        </Text>
        <Text numberOfLines={compact ? 2 : 3} style={[styles.tipBody, compact && styles.tipBodyCompact]}>
          Consider using rideshare or public transit to avoid parking and traffic.
        </Text>
      </View>
      <Pressable onPress={onPress} style={styles.tipLinkButton}>
        <Text numberOfLines={1} style={[styles.tipLinkText, compact && styles.tipLinkTextCompact]}>
          View Tips
        </Text>
        <Ionicons name="chevron-forward" size={compact ? 16 : 18} color="#2463EB" />
      </Pressable>
    </View>
  );
}

function ModalShell({ visible, title, subtitle, onClose, children, footer }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#16284A" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.modalFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default" }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A99B1"
        keyboardType={keyboardType}
        style={styles.fieldInput}
      />
    </View>
  );
}

function TripCoverImage({ uri, fallback, style }) {
  const [failed, setFailed] = useState(false);
  const source = uri && !failed ? { uri } : fallback;
  return (
    <Image
      source={source}
      resizeMode="cover"
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

function StaticField({ label, value }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.readOnlyField}>{value || "—"}</Text>
    </View>
  );
}

function CategoryChip({ category, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.label}
      onPress={onPress}
      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
    >
      <View
        style={[
          styles.categoryIconBadge,
          { backgroundColor: selected ? "#FFFFFF" : category.iconBackground },
        ]}
      >
        {renderIcon(category.iconLibrary, category.iconName, 15, selected ? category.iconBackground : "#FFFFFF")}
      </View>
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{category.label}</Text>
    </Pressable>
  );
}

function FooterButton({ label, primary = false, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.footerButton, primary && styles.footerButtonPrimary]}>
      <Text style={[styles.footerButtonText, primary && styles.footerButtonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

export default function ItineraryScreen({ onNavigate, onBack, params = {} }) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width } = useWindowDimensions();
  const { location } = useUserLocation();
  const skipApiLoadRef = useRef(false);
  /** In-session demo edits — kept when exiting demo so re-opening Demo restores them. */
  const demoSessionRef = useRef(null);

  const isPhone = width < 520;
  const isCompactPhone = width < 400;
  const pageMaxWidth = width >= 1100 ? 1040 : 980;

  // Approved itinerary hero is 500×180 — size near natural resolution (avoid soft upscaling).
  const heroAspectRatio = 500 / 180;
  const heroArtworkWidth = isCompactPhone
    ? Math.min(Math.round(width * 0.46), 188)
    : isPhone
      ? Math.min(Math.round(width * 0.44), 214)
      : width < 900
        ? Math.min(Math.round(width * 0.36), 300)
        : Math.min(Math.round(width * 0.32), 360);
  const heroTitleSize = isCompactPhone ? 30 : isPhone ? 34 : width < 900 ? 40 : 44;
  const heroSubtitleSize = isCompactPhone ? 14 : isPhone ? 15 : 17;
  const backButtonSize = isCompactPhone ? 40 : isPhone ? 44 : 48;

  const [viewMode, setViewMode] = useState("loading"); // loading | empty | demo | plan
  const [planId, setPlanId] = useState(null);
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");

  const [isCreateTripVisible, setIsCreateTripVisible] = useState(false);
  const [createDraft, setCreateDraft] = useState(createEmptyTripDraft());
  const [createDraftError, setCreateDraftError] = useState("");
  const [isSavingTrip, setIsSavingTrip] = useState(false);

  const [editTripVisible, setEditTripVisible] = useState(false);
  const [tripDraft, setTripDraft] = useState(createEmptyTripDraft());
  const [tripDraftError, setTripDraftError] = useState("");

  const [addActivityVisible, setAddActivityVisible] = useState(false);
  const [activityDraft, setActivityDraft] = useState(createActivityDraft(null));
  const [activityDraftError, setActivityDraftError] = useState("");
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const [tipsVisible, setTipsVisible] = useState(false);
  const [selectedActivityRef, setSelectedActivityRef] = useState(null);

  const [isPlanFavorited, setIsPlanFavorited] = useState(false);
  const [isFavoritePending, setIsFavoritePending] = useState(false);

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [activePlans, setActivePlans] = useState([]);
  const [pastPlans, setPastPlans] = useState([]);
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [switcherError, setSwitcherError] = useState("");

  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0] || null;
  const selectedActivity = selectedActivityRef
    ? days
        .find((day) => day.id === selectedActivityRef.dayId)
        ?.activities.find((activity) => activity.id === selectedActivityRef.activityId) || null
    : null;

  const applyMappedPlan = useCallback((plan, userLocation) => {
    skipApiLoadRef.current = false;
    const mapped = mapPlanDetail(plan, userLocation);
    setPlanId(plan.id);
    setTrip(mapped.trip);
    setDays(mapped.days);
    setSelectedDayId((current) => {
      if (current && mapped.days.some((day) => day.id === current)) {
        return current;
      }
      return mapped.days[0]?.id || null;
    });
    setViewMode("plan");
    setLoadError("");
  }, []);

  const loadPlan = useCallback(
    async (requestedPlanId = params.planId) => {
      // Demo itinerary is local-only; skip until user navigates with a planId.
      if (skipApiLoadRef.current && !requestedPlanId) {
        return;
      }

      skipApiLoadRef.current = false;
      setViewMode((mode) => (mode === "plan" || mode === "demo" ? mode : "loading"));
      setLoadError("");

      try {
        const token = await getToken();
        if (!token) {
          setPlanId(null);
          setTrip(null);
          setDays([]);
          setSelectedDayId(null);
          setViewMode("empty");
          setLoadError("Sign in to load or create a trip.");
          return;
        }

        let targetId = requestedPlanId || null;
        if (!targetId) {
          const plans = await dashboardApi.fetchPlans(token, "active");
          if (!plans?.length) {
            setPlanId(null);
            setTrip(null);
            setDays([]);
            setSelectedDayId(null);
            setViewMode("empty");
            return;
          }
          targetId = plans[0].id;
        }

        const plan = await dashboardApi.fetchPlan(token, targetId);
        applyMappedPlan(plan, location);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load itinerary.";
        setLoadError(message);
        setPlanId(null);
        setTrip(null);
        setDays([]);
        setSelectedDayId(null);
        setViewMode("empty");
      }
    },
    [applyMappedPlan, location, params.planId]
  );

  // Reload when planId or GPS origin changes (distances remap via mapPlanDetail).
  useEffect(() => {
    loadPlan(params.planId);
  }, [params.planId, location?.lat, location?.lng, loadPlan]);

  useEffect(() => {
    let cancelled = false;

    async function loadFavoriteState(currentPlanId) {
      if (!currentPlanId || viewMode !== "plan") {
        setIsPlanFavorited(false);
        return;
      }
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setIsPlanFavorited(false);
          }
          return;
        }
        const favorites = await dashboardApi.fetchFavorites(token);
        const key = planFavoriteKey(currentPlanId);
        const isSaved = (favorites || []).some(
          (item) =>
            item.item_type === PLAN_FAVORITE_ITEM_TYPE && favoriteKeyFromItem(item) === key
        );
        if (!cancelled) {
          setIsPlanFavorited(isSaved);
        }
      } catch {
        // Keep prior heart state if refresh fails.
      }
    }

    loadFavoriteState(planId);
    return () => {
      cancelled = true;
    };
  }, [planId, viewMode]);

  const togglePlanFavorite = async () => {
    if (viewMode !== "plan" || !planId || !trip) {
      return;
    }
    if (isFavoritePending) {
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in required", "Sign in to save trips to your favorites.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => onNavigate?.("login") },
      ]);
      return;
    }

    const wasSaved = isPlanFavorited;
    setIsFavoritePending(true);
    setIsPlanFavorited(!wasSaved);

    try {
      if (wasSaved) {
        await dashboardApi.removeFavorite(token, {
          itemType: PLAN_FAVORITE_ITEM_TYPE,
          provider: PLAN_FAVORITE_PROVIDER,
          providerItemId: String(planId),
        });
        setNotice("Removed from favorites.");
      } else {
        await dashboardApi.addFavorite(token, planFavoritePayload(planId, trip));
        setNotice("Saved to favorites.");
      }
    } catch (err) {
      setIsPlanFavorited(wasSaved);
      Alert.alert("Couldn't update favorites", err?.message || "Please try again.");
    } finally {
      setIsFavoritePending(false);
    }
  };

  const refreshPlanLists = useCallback(async () => {
    setSwitcherLoading(true);
    setSwitcherError("");
    try {
      const token = await getToken();
      if (!token) {
        setActivePlans([]);
        setPastPlans([]);
        setSwitcherError("Sign in to manage trips.");
        return;
      }
      const [active, past] = await Promise.all([
        dashboardApi.fetchPlans(token, "active"),
        dashboardApi.fetchPlans(token, "completed"),
      ]);
      setActivePlans(active || []);
      setPastPlans(past || []);
    } catch (error) {
      setSwitcherError(error instanceof Error ? error.message : "Couldn't load trips.");
    } finally {
      setSwitcherLoading(false);
    }
  }, []);

  const hasDirtyDrafts = () =>
    isCreateTripVisible || editTripVisible || addActivityVisible;

  const confirmDiscardThen = (action) => {
    if (!hasDirtyDrafts()) {
      action();
      return;
    }
    Alert.alert("Discard changes?", "You have unsaved edits. Discard them and continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setIsCreateTripVisible(false);
          setEditTripVisible(false);
          setAddActivityVisible(false);
          setCreateDraftError("");
          setTripDraftError("");
          setActivityDraftError("");
          action();
        },
      },
    ]);
  };

  const openTripSwitcher = () => {
    if (viewMode === "demo") {
      Alert.alert("Demo mode", "Create a real trip to use the trip switcher.");
      return;
    }
    confirmDiscardThen(() => {
      setSwitcherVisible(true);
      refreshPlanLists();
    });
  };

  const closeTripSwitcher = () => setSwitcherVisible(false);

  const showEmptyActiveState = () => {
    setPlanId(null);
    setTrip(null);
    setDays([]);
    setSelectedDayId(null);
    setViewMode("empty");
    setIsPlanFavorited(false);
  };

  const loadPlanById = async (nextPlanId) => {
    const token = await getToken();
    if (!token) {
      setLoadError("Sign in to load or create a trip.");
      showEmptyActiveState();
      return;
    }
    const plan = await dashboardApi.fetchPlan(token, nextPlanId);
    applyMappedPlan(plan, location);
  };

  const handleSelectPlan = (plan) => {
    confirmDiscardThen(async () => {
      try {
        closeTripSwitcher();
        if (String(plan.id) === String(planId) && viewMode === "plan") {
          return;
        }
        await loadPlanById(plan.id);
      } catch (error) {
        Alert.alert("Couldn't open trip", error instanceof Error ? error.message : "Try again.");
      }
    });
  };

  const handleCreateFromSwitcher = () => {
    confirmDiscardThen(() => {
      closeTripSwitcher();
      openCreateTrip();
    });
  };

  const handleCompletePlan = async (plan) => {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      await dashboardApi.completePlan(token, plan.id);
      await refreshPlanLists();
      const wasCurrent = String(plan.id) === String(planId);
      if (wasCurrent) {
        const remaining = (await dashboardApi.fetchPlans(token, "active")) || [];
        setActivePlans(remaining);
        if (remaining.length > 0) {
          await loadPlanById(remaining[0].id);
          setNotice("Trip marked complete.");
        } else {
          showEmptyActiveState();
          setNotice("Trip marked complete. Create a new trip when you're ready.");
        }
      } else {
        setNotice("Trip marked complete.");
      }
    } catch (error) {
      Alert.alert("Couldn't complete trip", error instanceof Error ? error.message : "Try again.");
    }
  };

  const handleReopenPlan = async (plan) => {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const updated = await dashboardApi.reopenPlan(token, plan.id);
      await refreshPlanLists();
      await loadPlanById(updated.id);
      closeTripSwitcher();
      setNotice("Trip reopened.");
    } catch (error) {
      Alert.alert("Couldn't reopen trip", error instanceof Error ? error.message : "Try again.");
    }
  };

  const handleDeletePlan = async (plan) => {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const wasCurrent = String(plan.id) === String(planId);
      await dashboardApi.deletePlan(token, plan.id);
      if (wasCurrent && isPlanFavorited) {
        setIsPlanFavorited(false);
      }
      await refreshPlanLists();
      if (wasCurrent) {
        const remaining = (await dashboardApi.fetchPlans(token, "active")) || [];
        setActivePlans(remaining);
        if (remaining.length > 0) {
          await loadPlanById(remaining[0].id);
        } else {
          showEmptyActiveState();
        }
        setNotice("Trip deleted.");
      } else {
        setNotice("Trip deleted.");
      }
    } catch (error) {
      Alert.alert("Couldn't delete trip", error instanceof Error ? error.message : "Try again.");
    }
  };

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const startDemoItinerary = () => {
    skipApiLoadRef.current = true;
    setPlanId(null);

    const saved = demoSessionRef.current;
    if (saved?.trip && Array.isArray(saved.days) && saved.days.length > 0) {
      setTrip(saved.trip);
      setDays(saved.days);
      setSelectedDayId(
        saved.selectedDayId && saved.days.some((day) => day.id === saved.selectedDayId)
          ? saved.selectedDayId
          : saved.days[0].id
      );
    } else {
      setTrip({ ...DEMO_TRIP });
      setDays(DEMO_DAYS.map((day) => ({ ...day, activities: [...day.activities] })));
      setSelectedDayId(DEMO_DAYS[0].id);
    }

    setViewMode("demo");
    setLoadError("");
    setNotice("Demo itinerary loaded locally — not saved.");
  };

  const exitDemoItinerary = () => {
    if (trip && days.length > 0) {
      demoSessionRef.current = {
        trip,
        days,
        selectedDayId,
      };
    }

    // Stay on the Itinerary landing UI; do not navigate Home or reload an API plan.
    skipApiLoadRef.current = true;
    setPlanId(null);
    setTrip(null);
    setDays([]);
    setSelectedDayId(null);
    setViewMode("empty");
    setLoadError("");
    setNotice("");
    setIsPlanFavorited(false);
  };

  const handleHeaderBack = () => {
    if (viewMode === "demo") {
      exitDemoItinerary();
      return;
    }
    if (onBack) {
      onBack();
      return;
    }
    onNavigate?.("home");
  };

  const openCreateTrip = () => {
    setCreateDraft(createEmptyTripDraft());
    setCreateDraftError("");
    setIsCreateTripVisible(true);
  };

  const saveCreateTrip = async () => {
    const title = createDraft.title.trim();
    const destination = createDraft.destination.trim();
    const startDate = createDraft.startDate.trim();
    const endDate = createDraft.endDate.trim();
    const hotelName = createDraft.hotelName.trim();
    const hotelProviderId = createDraft.hotelProviderId.trim();

    if (!title || !destination || !startDate || !endDate) {
      setCreateDraftError("Title, destination, start date, and end date are required.");
      return;
    }

    if (
      !createDraft.selectedDestination ||
      createDraft.selectedDestination.label.trim().toLowerCase() !== destination.toLowerCase()
    ) {
      setCreateDraftError(INVALID_DESTINATION_MESSAGE);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      setCreateDraftError("Use YYYY-MM-DD for start and end dates.");
      return;
    }

    setIsSavingTrip(true);
    setCreateDraftError("");

    try {
      const token = await getToken();
      if (!token) {
        setCreateDraftError("Sign in to create a trip.");
        return;
      }

      const body = {
        title,
        destination_name: createDraft.selectedDestination.label || destination,
        start_date: startDate,
        end_date: endDate,
      };
      if (createDraft.selectedDestination.lat != null && createDraft.selectedDestination.lng != null) {
        body.center_lat = createDraft.selectedDestination.lat;
        body.center_lng = createDraft.selectedDestination.lng;
      }
      if (hotelName) {
        body.hotel_name = hotelName;
      }
      if (hotelProviderId) {
        body.hotel_provider_id = hotelProviderId;
      }

      const plan = await dashboardApi.createPlan(token, body);
      setIsCreateTripVisible(false);
      applyMappedPlan(plan, location);
      setNotice("Trip created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create trip.";
      setCreateDraftError(message);
    } finally {
      setIsSavingTrip(false);
    }
  };

  const openTripEditor = () => {
    if (!trip) {
      return;
    }
    setTripDraft(createTripDraftFromTrip(trip));
    setTripDraftError("");
    setEditTripVisible(true);
  };

  const saveTripEdits = async () => {
    const title = tripDraft.title.trim();
    const destination = tripDraft.destination.trim();
    const startDate = tripDraft.startDate.trim();
    const endDate = tripDraft.endDate.trim();
    const hotelName = tripDraft.hotelName.trim();
    const hotelProviderId = tripDraft.hotelProviderId.trim();

    if (!title || !destination || !startDate || !endDate) {
      setTripDraftError("Title, destination, start date, and end date are required.");
      return;
    }

    if (
      !tripDraft.selectedDestination ||
      tripDraft.selectedDestination.label.trim().toLowerCase() !== destination.toLowerCase()
    ) {
      setTripDraftError(INVALID_DESTINATION_MESSAGE);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      setTripDraftError("Use YYYY-MM-DD for start and end dates.");
      return;
    }

    const nightsCount = nightsFromDates(startDate, endDate);

    // Demo: local-only edits, no API.
    if (viewMode === "demo") {
      setTrip({
        ...trip,
        title,
        destination,
        startDate,
        endDate,
        dates: formatDateRange(startDate, endDate),
        nights: formatNights(nightsCount),
        nightsCount,
        hotelName,
        hotelProviderId,
      });
      setEditTripVisible(false);
      setTripDraftError("");
      setNotice("Demo trip updated locally.");
      return;
    }

    setIsSavingTrip(true);
    setTripDraftError("");

    try {
      const token = await getToken();
      if (!token || !planId) {
        setTripDraftError("Sign in to save trip edits.");
        return;
      }

      const body = {
        title,
        destination_name: tripDraft.selectedDestination.label || destination,
        start_date: startDate,
        end_date: endDate,
        hotel_name: hotelName || null,
      };
      if (tripDraft.selectedDestination.lat != null && tripDraft.selectedDestination.lng != null) {
        body.center_lat = tripDraft.selectedDestination.lat;
        body.center_lng = tripDraft.selectedDestination.lng;
      }
      if (hotelProviderId) {
        body.hotel_provider_id = hotelProviderId;
      }

      const plan = await dashboardApi.updatePlan(token, planId, body);
      applyMappedPlan(plan, location);
      if (isPlanFavorited) {
        const mapped = mapPlanDetail(plan, location);
        try {
          await dashboardApi.addFavorite(
            token,
            planFavoritePayload(planId, mapped.trip)
          );
        } catch {
          // Favorites list still hydrates from the live plan on refresh.
        }
      }
      setEditTripVisible(false);
      setNotice("Trip details updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update trip.";
      setTripDraftError(message);
    } finally {
      setIsSavingTrip(false);
    }
  };

  const openAddActivity = () => {
    if (!selectedDay) {
      return;
    }
    setActivityDraft(createActivityDraft(selectedDay.id));
    setActivityDraftError("");
    setAddActivityVisible(true);
  };

  const saveActivity = async () => {
    if (!selectedDay) {
      return;
    }

    if (!activityDraft.time.trim() || !activityDraft.title.trim() || !activityDraft.location.trim()) {
      setActivityDraftError("Add a time, title, and location before saving.");
      return;
    }

    // Demo: append locally without API.
    if (viewMode === "demo") {
      const nextActivity = buildActivityFromDraft(activityDraft);
      setDays((currentDays) =>
        currentDays.map((day) =>
          day.id === selectedDay.id
            ? { ...day, activities: sortedActivities([...day.activities, nextActivity]) }
            : day
        )
      );
      setAddActivityVisible(false);
      setActivityDraftError("");
      setNotice(`${nextActivity.title} added to ${selectedDay.label}.`);
      return;
    }

    setIsSavingActivity(true);
    setActivityDraftError("");

    try {
      const token = await getToken();
      if (!token || !planId) {
        setActivityDraftError("Sign in to add an activity.");
        return;
      }

      await dashboardApi.createPlanActivity(token, planId, selectedDay.id, {
        time_label: activityDraft.time.trim(),
        title: activityDraft.title.trim(),
        location: activityDraft.location.trim(),
        category: activityDraft.category,
        tag_label: activityDraft.tag.trim() || null,
      });

      const plan = await dashboardApi.fetchPlan(token, planId);
      applyMappedPlan(plan, location);
      setAddActivityVisible(false);
      setNotice(`${activityDraft.title.trim()} added to ${selectedDay.label}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add activity.";
      setActivityDraftError(message);
    } finally {
      setIsSavingActivity(false);
    }
  };

  const deleteCustomActivity = async (activity) => {
    if (viewMode !== "plan" || !planId || activity.kind !== "custom") {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setNotice("Sign in to delete activities.");
        return;
      }

      await dashboardApi.deletePlanActivity(token, planId, activity.id);
      const plan = await dashboardApi.fetchPlan(token, planId);
      applyMappedPlan(plan, location);
      setSelectedActivityRef(null);
      setNotice("Activity removed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete activity.";
      setNotice(message);
    }
  };

  const openDetails = (activity) => {
    if (!selectedDay) {
      return;
    }
    setSelectedActivityRef({ dayId: selectedDay.id, activityId: activity.id });
  };

  const closeDetails = () => setSelectedActivityRef(null);

  const openActivityMapPress = (activity) => {
    if (!trip) {
      return;
    }
    openExternalUrl(activityMapUrl(activity, trip.destination), () =>
      setNotice(`Unable to open ${activity.title} in Maps right now.`)
    );
  };

  const openDayRoute = () => {
    if (!selectedDay || !trip) {
      return;
    }
    openExternalUrl(routeMapUrl(selectedDay, trip.destination), () =>
      setNotice("Unable to open the route map right now.")
    );
  };

  const editNightsPreview = formatNights(nightsFromDates(tripDraft.startDate, tripDraft.endDate));
  const createNightsPreview = formatNights(
    nightsFromDates(createDraft.startDate, createDraft.endDate)
  );
  const showTripContent = viewMode === "plan" || viewMode === "demo";
  const canDeleteActivity = (activity) => viewMode === "plan" && activity.kind === "custom";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomNavPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.page, { maxWidth: pageMaxWidth }]}>
            <View style={styles.pageGlowBottom} />

            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={handleHeaderBack}
                style={[
                  styles.roundHeaderButton,
                  { width: backButtonSize, height: backButtonSize, borderRadius: backButtonSize / 2 },
                ]}
              >
                <Ionicons name="arrow-back" size={isPhone ? 22 : 26} color="#14253E" />
              </DimPressable>

              <View style={styles.headerActions}>
                <HeaderActionButton
                  iconName="notifications-outline"
                  iconSize={isPhone ? 24 : 28}
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  showDot
                />
                <HeaderActionButton
                  iconName="person-circle-outline"
                  iconSize={isPhone ? 30 : 33}
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                />
              </View>
            </View>

            {notice ? (
              <View style={styles.noticeBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#2463EB" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}

            {loadError && viewMode === "empty" ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#C2410C" />
                <Text style={styles.errorBannerText}>{loadError}</Text>
              </View>
            ) : null}

            <View style={styles.heroSection}>
              <View style={styles.heroCopyColumn}>
                <Text
                  style={[
                    styles.heroTitle,
                    { fontSize: heroTitleSize, lineHeight: heroTitleSize + 4 },
                  ]}
                  numberOfLines={1}
                >
                  Itinerary
                </Text>
                <Text
                  style={[
                    styles.heroSubtitle,
                    {
                      fontSize: heroSubtitleSize,
                      lineHeight: heroSubtitleSize + 8,
                    },
                  ]}
                >
                  Your trip, <Text style={styles.heroSubtitleAccent}>day by day.</Text>
                </Text>
              </View>

              <View
                style={[
                  styles.heroArtworkWrap,
                  {
                    width: heroArtworkWidth,
                    maxWidth: heroArtworkWidth,
                    aspectRatio: heroAspectRatio,
                  },
                ]}
              >
                <Image
                  source={heroArtworkImage}
                  resizeMode="contain"
                  style={styles.heroArtworkImage}
                />
              </View>
            </View>

            {viewMode === "loading" ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color="#2463EB" />
                <Text style={styles.loadingText}>Loading your itinerary…</Text>
              </View>
            ) : null}

            {viewMode === "empty" ? (
              <View style={[styles.emptyCard, cardShadowStyle]}>
                <Text style={styles.emptyTitle}>No trip yet</Text>
                <Text style={styles.emptyBody}>
                  Create a trip to build a day-by-day itinerary, or explore the local demo.
                </Text>
                <View style={styles.emptyActions}>
                  <PillButton label="Create Trip" iconName="add" onPress={openCreateTrip} />
                  <PillButton
                    label="Demo Itinerary"
                    iconName="sparkles"
                    outlined
                    onPress={startDemoItinerary}
                    accessibilityLabel="Load demo itinerary"
                  />
                </View>
              </View>
            ) : null}

            {showTripContent && trip ? (
              <>
                {viewMode === "demo" ? (
                  <View style={styles.demoBanner}>
                    <Ionicons name="flask-outline" size={14} color="#1849A9" />
                    <Text style={styles.demoBannerText}>
                      Demo mode — edits stay on this device until you create a real trip.
                    </Text>
                  </View>
                ) : null}

                {viewMode === "plan" && trip.status === "completed" ? (
                  <View style={styles.completedBanner}>
                    <Ionicons name="checkmark-circle" size={16} color="#8A5A00" />
                    <Text style={styles.completedBannerText}>Completed</Text>
                  </View>
                ) : null}

                <View style={[styles.tripCard, cardShadowStyle, isCompactPhone && styles.tripCardNarrow]}>
                  <TripCoverImage
                    uri={trip.coverImageUrl}
                    fallback={tripPreviewImage}
                    style={[styles.tripImage, isPhone && styles.tripImagePhone]}
                  />

                  <View style={[styles.tripCardBody, isCompactPhone && styles.tripCardBodyNarrow]}>
                    <View style={styles.tripDetailsColumn}>
                      <View style={styles.tripTitleRow}>
                        {viewMode === "plan" ? (
                          <DimPressable
                            accessibilityRole="button"
                            accessibilityLabel={`Switch trips, current ${trip.title}`}
                            onPress={openTripSwitcher}
                            style={styles.tripTitleButton}
                          >
                            <Text
                              numberOfLines={1}
                              style={[styles.tripTitle, isPhone && styles.tripTitlePhone]}
                            >
                              {trip.title}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#14253E" />
                          </DimPressable>
                        ) : (
                          <Text numberOfLines={1} style={[styles.tripTitle, isPhone && styles.tripTitlePhone]}>
                            {trip.title}
                          </Text>
                        )}
                        <Ionicons name="sparkles" size={isPhone ? 14 : 16} color="#F5A623" />
                        {viewMode === "plan" ? (
                          <DimPressable
                            accessibilityRole="button"
                            accessibilityLabel={
                              isPlanFavorited
                                ? `Remove ${trip.title} from favorites`
                                : `Save ${trip.title} to favorites`
                            }
                            accessibilityState={{ disabled: isFavoritePending }}
                            disabled={isFavoritePending}
                            onPress={togglePlanFavorite}
                            style={styles.tripFavoriteButton}
                          >
                            <Ionicons
                              name={isPlanFavorited ? "heart" : "heart-outline"}
                              size={18}
                              color={isPlanFavorited ? "#FF5A4E" : "#14253E"}
                            />
                          </DimPressable>
                        ) : null}
                      </View>

                      <View style={styles.tripMetaRow}>
                        <Ionicons name="location" size={isPhone ? 13 : 15} color="#2463EB" />
                        <Text
                          numberOfLines={1}
                          style={[styles.tripMetaText, isPhone && styles.tripMetaTextPhone]}
                        >
                          {trip.destination}
                        </Text>
                      </View>

                      <View style={styles.tripMetaRow}>
                        <Ionicons name="calendar-outline" size={isPhone ? 13 : 15} color="#2463EB" />
                        <Text
                          numberOfLines={1}
                          style={[styles.tripMetaText, isPhone && styles.tripMetaTextPhone]}
                        >
                          {trip.dates}
                          {trip.nights ? ` • ${trip.nights}` : ""}
                        </Text>
                      </View>

                      {trip.hotelName ? (
                        <View style={styles.tripMetaRow}>
                          <Ionicons name="bed-outline" size={isPhone ? 13 : 15} color="#2463EB" />
                          <Text
                            numberOfLines={1}
                            style={[styles.tripMetaText, isPhone && styles.tripMetaTextPhone]}
                          >
                            {trip.hotelName}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.tripCardActions, isCompactPhone && styles.tripCardActionsNarrow]}>
                      {viewMode === "plan" ? (
                        <PillButton
                          label="My trips"
                          iconName="list-outline"
                          onPress={openTripSwitcher}
                          outlined
                          compact
                          accessibilityLabel="Open trip switcher"
                          style={styles.editTripButton}
                        />
                      ) : null}
                      <PillButton
                        label="Edit Trip"
                        iconName="pencil-outline"
                        onPress={openTripEditor}
                        outlined
                        compact
                        style={styles.editTripButton}
                      />
                    </View>
                  </View>
                </View>

                {selectedDay ? (
                  <>
                    <View style={[styles.selectorRow, isCompactPhone && styles.selectorRowNarrow]}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsScroller}
                        contentContainerStyle={styles.tabsRow}
                      >
                        {days.map((day) => (
                          <GradientTab
                            key={day.id}
                            day={day}
                            compact={isPhone}
                            active={day.id === selectedDay.id}
                            onPress={() => setSelectedDayId(day.id)}
                          />
                        ))}
                      </ScrollView>

                      <PillButton
                        label="View Map"
                        iconName="map-outline"
                        onPress={openDayRoute}
                        outlined
                        compact
                        style={[styles.viewMapButton, isCompactPhone && styles.viewMapButtonNarrow]}
                      />
                    </View>

                    <View style={[styles.itineraryCard, cardShadowStyle]}>
                      <View style={[styles.itineraryHeader, isPhone && styles.itineraryHeaderPhone]}>
                        <View style={styles.headerGradientFill} />
                        <View style={styles.headerGradientBubbleLarge} />
                        <View style={styles.headerGradientBubbleSmall} />

                        <View style={styles.itineraryHeaderCopy}>
                          <Text
                            numberOfLines={1}
                            style={[styles.itineraryHeaderTitle, isPhone && styles.itineraryHeaderTitlePhone]}
                          >
                            {selectedDay.label} <Text style={styles.itineraryHeaderDot}>•</Text>{" "}
                            {selectedDay.fullDate}
                          </Text>
                          <View style={styles.weatherRow}>
                            <Ionicons name={selectedDay.weather.icon} size={isPhone ? 14 : 16} color="#FDBB2C" />
                            <Text style={[styles.weatherText, isPhone && styles.weatherTextPhone]}>
                              {selectedDay.weather.label} <Text style={styles.weatherDot}>•</Text>{" "}
                              {selectedDay.weather.temperature}
                            </Text>
                          </View>
                        </View>

                        <PillButton
                          label="Add Activity"
                          iconName="add"
                          onPress={openAddActivity}
                          compact
                          style={[styles.addActivityButton, isPhone && styles.addActivityButtonPhone]}
                        />
                      </View>

                      <View style={styles.activitiesList}>
                        {sortedActivities(selectedDay.activities).map((activity, index, activities) => (
                          <ActivityRow
                            key={activity.id}
                            activity={activity}
                            compact={isPhone}
                            isFirst={index === 0}
                            isLast={index === activities.length - 1}
                            onOpenDetails={() => openDetails(activity)}
                            onOpenMap={() => openActivityMapPress(activity)}
                            onDelete={canDeleteActivity(activity) ? () => deleteCustomActivity(activity) : undefined}
                          />
                        ))}
                      </View>
                    </View>
                  </>
                ) : null}

                <TipCard onPress={() => setTipsVisible(true)} compact={isPhone} />
              </>
            ) : null}
          </View>
        </ScrollView>

        <BottomNav activeLabel="Itinerary" onNavigate={onNavigate} />
      </View>

      <ModalShell
        visible={isCreateTripVisible}
        title="Create Trip"
        subtitle="Set the basics. Days are seeded on the server."
        onClose={() => setIsCreateTripVisible(false)}
        footer={
          <>
            <FooterButton label="Cancel" onPress={() => setIsCreateTripVisible(false)} />
            <FooterButton
              label={isSavingTrip ? "Creating…" : "Create Trip"}
              primary
              onPress={saveCreateTrip}
            />
          </>
        }
      >
        {createDraftError ? <Text style={styles.formErrorText}>{createDraftError}</Text> : null}
        <Field
          label="Trip Title"
          value={createDraft.title}
          onChangeText={(value) => setCreateDraft((current) => ({ ...current, title: value }))}
          placeholder="Los Angeles Trip"
        />
        <DestinationSuggestField
          label="Destination"
          value={createDraft.destination}
          selectedLabel={createDraft.selectedDestination?.label || null}
          onChangeText={(value) =>
            setCreateDraft((current) => ({
              ...current,
              destination: value,
              selectedDestination: null,
            }))
          }
          onSelectSuggestion={(suggestion) =>
            setCreateDraft((current) => ({
              ...current,
              destination: suggestion?.label || current.destination,
              selectedDestination: suggestion,
            }))
          }
          placeholder="Start typing a city or country"
        />
        <Field
          label="Start Date (YYYY-MM-DD)"
          value={createDraft.startDate}
          onChangeText={(value) => setCreateDraft((current) => ({ ...current, startDate: value }))}
          placeholder="2026-07-12"
        />
        <Field
          label="End Date (YYYY-MM-DD)"
          value={createDraft.endDate}
          onChangeText={(value) => setCreateDraft((current) => ({ ...current, endDate: value }))}
          placeholder="2026-07-15"
        />
        <StaticField label="Nights (display only)" value={createNightsPreview} />
        <Field
          label="Hotel Name (Optional)"
          value={createDraft.hotelName}
          onChangeText={(value) => setCreateDraft((current) => ({ ...current, hotelName: value }))}
          placeholder="Hotel Figueroa"
        />
        <Field
          label="Hotel Provider ID (Optional)"
          value={createDraft.hotelProviderId}
          onChangeText={(value) => setCreateDraft((current) => ({ ...current, hotelProviderId: value }))}
          placeholder="liteapi hotel id"
        />
      </ModalShell>

      <ModalShell
        visible={editTripVisible}
        title="Edit Trip"
        subtitle={
          viewMode === "demo"
            ? "Local demo edits only — nothing is saved to your account."
            : "Update the trip summary. Nights are calculated from your dates."
        }
        onClose={() => setEditTripVisible(false)}
        footer={
          <>
            <FooterButton label="Cancel" onPress={() => setEditTripVisible(false)} />
            <FooterButton
              label={isSavingTrip ? "Saving…" : "Save Changes"}
              primary
              onPress={saveTripEdits}
            />
          </>
        }
      >
        {tripDraftError ? <Text style={styles.formErrorText}>{tripDraftError}</Text> : null}
        <Field
          label="Trip Title"
          value={tripDraft.title}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, title: value }))}
          placeholder="Los Angeles Trip"
        />
        <DestinationSuggestField
          label="Destination"
          value={tripDraft.destination}
          selectedLabel={tripDraft.selectedDestination?.label || null}
          onChangeText={(value) =>
            setTripDraft((current) => ({
              ...current,
              destination: value,
              selectedDestination: null,
            }))
          }
          onSelectSuggestion={(suggestion) =>
            setTripDraft((current) => ({
              ...current,
              destination: suggestion?.label || current.destination,
              selectedDestination: suggestion,
            }))
          }
          placeholder="Start typing a city or country"
        />
        <Field
          label="Start Date (YYYY-MM-DD)"
          value={tripDraft.startDate}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, startDate: value }))}
          placeholder="2026-07-12"
        />
        <Field
          label="End Date (YYYY-MM-DD)"
          value={tripDraft.endDate}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, endDate: value }))}
          placeholder="2026-07-15"
        />
        <StaticField label="Nights (display only)" value={editNightsPreview} />
        <Field
          label="Hotel Name"
          value={tripDraft.hotelName}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, hotelName: value }))}
          placeholder="Hotel Figueroa"
        />
        <Field
          label="Hotel Provider ID (Optional)"
          value={tripDraft.hotelProviderId}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, hotelProviderId: value }))}
          placeholder="liteapi hotel id"
        />
      </ModalShell>

      <ModalShell
        visible={addActivityVisible}
        title="Add Activity"
        subtitle={selectedDay ? `Add a stop to ${selectedDay.label}.` : "Add a stop to the timeline."}
        onClose={() => setAddActivityVisible(false)}
        footer={
          <>
            <FooterButton label="Cancel" onPress={() => setAddActivityVisible(false)} />
            <FooterButton
              label={isSavingActivity ? "Adding…" : "Add Activity"}
              primary
              onPress={saveActivity}
            />
          </>
        }
      >
        {activityDraftError ? <Text style={styles.formErrorText}>{activityDraftError}</Text> : null}
        <Field
          label="Time"
          value={activityDraft.time}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, time: value }))}
          placeholder="12:00 PM"
        />
        <Field
          label="Activity Title"
          value={activityDraft.title}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, title: value }))}
          placeholder="Lunch reservation"
        />
        <Field
          label="Location"
          value={activityDraft.location}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, location: value }))}
          placeholder="Santa Monica"
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {activityCategories.map((category) => (
              <CategoryChip
                key={category.key}
                category={category}
                selected={activityDraft.category === category.key}
                onPress={() => setActivityDraft((current) => ({ ...current, category: category.key }))}
              />
            ))}
          </View>
        </View>

        <Field
          label="Badge Text (Optional)"
          value={activityDraft.tag}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, tag: value }))}
          placeholder="Recommended by Wayfinder"
        />
      </ModalShell>

      <ModalShell
        visible={Boolean(selectedActivity)}
        title={selectedActivity?.title || "Activity"}
        subtitle={
          selectedActivity ? `${selectedActivity.time} • ${selectedActivity.location} • ${selectedActivity.distance}` : ""
        }
        onClose={closeDetails}
        footer={
          <>
            {selectedActivity && canDeleteActivity(selectedActivity) ? (
              <FooterButton label="Delete" onPress={() => deleteCustomActivity(selectedActivity)} />
            ) : (
              <FooterButton label="Close" onPress={closeDetails} />
            )}
            <FooterButton
              label="Open in Maps"
              primary
              onPress={() => (selectedActivity ? openActivityMapPress(selectedActivity) : undefined)}
            />
          </>
        }
      >
        {selectedActivity ? (
          <View style={styles.detailsModalCard}>
            <View
              style={[styles.detailsModalIcon, { backgroundColor: selectedActivity.iconBackground }]}
            >
              {renderIcon(selectedActivity.iconLibrary, selectedActivity.iconName, 28, "#FFFFFF")}
            </View>

            <View style={styles.detailsModalCopy}>
              <Text style={styles.detailsModalTitle}>{selectedActivity.title}</Text>
              <View style={styles.detailsModalRow}>
                <Ionicons name="location" size={16} color="#2463EB" />
                <Text style={styles.detailsModalText}>{selectedActivity.location}</Text>
              </View>
              <View style={styles.detailsModalRow}>
                <Ionicons name="time-outline" size={16} color="#2463EB" />
                <Text style={styles.detailsModalText}>{selectedActivity.time}</Text>
              </View>
              <TagBadge tag={selectedActivity.tag} />
            </View>
          </View>
        ) : null}
      </ModalShell>

      <ModalShell
        visible={tipsVisible}
        title="Wayfinder Tips"
        subtitle="Helpful notes for this itinerary."
        onClose={() => setTipsVisible(false)}
        footer={
          <>
            <FooterButton label="Close" onPress={() => setTipsVisible(false)} />
            <FooterButton
              label="Travel Check"
              primary
              onPress={() => {
                setTipsVisible(false);
                onNavigate?.("travelCheck", { destination: trip?.destination || "Los Angeles" });
              }}
            />
          </>
        }
      >
        {itineraryTips.map((tip) => (
          <View key={tip} style={styles.tipListItem}>
            <Ionicons name="sparkles" size={15} color="#2463EB" />
            <Text style={styles.tipListText}>{tip}</Text>
          </View>
        ))}
      </ModalShell>

      <TripSwitcherSheet
        visible={switcherVisible}
        currentPlanId={planId}
        activePlans={activePlans}
        pastPlans={pastPlans}
        loading={switcherLoading}
        error={switcherError}
        onClose={closeTripSwitcher}
        onCreateTrip={handleCreateFromSwitcher}
        onSelectPlan={handleSelectPlan}
        onCompletePlan={handleCompletePlan}
        onReopenPlan={handleReopenPlan}
        onDeletePlan={handleDeletePlan}
        onRetry={refreshPlanLists}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F7FF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F3F7FF",
    overflow: "hidden",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  page: {
    width: "100%",
    position: "relative",
  },

  pageGlowBottom: {
    position: "absolute",
    right: -42,
    bottom: 120,
    width: 214,
    height: 214,
    borderRadius: 107,
    backgroundColor: "rgba(156, 199, 255, 0.18)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  roundHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerActionButton: {
    width: 44,
    height: 44,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF7A26",
  },

  noticeBanner: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#D1E0FB",
  },

  noticeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1849A9",
  },

  errorBanner: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255, 241, 232, 0.95)",
    borderWidth: 1,
    borderColor: "#FDC6A5",
  },

  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#9A3412",
  },

  demoBanner: {
    marginBottom: 10,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(234, 242, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#D1E0FB",
  },

  demoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    color: "#1849A9",
  },

  completedBanner: {
    marginBottom: 10,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFF6E0",
    borderWidth: 1,
    borderColor: "#F0D79A",
  },

  completedBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#8A5A00",
  },

  loadingBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 14,
  },

  loadingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#51607D",
  },

  emptyCard: {
    padding: 24,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE8F8",
    marginTop: 4,
    marginBottom: 24,
    gap: 12,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16284A",
  },

  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#51607D",
  },

  emptyActions: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  heroSection: {
    marginTop: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    overflow: "visible",
  },

  heroCopyColumn: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 4,
    paddingRight: 4,
    zIndex: 2,
  },

  heroTitle: {
    flexShrink: 1,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: "#10213B",
  },

  heroSubtitle: {
    marginTop: 4,
    color: "#51607D",
  },

  heroSubtitleAccent: {
    color: "#2463EB",
    fontWeight: "700",
  },

  heroArtworkWrap: {
    flexShrink: 0,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    overflow: "visible",
    zIndex: 1,
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE8F8",
    marginBottom: 14,
  },

  tripCardNarrow: {
    alignItems: "flex-start",
    padding: 10,
    gap: 10,
  },

  tripImage: {
    width: 118,
    height: 72,
    borderRadius: 12,
  },

  tripImagePhone: {
    width: 88,
    height: 58,
    borderRadius: 10,
  },

  tripCardBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tripCardBodyNarrow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },

  tripDetailsColumn: {
    flex: 1,
    minWidth: 0,
  },

  tripTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 6,
  },

  tripTitleButton: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "78%",
  },

  tripFavoriteButton: {
    marginLeft: "auto",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  tripTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#16284A",
  },

  tripTitlePhone: {
    fontSize: 15,
  },

  tripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  tripMetaText: {
    marginLeft: 6,
    fontSize: 13.5,
    lineHeight: 18,
    color: "#445574",
    fontWeight: "500",
    flexShrink: 1,
  },

  tripMetaTextPhone: {
    fontSize: 12,
    lineHeight: 16,
  },

  tripMetaDot: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#B7C1D0",
  },

  tripMetaDotPhone: {
    marginHorizontal: 6,
    fontSize: 12,
  },

  editTripButton: {
    alignSelf: "center",
    flexShrink: 0,
  },

  tripCardActions: {
    alignSelf: "center",
    flexShrink: 0,
    alignItems: "stretch",
    gap: 6,
  },

  tripCardActionsNarrow: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  selectorRowNarrow: {
    flexWrap: "wrap",
    alignItems: "center",
  },

  tabsScroller: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  tabsRow: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 2,
    alignItems: "center",
  },

  dayTab: {
    width: 84,
    minHeight: 52,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EAF6",
    shadowColor: "#B0BED6",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },

  dayTabCompact: {
    width: 72,
    minHeight: 44,
    paddingVertical: 6,
    borderRadius: 14,
  },

  dayTabActive: {
    backgroundColor: "#2463EB",
    borderColor: "#2463EB",
  },

  activeTabGlowLarge: {
    position: "absolute",
    right: -12,
    top: -18,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },

  activeTabGlowSmall: {
    position: "absolute",
    left: 8,
    bottom: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  dayTabTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16284A",
  },

  dayTabTitleCompact: {
    fontSize: 13,
  },

  dayTabTitleActive: {
    color: "#FFFFFF",
  },

  dayTabDate: {
    marginTop: 2,
    fontSize: 12,
    color: "#5F6F8A",
    fontWeight: "500",
  },

  dayTabDateCompact: {
    fontSize: 11,
  },

  dayTabDateActive: {
    color: "rgba(255, 255, 255, 0.95)",
  },

  viewMapButton: {
    flexShrink: 0,
  },

  viewMapButtonNarrow: {
    marginLeft: "auto",
  },

  pillButton: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  pillButtonSolid: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#C0D2EE",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  pillButtonOutlined: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFE0FF",
  },

  pillButtonCompact: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },

  pillButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2463EB",
  },

  pillButtonTextCompact: {
    fontSize: 12,
  },

  itineraryCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE8F8",
    marginBottom: 14,
  },

  itineraryHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    position: "relative",
    overflow: "hidden",
  },

  itineraryHeaderPhone: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  headerGradientFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#5A8CF7",
  },

  headerGradientBubbleLarge: {
    position: "absolute",
    right: -30,
    top: -34,
    width: 200,
    height: 150,
    borderRadius: 95,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },

  headerGradientBubbleSmall: {
    position: "absolute",
    left: 140,
    top: -40,
    width: 160,
    height: 140,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },

  itineraryHeaderCopy: {
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  itineraryHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  itineraryHeaderTitlePhone: {
    fontSize: 14,
  },

  itineraryHeaderDot: {
    color: "rgba(255, 255, 255, 0.92)",
  },

  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  weatherText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  weatherTextPhone: {
    fontSize: 12,
  },

  weatherDot: {
    color: "rgba(255, 255, 255, 0.92)",
  },

  addActivityButton: {
    zIndex: 1,
    flexShrink: 0,
  },

  addActivityButtonPhone: {
    maxWidth: 118,
  },

  activitiesList: {
    backgroundColor: "#FFFFFF",
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6EDF8",
    minHeight: 72,
  },

  activityRowCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 62,
  },

  activityRowFirst: {
    borderTopWidth: 0,
  },

  timeColumn: {
    width: 62,
    alignSelf: "stretch",
    justifyContent: "flex-start",
    paddingTop: 2,
  },

  timeColumnCompact: {
    width: 54,
  },

  timeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#16284A",
  },

  timeTextCompact: {
    fontSize: 12,
  },

  timelineColumn: {
    width: 14,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },

  timelineColumnCompact: {
    width: 12,
  },

  timelineSegment: {
    flex: 1,
    width: 2,
    backgroundColor: "#DBE5F5",
  },

  timelineSegmentHidden: {
    opacity: 0,
  },

  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: "#FFFFFF",
    marginVertical: 2,
  },

  timelineMarkerCompact: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },

  iconColumn: {
    width: 44,
    alignItems: "center",
  },

  iconColumnCompact: {
    width: 38,
  },

  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  activityIconCircleCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  detailsColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  detailsColumnCompact: {
    paddingRight: 6,
  },

  activityTitle: {
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: "800",
    color: "#16284A",
    letterSpacing: -0.2,
  },

  activityTitleCompact: {
    fontSize: 13,
    lineHeight: 16,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  locationText: {
    marginLeft: 4,
    fontSize: 12.5,
    color: "#4B5D7A",
    flexShrink: 1,
  },

  locationTextCompact: {
    fontSize: 11.5,
  },

  tagBadge: {
    marginTop: 5,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  tagBadgeCompact: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },

  tagBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },

  tagBadgeTextCompact: {
    fontSize: 10,
    lineHeight: 13,
  },

  routeActionColumn: {
    width: 68,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },

  routeActionColumnCompact: {
    width: 58,
  },

  routeActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    minHeight: 32,
  },

  distanceText: {
    fontSize: 12.5,
    color: "#3E4D68",
    fontWeight: "500",
  },

  distanceTextCompact: {
    fontSize: 11,
  },

  deleteActivityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E9",
  },

  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#D2E0FA",
    columnGap: 10,
    marginBottom: 4,
  },

  tipCardCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    columnGap: 8,
    borderRadius: 14,
  },

  tipRobotImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  tipRobotImageCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  tipCopyColumn: {
    flex: 1,
    minWidth: 0,
  },

  tipHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16284A",
  },

  tipHeadingCompact: {
    fontSize: 13,
  },

  tipSpark: {
    color: "#F5A623",
  },

  tipBody: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 17,
    color: "#354968",
  },

  tipBodyCompact: {
    fontSize: 12,
    lineHeight: 16,
  },

  tipLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 6,
    flexShrink: 0,
    minHeight: 32,
  },

  tipLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2463EB",
  },

  tipLinkTextCompact: {
    fontSize: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 20, 37, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "100%",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EEF8",
  },

  modalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#16284A",
  },

  modalSubtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: "#627089",
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F7FF",
  },

  modalBody: {
    maxHeight: 420,
  },

  modalBodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },

  modalFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#E8EEF8",
  },

  footerButton: {
    flexGrow: 1,
    minWidth: 140,
    minHeight: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#F3F7FF",
    borderWidth: 1,
    borderColor: "#D8E2F3",
  },

  footerButtonPrimary: {
    backgroundColor: "#2463EB",
    borderColor: "#2463EB",
  },

  footerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#203558",
  },

  footerButtonTextPrimary: {
    color: "#FFFFFF",
  },

  fieldGroup: {
    gap: 8,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#203558",
  },

  fieldInput: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D6E1F3",
    backgroundColor: "#F8FBFF",
    fontSize: 15,
    color: "#16284A",
  },

  readOnlyField: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#D6E1F3",
    backgroundColor: "#F1F5FC",
    fontSize: 15,
    fontWeight: "600",
    color: "#51607D",
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F4F8FF",
    borderWidth: 1,
    borderColor: "#D6E1F3",
  },

  categoryChipSelected: {
    backgroundColor: "#2463EB",
    borderColor: "#2463EB",
  },

  categoryIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#203558",
  },

  categoryChipTextSelected: {
    color: "#FFFFFF",
  },

  formErrorText: {
    marginBottom: 2,
    fontSize: 14,
    fontWeight: "700",
    color: "#E11D48",
  },

  detailsModalCard: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#DBE6F6",
  },

  detailsModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsModalCopy: {
    flex: 1,
    minWidth: 0,
  },

  detailsModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16284A",
  },

  detailsModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 9,
  },

  detailsModalText: {
    fontSize: 15,
    color: "#445574",
  },

  tipListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#DBE6F6",
  },

  tipListText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#445574",
  },
});
