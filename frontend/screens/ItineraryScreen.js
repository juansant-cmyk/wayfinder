import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroArtworkImage = require("../assets/images/itinerary-hero-reference.png");
const tripPreviewImage = require("../assets/images/itinerary-trip-reference.png");
const tipBotImage = require("../assets/images/itinerary-tip-bot-reference.png");

const initialTrip = {
  title: "Los Angeles Trip",
  destination: "Los Angeles, California",
  dates: "Jul 12 - Jul 15, 2025",
  nights: "3 Nights",
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
    iconBackground: "#1F66FF",
    markerColor: "#1F66FF",
    tagBackgroundColor: "#EAF2FF",
    tagTextColor: "#2357E7",
  },
  {
    key: "photo",
    label: "Photo Spot",
    iconLibrary: "ionicons",
    iconName: "camera-outline",
    iconBackground: "#FF6A1C",
    markerColor: "#FF6A1C",
    tagBackgroundColor: "#FFF0E3",
    tagTextColor: "#E76E1E",
  },
  {
    key: "food",
    label: "Food",
    iconLibrary: "ionicons",
    iconName: "restaurant-outline",
    iconBackground: "#29B15D",
    markerColor: "#29B15D",
    tagBackgroundColor: "#EAF9F1",
    tagTextColor: "#12804C",
  },
  {
    key: "culture",
    label: "Culture",
    iconLibrary: "material",
    iconName: "bank-outline",
    iconBackground: "#7D58F2",
    markerColor: "#7D58F2",
    tagBackgroundColor: "#F0EBFF",
    tagTextColor: "#6946DB",
  },
  {
    key: "sunset",
    label: "Scenic",
    iconLibrary: "ionicons",
    iconName: "sunny-outline",
    iconBackground: "#F05390",
    markerColor: "#F05390",
    tagBackgroundColor: "#FFE7F0",
    tagTextColor: "#E1457D",
  },
  {
    key: "travel",
    label: "Travel",
    iconLibrary: "ionicons",
    iconName: "airplane-outline",
    iconBackground: "#F59E0B",
    markerColor: "#F59E0B",
    tagBackgroundColor: "#FFF4DA",
    tagTextColor: "#C88100",
  },
];

const categoryByKey = Object.fromEntries(
  activityCategories.map((category) => [category.key, category])
);

const itineraryTips = [
  "Santa Monica Pier parking fills early, so rideshare is easier for your first stop.",
  "The Getty Center entry is free, but a timed reservation helps avoid waiting around.",
  "Griffith Observatory gets busiest just before sunset, so arrive a little ahead of 7 PM.",
];

const initialItineraryDays = [
  {
    id: "day1",
    label: "Day 1",
    shortDate: "Jul 12",
    fullDate: "Saturday, Jul 12",
    weather: {
      icon: "sunny",
      label: "Sunny",
      temperature: "78°F",
    },
    activities: [
      {
        id: "day1-breakfast",
        time: "9:00 AM",
        title: "Breakfast at Urth Caffé",
        location: "Santa Monica",
        distance: "2.1 mi",
        markerColor: "#1F66FF",
        iconLibrary: "ionicons",
        iconName: "cafe-outline",
        iconBackground: "#1F66FF",
        tag: buildTag("Recommended by Wayfinder", "#EAF2FF", "#2357E7"),
      },
      {
        id: "day1-pier",
        time: "11:00 AM",
        title: "Santa Monica Pier",
        location: "Santa Monica",
        distance: "2.4 mi",
        markerColor: "#FF6A1C",
        iconLibrary: "ionicons",
        iconName: "camera-outline",
        iconBackground: "#FF6A1C",
        tag: buildTag("Photo spot", "#FFF0E3", "#E76E1E"),
      },
      {
        id: "day1-lunch",
        time: "1:30 PM",
        title: "Lunch at The Albright",
        location: "Santa Monica",
        distance: "0.8 mi",
        markerColor: "#29B15D",
        iconLibrary: "ionicons",
        iconName: "restaurant-outline",
        iconBackground: "#29B15D",
      },
      {
        id: "day1-getty",
        time: "3:30 PM",
        title: "The Getty Center",
        location: "Brentwood",
        distance: "6.3 mi",
        markerColor: "#7D58F2",
        iconLibrary: "material",
        iconName: "bank-outline",
        iconBackground: "#7D58F2",
        tag: buildTag("Reserve tickets online", "#F0EBFF", "#6946DB"),
      },
      {
        id: "day1-griffith",
        time: "7:00 PM",
        title: "Sunset at Griffith Observatory",
        location: "Los Feliz",
        distance: "7.9 mi",
        markerColor: "#F05390",
        iconLibrary: "ionicons",
        iconName: "sunny-outline",
        iconBackground: "#F05390",
        tag: buildTag("Best sunset in LA", "#FFE7F0", "#E1457D"),
      },
      {
        id: "day1-dinner",
        time: "9:00 PM",
        title: "Dinner in Downtown LA",
        location: "Downtown LA",
        distance: "5.2 mi",
        markerColor: "#F5B32C",
        iconLibrary: "ionicons",
        iconName: "wine-outline",
        iconBackground: "#F5B32C",
      },
    ],
  },
  {
    id: "day2",
    label: "Day 2",
    shortDate: "Jul 13",
    fullDate: "Sunday, Jul 13",
    weather: {
      icon: "partly-sunny",
      label: "Warm",
      temperature: "80°F",
    },
    activities: [
      {
        id: "day2-coffee",
        time: "8:30 AM",
        title: "Coffee in Venice",
        location: "Venice Beach",
        distance: "3.4 mi",
        markerColor: "#1F66FF",
        iconLibrary: "ionicons",
        iconName: "cafe-outline",
        iconBackground: "#1F66FF",
      },
      {
        id: "day2-canals",
        time: "10:00 AM",
        title: "Venice Canals Walk",
        location: "Venice",
        distance: "0.6 mi",
        markerColor: "#10B981",
        iconLibrary: "ionicons",
        iconName: "walk-outline",
        iconBackground: "#10B981",
        tag: buildTag("Slow morning", "#EAF9F1", "#12804C"),
      },
      {
        id: "day2-lunch",
        time: "1:00 PM",
        title: "Lunch on Abbot Kinney",
        location: "Venice",
        distance: "1.2 mi",
        markerColor: "#29B15D",
        iconLibrary: "ionicons",
        iconName: "restaurant-outline",
        iconBackground: "#29B15D",
      },
      {
        id: "day2-shopping",
        time: "4:00 PM",
        title: "Shopping Break",
        location: "Abbot Kinney",
        distance: "0.4 mi",
        markerColor: "#7D58F2",
        iconLibrary: "ionicons",
        iconName: "bag-handle-outline",
        iconBackground: "#7D58F2",
      },
      {
        id: "day2-rooftop",
        time: "7:30 PM",
        title: "Rooftop Dinner",
        location: "West Hollywood",
        distance: "6.0 mi",
        markerColor: "#F05390",
        iconLibrary: "ionicons",
        iconName: "moon-outline",
        iconBackground: "#F05390",
      },
    ],
  },
  {
    id: "day3",
    label: "Day 3",
    shortDate: "Jul 14",
    fullDate: "Monday, Jul 14",
    weather: {
      icon: "sunny",
      label: "Clear",
      temperature: "76°F",
    },
    activities: [
      {
        id: "day3-hike",
        time: "7:30 AM",
        title: "Runyon Canyon Hike",
        location: "Hollywood Hills",
        distance: "4.8 mi",
        markerColor: "#29B15D",
        iconLibrary: "ionicons",
        iconName: "walk-outline",
        iconBackground: "#29B15D",
        tag: buildTag("Morning views", "#EAF9F1", "#12804C"),
      },
      {
        id: "day3-hollywood",
        time: "11:00 AM",
        title: "Hollywood Walk of Fame",
        location: "Hollywood",
        distance: "2.0 mi",
        markerColor: "#1F66FF",
        iconLibrary: "ionicons",
        iconName: "star-outline",
        iconBackground: "#1F66FF",
      },
      {
        id: "day3-museum",
        time: "2:00 PM",
        title: "Academy Museum",
        location: "Miracle Mile",
        distance: "5.1 mi",
        markerColor: "#7D58F2",
        iconLibrary: "material",
        iconName: "movie-open-outline",
        iconBackground: "#7D58F2",
      },
      {
        id: "day3-koreatown",
        time: "6:30 PM",
        title: "Dinner in Koreatown",
        location: "Koreatown",
        distance: "4.4 mi",
        markerColor: "#29B15D",
        iconLibrary: "ionicons",
        iconName: "restaurant-outline",
        iconBackground: "#29B15D",
      },
    ],
  },
  {
    id: "day4",
    label: "Day 4",
    shortDate: "Jul 15",
    fullDate: "Tuesday, Jul 15",
    weather: {
      icon: "sunny",
      label: "Bright",
      temperature: "75°F",
    },
    activities: [
      {
        id: "day4-brunch",
        time: "9:00 AM",
        title: "Brunch in Downtown",
        location: "Arts District",
        distance: "2.5 mi",
        markerColor: "#1F66FF",
        iconLibrary: "ionicons",
        iconName: "cafe-outline",
        iconBackground: "#1F66FF",
      },
      {
        id: "day4-broad",
        time: "11:30 AM",
        title: "The Broad",
        location: "Downtown LA",
        distance: "1.1 mi",
        markerColor: "#7D58F2",
        iconLibrary: "material",
        iconName: "palette-outline",
        iconBackground: "#7D58F2",
      },
      {
        id: "day4-shopping",
        time: "2:30 PM",
        title: "Last-minute Souvenirs",
        location: "The Grove",
        distance: "5.8 mi",
        markerColor: "#10B981",
        iconLibrary: "ionicons",
        iconName: "gift-outline",
        iconBackground: "#10B981",
      },
      {
        id: "day4-transfer",
        time: "5:30 PM",
        title: "Airport Transfer",
        location: "LAX",
        distance: "11.2 mi",
        markerColor: "#F59E0B",
        iconLibrary: "ionicons",
        iconName: "airplane-outline",
        iconBackground: "#F59E0B",
        tag: buildTag("Leave early for traffic", "#FFF4DA", "#C88100"),
      },
    ],
  },
];

function createActivityDraft(dayId) {
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

function parseTimeLabel(value) {
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

function sortActivitiesByTime(activities) {
  return [...activities].sort((left, right) => parseTimeLabel(left.time) - parseTimeLabel(right.time));
}

function normalizeDistance(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "1.0 mi";
  }

  return trimmed.toLowerCase().includes("mi") ? trimmed : `${trimmed} mi`;
}

function buildActivityFromDraft(draft) {
  const category = categoryByKey[draft.category] || categoryByKey.food;
  const tagLabel = draft.tag.trim();

  return {
    id: `activity-${Date.now()}`,
    time: draft.time.trim(),
    title: draft.title.trim(),
    location: draft.location.trim(),
    distance: normalizeDistance(draft.distance),
    markerColor: category.markerColor,
    iconLibrary: category.iconLibrary,
    iconName: category.iconName,
    iconBackground: category.iconBackground,
    tag: tagLabel
      ? buildTag(tagLabel, category.tagBackgroundColor, category.tagTextColor)
      : null,
  };
}

function getDayRouteMiles(day) {
  const total = day.activities.reduce((sum, activity) => {
    const value = parseFloat(activity.distance);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  return total.toFixed(1);
}

function buildActivityMapUrl(activity, destination) {
  const query = `${activity.title}, ${activity.location}, ${destination}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildDayRouteUrl(day, destination) {
  const stops = day.activities.map((activity) => `${activity.title}, ${activity.location}, ${destination}`);

  if (!stops.length) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  }

  if (stops.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0])}`;
  }

  const [origin, ...remainingStops] = stops;
  const destinationStop = remainingStops[remainingStops.length - 1];
  const middleStops = remainingStops.slice(0, -1);
  const waypointQuery = middleStops.length
    ? `&waypoints=${encodeURIComponent(middleStops.join("|"))}`
    : "";

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destinationStop)}${waypointQuery}&travelmode=driving`;
}

function renderIcon(library, name, size, color) {
  if (library === "material") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Ionicons name={name} size={size} color={color} />;
}

function HeaderActionButton({ accessibilityLabel, iconName, onPress, showDot = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.headerActionButton}
    >
      <Ionicons name={iconName} size={29} color="#132647" />
      {showDot ? <View style={styles.notificationDot} /> : null}
    </Pressable>
  );
}

function DayTab({ day, isActive, onPress }) {
  const textStyle = [styles.dayTabTitle, isActive && styles.dayTabTitleActive];
  const dateStyle = [styles.dayTabDate, isActive && styles.dayTabDateActive];

  if (isActive) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${day.label}, ${day.shortDate}`}
        onPress={onPress}
        style={[styles.dayTab, styles.dayTabActive]}
      >
        <Text style={textStyle}>{day.label}</Text>
        <Text style={dateStyle}>{day.shortDate}</Text>
      </Pressable>
    );
  }

  return (
    <DimPressable
      accessibilityRole="button"
      accessibilityLabel={`${day.label}, ${day.shortDate}`}
      onPress={onPress}
      style={styles.dayTab}
    >
      <Text style={textStyle}>{day.label}</Text>
      <Text style={dateStyle}>{day.shortDate}</Text>
    </DimPressable>
  );
}

function ActionPill({
  label,
  iconName,
  onPress,
  outlined = false,
  compact = false,
  accessibilityLabel,
}) {
  const Button = outlined ? DimPressable : Pressable;

  return (
    <Button
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={[
        styles.actionPill,
        outlined ? styles.actionPillOutlined : styles.actionPillFilled,
        compact && styles.actionPillCompact,
      ]}
    >
      <Ionicons name={iconName} size={compact ? 18 : 20} color="#2563EB" />
      <Text
        style={[
          styles.actionPillText,
          outlined ? styles.actionPillTextOutlined : styles.actionPillTextFilled,
          compact && styles.actionPillTextCompact,
        ]}
      >
        {label}
      </Text>
    </Button>
  );
}

function TagPill({ tag }) {
  if (!tag) {
    return null;
  }

  return (
    <View style={[styles.tagPill, { backgroundColor: tag.backgroundColor }]}>
      <Ionicons name={tag.iconName} size={12} color={tag.textColor} />
      <Text style={[styles.tagPillText, { color: tag.textColor }]}>{tag.label}</Text>
    </View>
  );
}

function TimelineItem({
  activity,
  isFirst,
  isLast,
  compact,
  onOpenDetails,
  onOpenMap,
}) {
  return (
    <View style={[styles.timelineRow, isFirst && styles.timelineRowFirst]}>
      <Text style={[styles.timelineTime, compact && styles.timelineTimeCompact]}>{activity.time}</Text>

      <View style={styles.timelineRail}>
        <View style={[styles.timelineLineSegment, isFirst && styles.timelineLineHidden]} />
        <View style={[styles.timelineDot, { borderColor: activity.markerColor }]} />
        <View style={[styles.timelineLineSegment, isLast && styles.timelineLineHidden]} />
      </View>

      <View style={styles.timelineContent}>
        <View style={styles.timelineActivityRow}>
          <View style={[styles.activityIconWrap, { backgroundColor: activity.iconBackground }]}>
            {renderIcon(activity.iconLibrary, activity.iconName, 27, "#FFFFFF")}
          </View>

          <Pressable onPress={onOpenDetails} style={styles.activityDetailsButton}>
            <Text style={[styles.activityTitle, compact && styles.activityTitleCompact]}>
              {activity.title}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={15} color="#2563EB" />
              <Text style={styles.locationText}>{activity.location}</Text>
            </View>

            <TagPill tag={activity.tag} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${activity.title} in Maps`}
            onPress={onOpenMap}
            style={styles.activityMetaButton}
          >
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={17} color="#2563EB" />
              <Text style={styles.distanceText}>{activity.distance}</Text>
            </View>
            <Ionicons name="chevron-forward" size={21} color="#54637F" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function HeroArtwork({ compact }) {
  return (
    <Image
      source={heroArtworkImage}
      resizeMode="contain"
      style={[styles.heroArtwork, compact && styles.heroArtworkCompact]}
    />
  );
}

function TipCard({ onPress, stacked }) {
  return (
    <View style={[styles.tipCard, stacked && styles.tipCardStacked]}>
      <Image source={tipBotImage} resizeMode="contain" style={styles.tipIconImage} />

      <View style={styles.tipTextWrap}>
        <Text style={styles.tipHeading}>
          Wayfinder Tip <Text style={styles.tipAccent}>✦</Text>
        </Text>
        <Text style={styles.tipBody}>
          Consider using rideshare or public transit to avoid parking and traffic.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View tips"
        onPress={onPress}
        style={styles.tipAction}
      >
        <Text style={styles.tipActionText}>View Tips</Text>
        <Ionicons name="chevron-forward" size={20} color="#2563EB" />
      </Pressable>
    </View>
  );
}

function ModalShell({ visible, title, subtitle, onClose, children, footer }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#14253E" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.modalFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A9AB2"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}

function CategoryButton({ category, isActive, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.label}
      onPress={onPress}
      style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
    >
      <View
        style={[
          styles.categoryIconBadge,
          { backgroundColor: isActive ? "#FFFFFF" : category.iconBackground },
        ]}
      >
        {renderIcon(
          category.iconLibrary,
          category.iconName,
          18,
          isActive ? category.iconBackground : "#FFFFFF"
        )}
      </View>
      <Text style={[styles.categoryButtonText, isActive && styles.categoryButtonTextActive]}>
        {category.label}
      </Text>
    </Pressable>
  );
}

function ModalFooterButton({ label, onPress, variant = "secondary" }) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.modalFooterButton, isPrimary && styles.modalFooterButtonPrimary]}
    >
      <Text
        style={[
          styles.modalFooterButtonText,
          isPrimary && styles.modalFooterButtonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ItineraryScreen({ onNavigate, onBack }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;
  const isDesktop = width >= 1100;
  const isCompact = width < 460;
  const pageMaxWidth = isDesktop ? 968 : 952;

  const [trip, setTrip] = useState(initialTrip);
  const [days, setDays] = useState(initialItineraryDays);
  const [selectedDayId, setSelectedDayId] = useState(initialItineraryDays[0].id);
  const [notice, setNotice] = useState("");

  const [isEditTripVisible, setIsEditTripVisible] = useState(false);
  const [tripDraft, setTripDraft] = useState(initialTrip);
  const [tripDraftError, setTripDraftError] = useState("");

  const [isAddActivityVisible, setIsAddActivityVisible] = useState(false);
  const [activityDraft, setActivityDraft] = useState(createActivityDraft(initialItineraryDays[0].id));
  const [activityDraftError, setActivityDraftError] = useState("");

  const [isMapPreviewVisible, setIsMapPreviewVisible] = useState(false);
  const [isTipsVisible, setIsTipsVisible] = useState(false);
  const [selectedActivityRef, setSelectedActivityRef] = useState(null);

  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0];
  const selectedActivity = selectedActivityRef
    ? days
        .find((day) => day.id === selectedActivityRef.dayId)
        ?.activities.find((activity) => activity.id === selectedActivityRef.activityId) || null
    : null;

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotice("");
    }, 2600);

    return () => clearTimeout(timer);
  }, [notice]);

  const openTripEditor = () => {
    setTripDraft(trip);
    setTripDraftError("");
    setIsEditTripVisible(true);
  };

  const saveTripEdits = () => {
    const nextTrip = {
      title: tripDraft.title.trim(),
      destination: tripDraft.destination.trim(),
      dates: tripDraft.dates.trim(),
      nights: tripDraft.nights.trim(),
    };

    if (!nextTrip.title || !nextTrip.destination || !nextTrip.dates || !nextTrip.nights) {
      setTripDraftError("Complete all trip fields before saving.");
      return;
    }

    setTrip(nextTrip);
    setIsEditTripVisible(false);
    setTripDraftError("");
    setNotice("Trip details updated.");
  };

  const openAddActivity = () => {
    setActivityDraft(createActivityDraft(selectedDay.id));
    setActivityDraftError("");
    setIsAddActivityVisible(true);
  };

  const saveNewActivity = () => {
    if (!activityDraft.time.trim() || !activityDraft.title.trim() || !activityDraft.location.trim()) {
      setActivityDraftError("Add a time, title, and location to save this activity.");
      return;
    }

    const nextActivity = buildActivityFromDraft(activityDraft);

    setDays((currentDays) =>
      currentDays.map((day) =>
        day.id === selectedDay.id
          ? {
              ...day,
              activities: sortActivitiesByTime([...day.activities, nextActivity]),
            }
          : day
      )
    );

    setIsAddActivityVisible(false);
    setActivityDraftError("");
    setNotice(`${nextActivity.title} added to ${selectedDay.label}.`);
  };

  const openActivityDetails = (activity) => {
    setSelectedActivityRef({ dayId: selectedDay.id, activityId: activity.id });
  };

  const closeActivityDetails = () => {
    setSelectedActivityRef(null);
  };

  const openExternalUrl = async (url, failureMessage) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      setNotice(failureMessage);
    }
  };

  const openSelectedDayRoute = async () => {
    const routeUrl = buildDayRouteUrl(selectedDay, trip.destination);
    await openExternalUrl(routeUrl, "Unable to open the route map right now.");
  };

  const openActivityMap = async (activity) => {
    await openExternalUrl(
      buildActivityMapUrl(activity, trip.destination),
      `Unable to open ${activity.title} in Maps right now.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: BOTTOM_NAV_CONTENT_PADDING + 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.pageInner, { maxWidth: pageMaxWidth }]}>
            <View style={styles.pageGlowTop} />
            <View style={styles.pageGlowBottom} />

            <View style={styles.topHeaderRow}>
              <WayfinderBrand
                containerStyle={styles.brandRow}
                textStyle={[styles.brandText, isCompact && styles.brandTextCompact]}
              />

              <View style={styles.headerActions}>
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
            </View>

            {notice ? (
              <View style={styles.noticeBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}

            <View style={[styles.heroSection, !isTablet && styles.heroSectionStacked]}>
              <View style={styles.heroCopyColumn}>
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={onBack}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={31} color="#14253E" />
                </DimPressable>

                <View style={styles.heroCopy}>
                  <Text
                    style={[
                      styles.heroTitle,
                      isDesktop && styles.heroTitleDesktop,
                      isTablet && !isDesktop && styles.heroTitleTablet,
                      isCompact && styles.heroTitleCompact,
                    ]}
                  >
                    Itinerary
                  </Text>
                  <Text style={[styles.heroSubtitle, isCompact && styles.heroSubtitleCompact]}>
                    Your trip, <Text style={styles.heroSubtitleAccent}>day by day.</Text>
                  </Text>
                </View>
              </View>

              <HeroArtwork compact={!isTablet} />
            </View>

            <View style={[styles.tripCard, !isTablet && styles.tripCardStacked]}>
              <Image
                source={tripPreviewImage}
                style={[styles.tripImage, !isTablet && styles.tripImageStacked]}
                resizeMode="cover"
              />

              <View style={styles.tripDetails}>
                <View style={styles.tripTitleRow}>
                  <Text style={styles.tripTitle}>{trip.title}</Text>
                  <Ionicons name="sparkles" size={18} color="#F59E0B" />
                </View>

                <View style={styles.summaryMetaRow}>
                  <Ionicons name="location" size={18} color="#2563EB" />
                  <Text style={styles.summaryMetaText}>{trip.destination}</Text>
                </View>

                <View style={styles.summaryMetaRow}>
                  <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                  <Text style={styles.summaryMetaText}>{trip.dates}</Text>
                  <Text style={styles.summaryBullet}>•</Text>
                  <Text style={styles.summaryMetaText}>{trip.nights}</Text>
                </View>
              </View>

              <ActionPill
                label="Edit Trip"
                iconName="pencil-outline"
                onPress={openTripEditor}
                outlined
                accessibilityLabel="Edit trip"
              />
            </View>

            <View style={[styles.daySelectorRow, !isTablet && styles.daySelectorRowStacked]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayTabsRow}
              >
                {days.map((day) => (
                  <DayTab
                    key={day.id}
                    day={day}
                    isActive={day.id === selectedDay.id}
                    onPress={() => setSelectedDayId(day.id)}
                  />
                ))}
              </ScrollView>

              <ActionPill
                label="View Map"
                iconName="map-outline"
                onPress={() => setIsMapPreviewVisible(true)}
                outlined
                compact={isCompact}
                accessibilityLabel="View map"
              />
            </View>

            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleHeaderGlowLeft} />
                <View style={styles.scheduleHeaderGlowRight} />

                <View>
                  <Text style={[styles.scheduleDayTitle, isCompact && styles.scheduleDayTitleCompact]}>
                    {selectedDay.label} <Text style={styles.scheduleBullet}>•</Text>{" "}
                    {selectedDay.fullDate}
                  </Text>

                  <View style={styles.weatherRow}>
                    <Ionicons name={selectedDay.weather.icon} size={20} color="#F6C453" />
                    <Text style={styles.weatherText}>
                      {selectedDay.weather.label} <Text style={styles.weatherSeparator}>•</Text>{" "}
                      {selectedDay.weather.temperature}
                    </Text>
                  </View>
                </View>

                <ActionPill
                  label="Add Activity"
                  iconName="add"
                  onPress={openAddActivity}
                  accessibilityLabel="Add activity"
                />
              </View>

              <View style={styles.timelineList}>
                {selectedDay.activities.map((activity, index) => (
                  <TimelineItem
                    key={activity.id}
                    activity={activity}
                    isFirst={index === 0}
                    isLast={index === selectedDay.activities.length - 1}
                    compact={isCompact}
                    onOpenDetails={() => openActivityDetails(activity)}
                    onOpenMap={() => openActivityMap(activity)}
                  />
                ))}
              </View>
            </View>

            <TipCard onPress={() => setIsTipsVisible(true)} stacked={!isTablet} />
          </View>
        </ScrollView>

        <BottomNav activeLabel="Itinerary" onNavigate={onNavigate} />
      </View>

      <ModalShell
        visible={isEditTripVisible}
        title="Edit Trip"
        subtitle="Update the trip summary card without leaving the itinerary."
        onClose={() => setIsEditTripVisible(false)}
        footer={
          <>
            <ModalFooterButton label="Cancel" onPress={() => setIsEditTripVisible(false)} />
            <ModalFooterButton label="Save Changes" onPress={saveTripEdits} variant="primary" />
          </>
        }
      >
        {tripDraftError ? <Text style={styles.formErrorText}>{tripDraftError}</Text> : null}

        <ModalField
          label="Trip Title"
          value={tripDraft.title}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, title: value }))}
          placeholder="Los Angeles Trip"
        />
        <ModalField
          label="Destination"
          value={tripDraft.destination}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, destination: value }))}
          placeholder="Los Angeles, California"
        />
        <ModalField
          label="Dates"
          value={tripDraft.dates}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, dates: value }))}
          placeholder="Jul 12 - Jul 15, 2025"
        />
        <ModalField
          label="Nights"
          value={tripDraft.nights}
          onChangeText={(value) => setTripDraft((current) => ({ ...current, nights: value }))}
          placeholder="3 Nights"
        />
      </ModalShell>

      <ModalShell
        visible={isAddActivityVisible}
        title="Add Activity"
        subtitle={`Add a stop to ${selectedDay.label} and drop it into the timeline.`}
        onClose={() => setIsAddActivityVisible(false)}
        footer={
          <>
            <ModalFooterButton label="Cancel" onPress={() => setIsAddActivityVisible(false)} />
            <ModalFooterButton label="Add Activity" onPress={saveNewActivity} variant="primary" />
          </>
        }
      >
        {activityDraftError ? <Text style={styles.formErrorText}>{activityDraftError}</Text> : null}

        <ModalField
          label="Time"
          value={activityDraft.time}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, time: value }))}
          placeholder="12:00 PM"
        />
        <ModalField
          label="Activity Title"
          value={activityDraft.title}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, title: value }))}
          placeholder="Lunch reservation"
        />
        <ModalField
          label="Location"
          value={activityDraft.location}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, location: value }))}
          placeholder="Santa Monica"
        />
        <ModalField
          label="Distance"
          value={activityDraft.distance}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, distance: value }))}
          placeholder="1.0 mi"
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {activityCategories.map((category) => (
              <CategoryButton
                key={category.key}
                category={category}
                isActive={activityDraft.category === category.key}
                onPress={() => setActivityDraft((current) => ({ ...current, category: category.key }))}
              />
            ))}
          </View>
        </View>

        <ModalField
          label="Tag (Optional)"
          value={activityDraft.tag}
          onChangeText={(value) => setActivityDraft((current) => ({ ...current, tag: value }))}
          placeholder="Recommended by Wayfinder"
        />
      </ModalShell>

      <ModalShell
        visible={isMapPreviewVisible}
        title={`${selectedDay.label} Route`}
        subtitle={`${selectedDay.activities.length} stops · ${getDayRouteMiles(selectedDay)} mi planned`}
        onClose={() => setIsMapPreviewVisible(false)}
        footer={
          <>
            <ModalFooterButton label="Close" onPress={() => setIsMapPreviewVisible(false)} />
            <ModalFooterButton
              label="Open in Google Maps"
              onPress={openSelectedDayRoute}
              variant="primary"
            />
          </>
        }
      >
        <View style={styles.routeSummaryCard}>
          <Text style={styles.routeSummaryEyebrow}>{trip.destination}</Text>
          <Text style={styles.routeSummaryTitle}>{trip.title}</Text>
          <Text style={styles.routeSummaryBody}>
            Use this route preview to keep the day in order before you head out.
          </Text>
        </View>

        <View style={styles.routeList}>
          {selectedDay.activities.map((activity, index) => (
            <View key={activity.id} style={styles.routeListItem}>
              <View style={styles.routeMarkerColumn}>
                <View style={[styles.routeNumberBadge, { backgroundColor: activity.iconBackground }]}>
                  <Text style={styles.routeNumberText}>{index + 1}</Text>
                </View>
                {index < selectedDay.activities.length - 1 ? <View style={styles.routeConnector} /> : null}
              </View>

              <View style={styles.routeCopy}>
                <Text style={styles.routeStopTitle}>{activity.title}</Text>
                <Text style={styles.routeStopMeta}>
                  {activity.time} · {activity.location} · {activity.distance}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsMapPreviewVisible(false);
            onNavigate?.("maps", { destination: trip.destination });
          }}
          style={styles.inlineLinkButton}
        >
          <Text style={styles.inlineLinkText}>Open the full Maps screen</Text>
          <Ionicons name="chevron-forward" size={18} color="#2563EB" />
        </Pressable>
      </ModalShell>

      <ModalShell
        visible={Boolean(selectedActivity)}
        title={selectedActivity?.title || "Activity"}
        subtitle={selectedActivity ? `${selectedActivity.time} · ${selectedActivity.location}` : ""}
        onClose={closeActivityDetails}
        footer={
          <>
            <ModalFooterButton label="Close" onPress={closeActivityDetails} />
            <ModalFooterButton
              label="Open in Maps"
              onPress={() => {
                if (selectedActivity) {
                  openActivityMap(selectedActivity);
                }
              }}
              variant="primary"
            />
          </>
        }
      >
        {selectedActivity ? (
          <>
            <View style={styles.activityDetailHero}>
              <View
                style={[
                  styles.activityDetailIcon,
                  { backgroundColor: selectedActivity.iconBackground },
                ]}
              >
                {renderIcon(selectedActivity.iconLibrary, selectedActivity.iconName, 28, "#FFFFFF")}
              </View>

              <View style={styles.activityDetailHeroCopy}>
                <Text style={styles.activityDetailTitle}>{selectedActivity.title}</Text>
                <Text style={styles.activityDetailSubtitle}>
                  {selectedActivity.time} · {selectedActivity.distance}
                </Text>
              </View>
            </View>

            <View style={styles.activityDetailCard}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={18} color="#2563EB" />
                <Text style={styles.detailRowText}>{selectedActivity.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                <Text style={styles.detailRowText}>{selectedDay.fullDate}</Text>
              </View>
              <TagPill tag={selectedActivity.tag} />
            </View>
          </>
        ) : null}
      </ModalShell>

      <ModalShell
        visible={isTipsVisible}
        title="Wayfinder Tips"
        subtitle="Extra guidance for making this Los Angeles day smoother."
        onClose={() => setIsTipsVisible(false)}
        footer={
          <>
            <ModalFooterButton label="Close" onPress={() => setIsTipsVisible(false)} />
            <ModalFooterButton
              label="Open Travel Check"
              onPress={() => {
                setIsTipsVisible(false);
                onNavigate?.("travelCheck", { destination: trip.destination });
              }}
              variant="primary"
            />
          </>
        }
      >
        {itineraryTips.map((tip) => (
          <View key={tip} style={styles.tipListItem}>
            <Ionicons name="sparkles" size={16} color="#2563EB" />
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
    backgroundColor: "#F7FAFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7FAFF",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  pageInner: {
    width: "100%",
    position: "relative",
  },

  pageGlowTop: {
    position: "absolute",
    top: 42,
    left: -40,
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: "rgba(255, 222, 170, 0.18)",
  },

  pageGlowBottom: {
    position: "absolute",
    right: -44,
    bottom: 108,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(156, 199, 255, 0.18)",
  },

  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  brandRow: {
    alignSelf: "auto",
    marginRight: 0,
  },

  brandText: {
    fontSize: 28,
    letterSpacing: -0.8,
  },

  brandTextCompact: {
    fontSize: 24,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerActionButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#FF7A26",
    borderWidth: 2,
    borderColor: "#F7FAFF",
  },

  noticeBanner: {
    marginBottom: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "#D1E0FB",
  },

  noticeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1849A9",
  },

  heroSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 18,
  },

  heroSectionStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  heroCopyColumn: {
    flex: 1,
  },

  backButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A7B6CF",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  heroCopy: {
    marginTop: 18,
  },

  heroTitle: {
    fontSize: 46,
    fontWeight: "800",
    color: "#12254A",
    letterSpacing: -1.6,
  },

  heroTitleDesktop: {
    fontSize: 58,
  },

  heroTitleTablet: {
    fontSize: 56,
  },

  heroTitleCompact: {
    fontSize: 40,
    letterSpacing: -1.1,
  },

  heroSubtitle: {
    marginTop: 16,
    fontSize: 17,
    color: "#23314E",
    fontWeight: "500",
  },

  heroSubtitleCompact: {
    fontSize: 16,
  },

  heroSubtitleAccent: {
    color: "#2563EB",
  },

  heroArtwork: {
    width: 500,
    height: 180,
    marginRight: -10,
  },

  heroArtworkCompact: {
    width: "100%",
    height: 150,
    marginTop: 6,
    marginRight: 0,
  },

  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    shadowColor: "#A8B7CF",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
    marginBottom: 24,
  },

  tripCardStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  tripImage: {
    width: 248,
    height: 134,
    borderRadius: 20,
  },

  tripImageStacked: {
    width: "100%",
    height: 180,
  },

  tripDetails: {
    flex: 1,
  },

  tripTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tripTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#12254A",
    letterSpacing: -0.6,
  },

  summaryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },

  summaryMetaText: {
    marginLeft: 10,
    fontSize: 15.5,
    color: "#34425E",
    fontWeight: "500",
  },

  summaryBullet: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#95A3B8",
  },

  actionPill: {
    minHeight: 48,
    alignSelf: "flex-start",
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#C0D0E8",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  actionPillFilled: {
    backgroundColor: "#FFFFFF",
  },

  actionPillOutlined: {
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#FFFFFF",
  },

  actionPillCompact: {
    minHeight: 46,
    paddingHorizontal: 16,
  },

  actionPillText: {
    fontSize: 16,
    fontWeight: "700",
  },

  actionPillTextFilled: {
    color: "#2563EB",
  },

  actionPillTextOutlined: {
    color: "#2563EB",
  },

  actionPillTextCompact: {
    fontSize: 15,
  },

  daySelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },

  daySelectorRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  dayTabsRow: {
    gap: 14,
    paddingVertical: 4,
  },

  dayTab: {
    width: 108,
    paddingVertical: 15,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#B2C2D8",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },

  dayTabActive: {
    backgroundColor: "#1F66FF",
  },

  dayTabTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#14253E",
  },

  dayTabTitleActive: {
    color: "#FFFFFF",
  },

  dayTabDate: {
    marginTop: 4,
    fontSize: 14,
    color: "#54637F",
    fontWeight: "500",
  },

  dayTabDateActive: {
    color: "rgba(255, 255, 255, 0.92)",
  },

  scheduleCard: {
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#A8B7CF",
    shadowOpacity: 0.15,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },

  scheduleHeader: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    backgroundColor: "#5B8FFF",
    position: "relative",
  },

  scheduleHeaderGlowLeft: {
    position: "absolute",
    top: -26,
    left: 130,
    width: 300,
    height: 160,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },

  scheduleHeaderGlowRight: {
    position: "absolute",
    right: -24,
    top: -16,
    width: 250,
    height: 160,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  scheduleDayTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  scheduleDayTitleCompact: {
    fontSize: 18,
  },

  scheduleBullet: {
    color: "rgba(255, 255, 255, 0.9)",
  },

  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  weatherText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  weatherSeparator: {
    color: "rgba(255, 255, 255, 0.9)",
  },

  timelineList: {
    backgroundColor: "#FFFFFF",
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E8F5",
  },

  timelineRowFirst: {
    borderTopWidth: 0,
  },

  timelineTime: {
    width: 90,
    paddingTop: 18,
    fontSize: 15,
    fontWeight: "800",
    color: "#12254A",
  },

  timelineTimeCompact: {
    width: 74,
    fontSize: 14,
  },

  timelineRail: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },

  timelineLineSegment: {
    flex: 1,
    width: 2,
    backgroundColor: "#D9E4F3",
  },

  timelineLineHidden: {
    opacity: 0,
  },

  timelineDot: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    marginVertical: 4,
  },

  timelineContent: {
    flex: 1,
  },

  timelineActivityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  activityIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  activityDetailsButton: {
    flex: 1,
    paddingVertical: 4,
  },

  activityTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#12254A",
    letterSpacing: -0.4,
  },

  activityTitleCompact: {
    fontSize: 16,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#49566F",
  },

  tagPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tagPillText: {
    fontSize: 13,
    fontWeight: "600",
  },

  activityMetaButton: {
    width: 92,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 10,
  },

  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  distanceText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#34425E",
  },

  tipCard: {
    marginTop: 22,
    marginBottom: 8,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "#C8DAF8",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  tipCardStacked: {
    flexWrap: "wrap",
  },

  tipIconImage: {
    width: 64,
    height: 64,
  },

  tipTextWrap: {
    flex: 1,
    minWidth: 180,
  },

  tipHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: "#12254A",
  },

  tipAccent: {
    color: "#F59E0B",
  },

  tipBody: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: "#334155",
  },

  tipAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tipActionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 18, 36, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },

  modalCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "100%",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EEF8",
  },

  modalHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#12254A",
    letterSpacing: -0.7,
  },

  modalSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#526179",
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F6FD",
  },

  modalBody: {
    maxHeight: 430,
  },

  modalBodyContent: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    gap: 16,
  },

  modalFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "#E8EEF8",
  },

  modalFooterButton: {
    flexGrow: 1,
    minWidth: 140,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FD",
    borderWidth: 1,
    borderColor: "#D6E2F7",
  },

  modalFooterButtonPrimary: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  modalFooterButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#173260",
  },

  modalFooterButtonTextPrimary: {
    color: "#FFFFFF",
  },

  fieldGroup: {
    gap: 8,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173260",
  },

  fieldInput: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D6E2F7",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#12254A",
  },

  fieldInputMultiline: {
    minHeight: 104,
    paddingTop: 14,
    paddingBottom: 14,
  },

  formErrorText: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#C2410C",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  categoryButton: {
    minWidth: 118,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#D6E2F7",
  },

  categoryButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173260",
  },

  categoryButtonTextActive: {
    color: "#FFFFFF",
  },

  routeSummaryCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#EFF5FF",
    borderWidth: 1,
    borderColor: "#D6E5FF",
  },

  routeSummaryEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  routeSummaryTitle: {
    marginTop: 10,
    fontSize: 21,
    fontWeight: "800",
    color: "#12254A",
  },

  routeSummaryBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#526179",
  },

  routeList: {
    marginTop: 20,
    gap: 12,
  },

  routeListItem: {
    flexDirection: "row",
    gap: 14,
  },

  routeMarkerColumn: {
    width: 30,
    alignItems: "center",
  },

  routeNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  routeNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  routeConnector: {
    marginTop: 6,
    flex: 1,
    width: 2,
    backgroundColor: "#D6E2F7",
  },

  routeCopy: {
    flex: 1,
    paddingBottom: 12,
  },

  routeStopTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#12254A",
  },

  routeStopMeta: {
    marginTop: 6,
    fontSize: 14,
    color: "#526179",
  },

  inlineLinkButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },

  inlineLinkText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },

  activityDetailHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },

  activityDetailIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },

  activityDetailHeroCopy: {
    flex: 1,
  },

  activityDetailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#12254A",
  },

  activityDetailSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#526179",
  },

  activityDetailCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#D6E2F7",
    gap: 12,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  detailRowText: {
    fontSize: 15,
    color: "#34425E",
  },

  tipListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#D6E2F7",
  },

  tipListText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#34425E",
  },
});
