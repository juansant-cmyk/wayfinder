import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import { getToken } from "../src/auth/tokenStorage";
import { formatDateRange, formatNights, mapPlanDetail } from "../src/itinerary/mapPlan";
import { useUserLocation } from "../src/location/UserLocationContext";
import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
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

const activityCategories = {
  cafe: {
    iconLibrary: "ionicons",
    iconName: "cafe-outline",
    iconBackground: "#2066F5",
    markerColor: "#2066F5",
    tagBackgroundColor: "#EAF2FF",
    tagTextColor: "#245BE2",
  },
  photo: {
    iconLibrary: "ionicons",
    iconName: "camera-outline",
    iconBackground: "#FF6D1F",
    markerColor: "#FF6D1F",
    tagBackgroundColor: "#FFF1E4",
    tagTextColor: "#E87424",
  },
  food: {
    iconLibrary: "ionicons",
    iconName: "restaurant-outline",
    iconBackground: "#30B45C",
    markerColor: "#30B45C",
    tagBackgroundColor: "#EAF9F0",
    tagTextColor: "#16974B",
  },
  museum: {
    iconLibrary: "material",
    iconName: "bank-outline",
    iconBackground: "#7A56EC",
    markerColor: "#7A56EC",
    tagBackgroundColor: "#F1EBFF",
    tagTextColor: "#6A48D7",
  },
  sunset: {
    iconLibrary: "ionicons",
    iconName: "sunny-outline",
    iconBackground: "#EA4A90",
    markerColor: "#EA4A90",
    tagBackgroundColor: "#FFE8F1",
    tagTextColor: "#E1477E",
  },
  dinner: {
    iconLibrary: "ionicons",
    iconName: "wine-outline",
    iconBackground: "#FDB92B",
    markerColor: "#FDB92B",
    tagBackgroundColor: "#FFF4D6",
    tagTextColor: "#D28B03",
  },
  travel: {
    iconLibrary: "ionicons",
    iconName: "airplane-outline",
    iconBackground: "#1F78FF",
    markerColor: "#1F78FF",
    tagBackgroundColor: "#EAF2FF",
    tagTextColor: "#245BE2",
  },
};

const initialDays = [
  {
    id: "day1",
    label: "Day 1",
    shortDate: "Jul 12",
    fullDate: "Saturday, Jul 12",
    weather: {
      iconName: "sunny",
      label: "Sunny",
      temperature: "78°F",
    },
    activities: [
      {
        id: "breakfast",
        time: "9:00 AM",
        title: "Breakfast at Urth Caffé",
        location: "Santa Monica",
        distance: "2.1 mi",
        category: "cafe",
        tag: "Recommended by Wayfinder",
      },
      {
        id: "pier",
        time: "11:00 AM",
        title: "Santa Monica Pier",
        location: "Santa Monica",
        distance: "2.4 mi",
        category: "photo",
        tag: "Photo spot",
      },
      {
        id: "lunch",
        time: "1:30 PM",
        title: "Lunch at The Albright",
        location: "Santa Monica",
        distance: "0.8 mi",
        category: "food",
        tag: "",
      },
      {
        id: "getty",
        time: "3:30 PM",
        title: "The Getty Center",
        location: "Brentwood",
        distance: "6.3 mi",
        category: "museum",
        tag: "Reserve tickets online",
      },
      {
        id: "griffith",
        time: "7:00 PM",
        title: "Sunset at Griffith Observatory",
        location: "Los Feliz",
        distance: "7.9 mi",
        category: "sunset",
        tag: "Best sunset in LA",
      },
      {
        id: "dinner",
        time: "9:00 PM",
        title: "Dinner in Downtown LA",
        location: "Downtown LA",
        distance: "5.2 mi",
        category: "dinner",
        tag: "",
      },
    ],
  },
  {
    id: "day2",
    label: "Day 2",
    shortDate: "Jul 13",
    fullDate: "Sunday, Jul 13",
    weather: {
      iconName: "partly-sunny",
      label: "Warm",
      temperature: "80°F",
    },
    activities: [
      {
        id: "venice-coffee",
        time: "8:30 AM",
        title: "Coffee in Venice",
        location: "Venice Beach",
        distance: "3.4 mi",
        category: "cafe",
        tag: "",
      },
      {
        id: "venice-walk",
        time: "10:00 AM",
        title: "Venice Canals Walk",
        location: "Venice",
        distance: "0.6 mi",
        category: "travel",
        tag: "Slow morning",
      },
      {
        id: "abbot-kinney",
        time: "1:00 PM",
        title: "Lunch on Abbot Kinney",
        location: "Venice",
        distance: "1.2 mi",
        category: "food",
        tag: "",
      },
    ],
  },
  {
    id: "day3",
    label: "Day 3",
    shortDate: "Jul 14",
    fullDate: "Monday, Jul 14",
    weather: {
      iconName: "sunny",
      label: "Clear",
      temperature: "76°F",
    },
    activities: [
      {
        id: "runyon",
        time: "7:30 AM",
        title: "Runyon Canyon Hike",
        location: "Hollywood Hills",
        distance: "4.8 mi",
        category: "travel",
        tag: "Morning views",
      },
      {
        id: "museum",
        time: "2:00 PM",
        title: "Academy Museum",
        location: "Miracle Mile",
        distance: "5.1 mi",
        category: "museum",
        tag: "",
      },
    ],
  },
  {
    id: "day4",
    label: "Day 4",
    shortDate: "Jul 15",
    fullDate: "Tuesday, Jul 15",
    weather: {
      iconName: "sunny",
      label: "Bright",
      temperature: "75°F",
    },
    activities: [
      {
        id: "broad",
        time: "11:30 AM",
        title: "The Broad",
        location: "Downtown LA",
        distance: "1.1 mi",
        category: "museum",
        tag: "",
      },
      {
        id: "transfer",
        time: "5:30 PM",
        title: "Airport Transfer",
        location: "LAX",
        distance: "11.2 mi",
        category: "travel",
        tag: "Leave early for traffic",
      },
    ],
  },
];

const itineraryTips = [
  "Consider using rideshare or public transit to avoid parking and traffic.",
  "The Getty Center is easiest with a timed ticket and a little extra arrival time.",
  "Griffith Observatory gets busier close to sunset, so arriving early helps.",
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

function categoryFor(activity) {
  return activityCategories[activity.category] || activityCategories.food;
}

function parseTime(value) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

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

async function openUrl(url) {
  await Linking.openURL(url);
}

function HeaderActionButton({
  iconName,
  iconSize = 28,
  accessibilityLabel,
  onPress,
  showDot = false,
}) {
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

function PillButton({
  label,
  iconName,
  onPress,
  outlined = false,
  compact = false,
  style,
}) {
  const Button = outlined ? DimPressable : Pressable;

  return (
    <Button
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.pillButton,
        outlined ? styles.pillButtonOutlined : styles.pillButtonSolid,
        compact && styles.pillButtonCompact,
        style,
      ]}
    >
      <Ionicons name={iconName} size={compact ? 18 : 20} color="#2463EB" />
      <Text style={[styles.pillButtonText, compact && styles.pillButtonTextCompact]}>
        {label}
      </Text>
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
      <Pressable onPress={onPress} style={[styles.dayTab, compact && styles.dayTabCompact, styles.dayTabActive]}>
        {content}
      </Pressable>
    );
  }

  return (
    <DimPressable onPress={onPress} style={[styles.dayTab, compact && styles.dayTabCompact]}>
      {content}
    </DimPressable>
  );
}

function TagBadge({ activity, compact = false }) {
  if (!activity.tag) {
    return null;
  }

  const category = categoryFor(activity);

  return (
    <View
      style={[
        styles.tagBadge,
        compact && styles.tagBadgeCompact,
        { backgroundColor: category.tagBackgroundColor },
      ]}
    >
      <Ionicons name="sparkles" size={11} color={category.tagTextColor} />
      <Text
        numberOfLines={compact ? 2 : 1}
        style={[
          styles.tagBadgeText,
          compact && styles.tagBadgeTextCompact,
          { color: category.tagTextColor },
        ]}
      >
        {activity.tag}
      </Text>
    </View>
  );
}

function ActivityRow({
  activity,
  compact = false,
  isFirst,
  isLast,
  onOpenDetails,
  onOpenMap,
  onDelete,
}) {
  const category = categoryFor(activity);

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
            { borderColor: category.markerColor },
          ]}
        />
        <View style={[styles.timelineSegment, isLast && styles.timelineSegmentHidden]} />
      </View>

      <View style={[styles.iconColumn, compact && styles.iconColumnCompact]}>
        <View
          style={[
            styles.activityIconCircle,
            compact && styles.activityIconCircleCompact,
            { backgroundColor: category.iconBackground },
          ]}
        >
          {renderIcon(category.iconLibrary, category.iconName, compact ? 24 : 27, "#FFFFFF")}
        </View>
      </View>

      <Pressable style={[styles.detailsColumn, compact && styles.detailsColumnCompact]} onPress={onOpenDetails}>
        <Text numberOfLines={compact ? 3 : 2} style={[styles.activityTitle, compact && styles.activityTitleCompact]}>
          {activity.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={compact ? 13 : 14} color="#2463EB" />
          <Text numberOfLines={1} style={[styles.locationText, compact && styles.locationTextCompact]}>
            {activity.location}
          </Text>
        </View>
        <TagBadge activity={activity} compact={compact} />
      </Pressable>

      <Pressable onPress={onOpenMap} style={[styles.routeActionColumn, compact && styles.routeActionColumnCompact]}>
        <View style={styles.routeActionRow}>
          <Ionicons name="location" size={compact ? 15 : 17} color="#2463EB" />
          <Text style={[styles.distanceText, compact && styles.distanceTextCompact]}>
            {activity.distance}
          </Text>
          <Ionicons name="chevron-forward" size={compact ? 20 : 22} color="#627089" />
        </View>
      </Pressable>
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
        <Text style={[styles.tipBody, compact && styles.tipBodyCompact]}>
          Consider using rideshare or public transit to avoid parking and traffic.
        </Text>
      </View>
      <Pressable onPress={onPress} style={styles.tipLinkButton}>
        <Text numberOfLines={1} style={[styles.tipLinkText, compact && styles.tipLinkTextCompact]}>
          View Tips
        </Text>
        <Ionicons name="chevron-forward" size={compact ? 18 : 20} color="#2463EB" />
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
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
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

function Field({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A99B1"
        style={styles.fieldInput}
      />
    </View>
  );
}

function CategoryChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
    >
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FooterButton({ label, primary = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.footerButton, primary && styles.footerButtonPrimary]}
    >
      <Text style={[styles.footerButtonText, primary && styles.footerButtonTextPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createDraft(dayId) {
  return {
    dayId,
    time: "12:00 PM",
    title: "",
    location: "",
    distance: "1.0 mi",
    category: "food",
    tag: "",
  };
}

export default function ItineraryScreen({ onNavigate, onBack }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 520;
  const isCompactPhone = width < 400;
  const isHeroStacked = width < 760;
  const isHeroCompact = width < 460;
  const pageMaxWidth = width >= 1100 ? 1040 : 980;

  const [trip, setTrip] = useState(initialTrip);
  const [days, setDays] = useState(initialDays);
  const [selectedDayId, setSelectedDayId] = useState(initialDays[0].id);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [tipsVisible, setTipsVisible] = useState(false);
  const [editTripVisible, setEditTripVisible] = useState(false);
  const [addActivityVisible, setAddActivityVisible] = useState(false);
  const [tripDraft, setTripDraft] = useState(initialTrip);
  const [activityDraft, setActivityDraft] = useState(createDraft(initialDays[0].id));
  const [formError, setFormError] = useState("");

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) || days[0],
    [days, selectedDayId]
  );

  const startDemoItinerary = () => {
    skipApiLoadRef.current = true;
    setPlanId(null);
    setTrip({ ...DEMO_TRIP });
    setDays(DEMO_DAYS.map((day) => ({ ...day, activities: [...day.activities] })));
    setSelectedDayId(DEMO_DAYS[0].id);
    setViewMode("demo");
    setLoadError("");
    setNotice("Demo itinerary loaded locally — not saved.");
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
        destination_name: destination,
        start_date: startDate,
        end_date: endDate,
      };
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
    setTripDraft(trip);
    setFormError("");
    setEditTripVisible(true);
  };

  const saveTrip = () => {
    if (!tripDraft.title.trim() || !tripDraft.destination.trim() || !tripDraft.dates.trim()) {
      setFormError("Complete the trip details before saving.");
      return;
    }

    setTrip({
      title: tripDraft.title.trim(),
      destination: tripDraft.destination.trim(),
      dates: tripDraft.dates.trim(),
      nights: tripDraft.nights.trim() || trip.nights,
    });
    setEditTripVisible(false);
    setFormError("");
  };

  const openAddActivity = () => {
    setActivityDraft(createDraft(selectedDay.id));
    setFormError("");
    setAddActivityVisible(true);
  };

  const saveActivity = () => {
    if (!activityDraft.time.trim() || !activityDraft.title.trim() || !activityDraft.location.trim()) {
      setFormError("Add a time, title, and location before saving.");
      return;
    }

    const nextActivity = {
      id: `activity-${Date.now()}`,
      time: activityDraft.time.trim(),
      title: activityDraft.title.trim(),
      location: activityDraft.location.trim(),
      distance: activityDraft.distance.trim() || "1.0 mi",
      category: activityDraft.category,
      tag: activityDraft.tag.trim(),
    };

    setDays((currentDays) =>
      currentDays.map((day) =>
        day.id === selectedDay.id
          ? { ...day, activities: sortedActivities([...day.activities, nextActivity]) }
          : day
      )
    );

    setAddActivityVisible(false);
    setFormError("");
  };

  const openDetails = (activity) => {
    setSelectedActivity(activity);
  };

  const editNightsPreview = formatNights(nightsFromDates(tripDraft.startDate, tripDraft.endDate));
  const createNightsPreview = formatNights(
    nightsFromDates(createDraft.startDate, createDraft.endDate)
  );
  const showTripContent = viewMode === "plan" || viewMode === "demo";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: BOTTOM_NAV_CONTENT_PADDING + 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, { maxWidth: pageMaxWidth }]}>
            <View style={styles.pageGlowTop} />
            <View style={styles.pageGlowBottom} />

            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onBack || (() => onNavigate?.("home"))}
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
                <HeaderActionButton
                  iconName="notifications-outline"
                  iconSize={28}
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  showDot
                />
                <HeaderActionButton
                  iconName="person-circle-outline"
                  iconSize={33}
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                />
              </View>
            </View>

            <View style={[styles.heroSection, isHeroStacked && styles.heroSectionStacked]}>
              <View style={[styles.heroCopyColumn, isHeroStacked && styles.heroCopyColumnStacked]}>
                <Text style={[styles.heroTitle, isHeroCompact && styles.heroTitleCompact]}>
                  Itinerary
                </Text>
                <Text style={[styles.heroSubtitle, isHeroCompact && styles.heroSubtitleCompact]}>
                  Your trip, <Text style={styles.heroSubtitleAccent}>day by day.</Text>
                </Text>
              </View>

              <View style={[styles.heroArtworkWrap, isHeroStacked && styles.heroArtworkWrapStacked]}>
                <View style={styles.heroArtworkGlow} />
                <Image
                  source={heroArtworkImage}
                  resizeMode="cover"
                  style={styles.heroArtworkImage}
                />
              </View>
            </View>

            <View style={[styles.tripCard, cardShadowStyle, isPhone && styles.tripCardPhone]}>
              <Image
                source={tripPreviewImage}
                resizeMode="cover"
                style={[styles.tripImage, isPhone && styles.tripImagePhone]}
              />

              <View style={[styles.tripCardBody, isPhone && styles.tripCardBodyPhone]}>
                <View style={styles.tripDetailsColumn}>
                  <View style={styles.tripTitleRow}>
                    <Text
                      numberOfLines={2}
                      style={[styles.tripTitle, isPhone && styles.tripTitlePhone]}
                    >
                      {trip.title}
                    </Text>
                    <Ionicons name="sparkles" size={18} color="#F5A623" />
                  </View>

                  <View style={styles.tripMetaRow}>
                    <Ionicons name="location" size={18} color="#2463EB" />
                    <Text style={[styles.tripMetaText, isPhone && styles.tripMetaTextPhone]}>
                      {trip.destination}
                    </Text>
                  </View>

                  <View style={styles.tripMetaRow}>
                    <Ionicons name="calendar-outline" size={18} color="#2463EB" />
                    <Text style={[styles.tripMetaText, isPhone && styles.tripMetaTextPhone]}>
                      {trip.dates}
                    </Text>
                    <Text style={[styles.tripMetaDot, isPhone && styles.tripMetaDotPhone]}>•</Text>
                    <Text style={[styles.tripMetaText, isPhone && styles.tripMetaTextPhone]}>
                      {trip.nights}
                    </Text>
                  </View>
                </View>

                <PillButton
                  label="Edit Trip"
                  iconName="pencil-outline"
                  onPress={openTripEditor}
                  outlined
                  compact={isPhone}
                  style={[styles.editTripButton, isPhone && styles.editTripButtonPhone]}
                />
              </View>
            </View>

            <View style={[styles.selectorRow, isPhone && styles.selectorRowPhone]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.tabsScroller, isPhone && styles.tabsScrollerPhone]}
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
                onPress={() => openUrl(routeMapUrl(selectedDay, trip.destination))}
                outlined
                compact={isPhone}
                style={[styles.viewMapButton, isPhone && styles.viewMapButtonPhone]}
              />
            </View>

            <View style={[styles.itineraryCard, cardShadowStyle]}>
              <View style={[styles.itineraryHeader, isPhone && styles.itineraryHeaderPhone]}>
                <View style={styles.headerGradientFill} />
                <View style={styles.headerGradientBubbleLarge} />
                <View style={styles.headerGradientBubbleSmall} />

                <View style={[styles.itineraryHeaderCopy, isPhone && styles.itineraryHeaderCopyPhone]}>
                  <Text style={[styles.itineraryHeaderTitle, isPhone && styles.itineraryHeaderTitlePhone]}>
                    {selectedDay.label} <Text style={styles.itineraryHeaderDot}>•</Text>{" "}
                    {selectedDay.fullDate}
                  </Text>
                  <View style={styles.weatherRow}>
                    <Ionicons name={selectedDay.weather.iconName} size={19} color="#FDBB2C" />
                    <Text style={[styles.weatherText, isPhone && styles.weatherTextPhone]}>
                      {selectedDay.weather.label} <Text style={styles.weatherDot}>•</Text>{" "}
                      {selectedDay.weather.temperature}
                    </Text>
                  </View>

                <PillButton
                  label="Add Activity"
                  iconName="add"
                  onPress={openAddActivity}
                  compact={isPhone}
                  style={[styles.addActivityButton, isPhone && styles.addActivityButtonPhone]}
                />
              </View>

              <View style={styles.activitiesList}>
                {sortedActivities(selectedDay.activities).map((activity, index, activities) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    compact={isCompactPhone}
                    isFirst={index === 0}
                    isLast={index === activities.length - 1}
                    onOpenDetails={() => openDetails(activity)}
                    onOpenMap={() => openUrl(activityMapUrl(activity, trip.destination))}
                  />
                </View>

            <TipCard onPress={() => setTipsVisible(true)} compact={isPhone} />
          </View>
        </ScrollView>

        <BottomNav activeLabel="Itinerary" onNavigate={onNavigate} />
      </View>

      <ModalShell
        visible={editTripVisible}
        title="Edit Trip"
        subtitle="Update the summary card for this itinerary."
        onClose={() => setEditTripVisible(false)}
        footer={
          <>
            <FooterButton label="Cancel" onPress={() => setEditTripVisible(false)} />
            <FooterButton label="Save Changes" primary onPress={saveTrip} />
          </>
        }
      >
        {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
        <Field
          label="Trip Title"
          value={tripDraft.title}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, title: value }))}
          placeholder="Los Angeles Trip"
        />
        <Field
          label="Destination"
          value={tripDraft.destination}
          onChangeText={(value) =>
            setTripDraft((current) => ({ ...current, destination: value }))
          }
          placeholder="Los Angeles, California"
        />
        <Field
          label="Dates"
          value={tripDraft.dates}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, dates: value }))}
          placeholder="Jul 12 - Jul 15, 2025"
        />
        <Field
          label="Nights"
          value={tripDraft.nights}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, nights: value }))}
          placeholder="3 Nights"
        />
      </ModalShell>

      <ModalShell
        visible={addActivityVisible}
        title="Add Activity"
        subtitle={`Add a stop to ${selectedDay.label}.`}
        onClose={() => setAddActivityVisible(false)}
        footer={
          <>
            <FooterButton label="Cancel" onPress={() => setAddActivityVisible(false)} />
            <FooterButton label="Add Activity" primary onPress={saveActivity} />
          </>
        }
      >
        {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
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
          onChangeText={(value) =>
            setActivityDraft((current) => ({ ...current, location: value }))
          }
          placeholder="Santa Monica"
        />
        <Field
          label="Distance"
          value={activityDraft.distance}
          onChangeText={(value) =>
            setActivityDraft((current) => ({ ...current, distance: value }))
          }
          placeholder="1.0 mi"
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {[
              ["cafe", "Cafe"],
              ["photo", "Photo"],
              ["food", "Food"],
              ["museum", "Culture"],
              ["sunset", "Scenic"],
              ["travel", "Travel"],
            ].map(([key, label]) => (
              <CategoryChip
                key={key}
                label={label}
                selected={activityDraft.category === key}
                onPress={() =>
                  setActivityDraft((current) => ({ ...current, category: key }))
                }
              />
            ))}
          </View>
        </View>

        <Field
          label="Badge Text"
          value={activityDraft.tag}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, tag: value }))}
          placeholder="Recommended by Wayfinder"
        />
      </ModalShell>

      <ModalShell
        visible={Boolean(selectedActivity)}
        title={selectedActivity?.title || "Activity"}
        subtitle={
          selectedActivity
            ? `${selectedActivity.time} • ${selectedActivity.location} • ${selectedActivity.distance}`
            : ""
        }
        onClose={() => setSelectedActivity(null)}
        footer={
          <>
            <FooterButton label="Close" onPress={() => setSelectedActivity(null)} />
            <FooterButton
              label="Open in Maps"
              primary
              onPress={() =>
                selectedActivity
                  ? openUrl(activityMapUrl(selectedActivity, trip.destination))
                  : undefined
              }
            />
          </>
        }
      >
        {selectedActivity ? (
          <View style={styles.detailsModalCard}>
            <View
              style={[
                styles.detailsModalIcon,
                { backgroundColor: categoryFor(selectedActivity).iconBackground },
              ]}
            >
              {renderIcon(
                categoryFor(selectedActivity).iconLibrary,
                categoryFor(selectedActivity).iconName,
                28,
                "#FFFFFF"
              )}
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
              <TagBadge activity={selectedActivity} />
            </View>
          </View>
        ) : null}
      </ModalShell>

      <ModalShell
        visible={tipsVisible}
        title="Wayfinder Tips"
        subtitle="Helpful notes for this Los Angeles itinerary."
        onClose={() => setTipsVisible(false)}
        footer={
          <>
            <FooterButton label="Close" onPress={() => setTipsVisible(false)} />
            <FooterButton
              label="Travel Check"
              primary
              onPress={() => {
                setTipsVisible(false);
                onNavigate?.("travelCheck", { destination: trip.destination });
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
    paddingTop: 18,
  },

  page: {
    width: "100%",
    position: "relative",
  },

  pageGlowTop: {
    position: "absolute",
    top: 40,
    left: -40,
    width: 186,
    height: 186,
    borderRadius: 93,
    backgroundColor: "rgba(255, 222, 170, 0.16)",
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
    color: "#16284A",
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

  headerActionDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF7A26",
  },

  heroSection: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
  },

  heroSectionStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  heroCopyColumn: {
    flex: 1,
    minWidth: 230,
    maxWidth: 430,
    paddingTop: 6,
  },

  heroCopyColumnStacked: {
    width: "100%",
    minWidth: 0,
    maxWidth: 480,
  },

  heroTitle: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "800",
    letterSpacing: -2,
    color: "#10213B",
  },

  heroTitleCompact: {
    fontSize: 42,
    lineHeight: 46,
  },

  heroSubtitle: {
    marginTop: 14,
    maxWidth: 380,
    fontSize: 18,
    lineHeight: 30,
    color: "#51607D",
  },

  heroSubtitleCompact: {
    fontSize: 17,
    lineHeight: 28,
  },

  heroSubtitleAccent: {
    color: "#2463EB",
    fontWeight: "700",
  },

  heroArtworkWrap: {
    flex: 1,
    minWidth: 260,
    maxWidth: 430,
    height: 212,
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },

  heroArtworkWrapStacked: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: 1000,
    height: 196,
  },

  heroArtworkGlow: {
    position: "absolute",
    right: 26,
    bottom: 22,
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: "rgba(111, 170, 255, 0.14)",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },

  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE8F8",
    marginBottom: 20,
  },

  tripCardPhone: {
    alignItems: "flex-start",
  },

  tripImage: {
    width: 246,
    height: 132,
    borderRadius: 18,
  },

  tripImagePhone: {
    width: 104,
    height: 92,
  },

  tripCardBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  tripCardBodyPhone: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },

  tripDetailsColumn: {
    flex: 1,
    minWidth: 0,
  },

  tripTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 8,
  },

  tripTitle: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: "#16284A",
  },

  tripTitlePhone: {
    fontSize: 18,
  },

  tripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },

  tripMetaText: {
    marginLeft: 9,
    fontSize: 15.5,
    lineHeight: 22,
    color: "#445574",
    fontWeight: "500",
    flexShrink: 1,
  },

  tripMetaTextPhone: {
    fontSize: 13,
    lineHeight: 18,
  },

  tripMetaDot: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#B7C1D0",
  },

  tripMetaDotPhone: {
    marginHorizontal: 8,
    fontSize: 14,
  },

  editTripButton: {
    alignSelf: "center",
    flexShrink: 0,
  },

  editTripButtonPhone: {
    alignSelf: "flex-start",
  },

  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  selectorRowPhone: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },

  tabsScroller: {
    flex: 1,
    marginRight: 12,
  },

  tabsScrollerPhone: {
    width: "100%",
    marginRight: 0,
  },

  tabsRow: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 2,
  },

  dayTab: {
    width: 106,
    minHeight: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#B0BED6",
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },

  dayTabCompact: {
    width: 88,
    minHeight: 60,
    borderRadius: 18,
  },

  dayTabActive: {
    backgroundColor: "#2463EB",
  },

  activeTabGlowLarge: {
    position: "absolute",
    right: -12,
    top: -18,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },

  activeTabGlowSmall: {
    position: "absolute",
    left: 10,
    bottom: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  dayTabTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#16284A",
  },

  dayTabTitleCompact: {
    fontSize: 15,
  },

  dayTabTitleActive: {
    color: "#FFFFFF",
  },

  dayTabDate: {
    marginTop: 4,
    fontSize: 14,
    color: "#5F6F8A",
    fontWeight: "500",
  },

  dayTabDateCompact: {
    fontSize: 12.5,
  },

  dayTabDateActive: {
    color: "rgba(255, 255, 255, 0.95)",
  },

  viewMapButton: {
    flexShrink: 0,
    minWidth: 146,
  },

  viewMapButtonPhone: {
    minWidth: 96,
    alignSelf: "flex-end",
  },

  pillButton: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  pillButtonSolid: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#C0D2EE",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  pillButtonOutlined: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFE0FF",
  },

  pillButtonCompact: {
    minHeight: 38,
    paddingHorizontal: 8,
  },

  pillButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2463EB",
  },

  pillButtonTextCompact: {
    fontSize: 13,
  },

  itineraryCard: {
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE8F8",
    marginBottom: 22,
  },

  itineraryHeader: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 12,
    position: "relative",
    overflow: "hidden",
  },

  itineraryHeaderPhone: {
    alignItems: "stretch",
    paddingHorizontal: 16,
  },

  headerGradientFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#5A8CF7",
  },

  headerGradientBubbleLarge: {
    position: "absolute",
    right: -30,
    top: -34,
    width: 250,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },

  headerGradientBubbleSmall: {
    position: "absolute",
    left: 170,
    top: -44,
    width: 200,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },

  itineraryHeaderCopy: {
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  itineraryHeaderCopyPhone: {
    minWidth: 0,
    paddingRight: 0,
  },

  itineraryHeaderTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },

  itineraryHeaderTitlePhone: {
    fontSize: 17,
  },

  itineraryHeaderDot: {
    color: "rgba(255, 255, 255, 0.92)",
  },

  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  weatherText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  weatherTextPhone: {
    fontSize: 14.5,
  },

  weatherDot: {
    color: "rgba(255, 255, 255, 0.92)",
  },

  addActivityButton: {
    zIndex: 1,
  },

  addActivityButtonPhone: {
    alignSelf: "flex-end",
    maxWidth: 124,
  },

  activitiesList: {
    backgroundColor: "#FFFFFF",
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6EDF8",
    minHeight: 92,
  },

  activityRowCompact: {
    paddingHorizontal: 10,
    paddingVertical: 13,
    minHeight: 86,
  },

  activityRowFirst: {
    borderTopWidth: 0,
  },

  timeColumn: {
    width: 72,
    alignSelf: "stretch",
    justifyContent: "flex-start",
    paddingTop: 5,
  },

  timeColumnCompact: {
    width: 64,
  },

  timeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16284A",
  },

  timeTextCompact: {
    fontSize: 13,
  },

  timelineColumn: {
    width: 18,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },

  timelineColumnCompact: {
    width: 16,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    marginVertical: 4,
  },

  timelineMarkerCompact: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  iconColumn: {
    width: 62,
    alignItems: "center",
  },

  iconColumnCompact: {
    width: 56,
  },

  activityIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  activityIconCircleCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  detailsColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  detailsColumnCompact: {
    paddingRight: 8,
  },

  activityTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: "#16284A",
    letterSpacing: -0.2,
  },

  activityTitleCompact: {
    fontSize: 14.5,
    lineHeight: 18.5,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  locationText: {
    marginLeft: 7,
    fontSize: 15,
    color: "#4B5D7A",
    flexShrink: 1,
  },

  locationTextCompact: {
    fontSize: 13.5,
  },

  tagBadge: {
    marginTop: 9,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  tagBadgeCompact: {
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  tagBadgeText: {
    fontSize: 12.5,
    fontWeight: "600",
    flexShrink: 1,
  },

  tagBadgeTextCompact: {
    fontSize: 11.5,
    lineHeight: 15,
  },

  routeActionColumn: {
    width: 78,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  routeActionColumnCompact: {
    width: 62,
  },

  routeActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },

  distanceText: {
    fontSize: 14.5,
    color: "#3E4D68",
    fontWeight: "500",
  },

  distanceTextCompact: {
    fontSize: 12.5,
  },

  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderWidth: 1,
    borderColor: "#D2E0FA",
    columnGap: 14,
  },

  tipCardCompact: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    columnGap: 12,
  },

  tipRobotImage: {
    width: 60,
    height: 60,
  },

  tipRobotImageCompact: {
    width: 48,
    height: 48,
  },

  tipCopyColumn: {
    flex: 1,
    minWidth: 0,
  },

  tipHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: "#16284A",
  },

  tipHeadingCompact: {
    fontSize: 16,
  },

  tipSpark: {
    color: "#F5A623",
  },

  tipBody: {
    marginTop: 7,
    fontSize: 16,
    lineHeight: 22,
    color: "#354968",
  },

  tipBodyCompact: {
    fontSize: 14.5,
    lineHeight: 20,
  },

  tipLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 12,
    flexShrink: 0,
  },

  tipLinkText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2463EB",
  },

  tipLinkTextCompact: {
    fontSize: 14,
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

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
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
    fontWeight: "600",
    color: "#C2410C",
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
