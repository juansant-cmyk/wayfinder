import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroArtworkImage = require("../assets/images/favorites/favorites-hero-art.png");
const sunsetInnImage = require("../assets/images/favorites/favorites-hotel-sunset-inn-clean.png");
const cityViewImage = require("../assets/images/favorites/favorites-hotel-city-view-clean.png");
const losAngelesTripImage = require("../assets/images/favorites/favorites-itinerary-los-angeles.png");
const japanTripImage = require("../assets/images/favorites/favorites-itinerary-japan.png");
const tokyoTowerImage = require("../assets/images/favorites/favorites-place-tokyo-tower.png");
const shibuyaCrossingImage = require("../assets/images/favorites/favorites-place-shibuya-crossing.png");

const COLORS = {
  background: "#EAF2FC",
  card: "#FFFFFF",
  text: "#10213B",
  subtext: "#51607D",
  blue: "#1F78FF",
  green: "#149647",
  coral: "#FF5A4E",
};

const FAVORITE_TABS = [
  {
    key: "hotels",
    label: "Hotels",
    iconName: "bed-outline",
    iconFamily: "material",
  },
  {
    key: "flights",
    label: "Flights",
    iconName: "airplane-outline",
    iconFamily: "ion",
  },
  {
    key: "itineraries",
    label: "Itineraries",
    iconName: "calendar-outline",
    iconFamily: "ion",
  },
  {
    key: "places",
    label: "Places",
    iconName: "location-outline",
    iconFamily: "ion",
  },
];

const SAVED_HOTELS = [
  {
    id: "sunset-inn",
    name: "Sunset Inn",
    location: "Los Angeles, CA",
    rating: "4.6",
    reviewCount: 532,
    price: 149,
    amenities: ["WiFi", "Pool", "Parking"],
    badge: "Best Match",
    badgeBackground: "#FFD86B",
    badgeTextColor: "#14253E",
    image: sunsetInnImage,
    note: "Great value with excellent amenities.",
    noteBackground: "#EFF5FF",
    noteIconColor: "#2563EB",
  },
  {
    id: "city-view-hotel",
    name: "City View Hotel",
    location: "Downtown LA",
    rating: "4.4",
    reviewCount: 318,
    price: 119,
    amenities: ["WiFi", "Breakfast", "Gym"],
    badge: "Best Budget",
    badgeBackground: "#DDF8E4",
    badgeTextColor: "#12804C",
    image: cityViewImage,
    note: "Affordable and close to popular spots.",
    noteBackground: "#EDF8F3",
    noteIconColor: "#0F9F5B",
  },
];

const SAVED_FLIGHTS = [
  {
    id: "ana-lax-nrt",
    airline: "All Nippon Airways",
    departureTime: "11:15 AM",
    departureCode: "LAX",
    arrivalTime: "3:35 PM",
    arrivalCode: "NRT",
    arrivalOffset: "+1",
    duration: "11h 20m",
    stopInfo: "Nonstop",
    stopColor: COLORS.green,
    price: 765,
    brandColor: "#2557D6",
  },
  {
    id: "jal-lax-nrt",
    airline: "Japan Airlines",
    departureTime: "12:45 PM",
    departureCode: "LAX",
    arrivalTime: "4:20 PM",
    arrivalCode: "NRT",
    arrivalOffset: "+1",
    duration: "10h 35m",
    stopInfo: "Nonstop",
    stopColor: COLORS.green,
    price: 812,
    brandColor: "#E3403B",
  },
  {
    id: "korean-air-lax-nrt",
    airline: "Korean Air",
    departureTime: "1:20 PM",
    departureCode: "LAX",
    arrivalTime: "6:05 PM",
    arrivalCode: "NRT",
    arrivalOffset: "+1",
    duration: "13h 45m",
    stopInfo: "1 stop | ICN",
    stopColor: COLORS.subtext,
    price: 612,
  },
];

const SAVED_ITINERARIES = [
  {
    id: "la-trip",
    title: "Los Angeles Trip",
    accentIconName: "sparkles",
    accentIconFamily: "ion",
    accentIconColor: "#F59E0B",
    month: "JUL",
    day: "12",
    year: "2025",
    dates: "Jul 12 - Jul 15, 2025",
    nights: "3 Nights",
    tags: ["Flights", "Hotels", "Itinerary"],
    image: losAngelesTripImage,
  },
  {
    id: "japan-adventure",
    title: "Japan Adventure",
    accentIconName: "flower-tulip-outline",
    accentIconFamily: "material",
    accentIconColor: "#E1457D",
    month: "SEP",
    day: "20",
    year: "2025",
    dates: "Sep 20 - Sep 30, 2025",
    nights: "10 Nights",
    tags: ["Flights", "Hotels", "Itinerary"],
    image: japanTripImage,
  },
];

const SAVED_PLACES = [
  {
    id: "tokyo-tower",
    title: "Tokyo Tower",
    meta: "Landmark",
    distance: "2.1 km away",
    image: tokyoTowerImage,
  },
  {
    id: "shibuya-crossing",
    title: "Shibuya Crossing",
    meta: "Attraction",
    distance: "1.0 km away",
    image: shibuyaCrossingImage,
  },
];

const cardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 12px 24px rgba(143, 163, 191, 0.12)",
  },
  default: {
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});

function renderNavIcon(iconFamily, iconName, color, size) {
  if (iconFamily === "material") {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }

  return <Ionicons name={iconName} size={size} color={color} />;
}

function renderAmenityIcon(amenity) {
  if (amenity === "Pool") {
    return <MaterialCommunityIcons name="pool" size={19} color="#14253E" />;
  }

  if (amenity === "Parking") {
    return <Ionicons name="car-outline" size={19} color="#14253E" />;
  }

  if (amenity === "Breakfast") {
    return <Ionicons name="cafe-outline" size={19} color="#14253E" />;
  }

  if (amenity === "Gym") {
    return <Ionicons name="barbell-outline" size={19} color="#14253E" />;
  }

  return <Ionicons name="wifi-outline" size={19} color="#14253E" />;
}

function CardButton({ children, onPress, style, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        style,
        hovered && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function IconButton({
  accessibilityLabel,
  iconName,
  onPress,
  size = 20,
  color = COLORS.text,
  filled = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(event) => {
        event.stopPropagation?.();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        filled && styles.iconButtonFilled,
        pressed && styles.iconButtonPressed,
      ]}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </Pressable>
  );
}

function FavoriteTabs({ activeTab, onSelect, compact = false, tight = false }) {
  return (
    <View style={[styles.tabsShell, cardShadowStyle]}>
      <View style={[styles.tabsRow, tight && styles.tabsRowTight]}>
        {FAVORITE_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const Button = isActive ? Pressable : DimPressable;

          return (
            <Button
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={`Show saved ${tab.label.toLowerCase()}`}
              onPress={() => onSelect(tab.key)}
              style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
                compact && styles.tabButtonCompact,
                tight && styles.tabButtonTight,
              ]}
            >
              {renderNavIcon(
                tab.iconFamily,
                tab.iconName,
                isActive ? "#FFFFFF" : COLORS.blue,
                tight ? 16 : compact ? 18 : 21
              )}
              <Text
                numberOfLines={1}
                ellipsizeMode="clip"
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  compact && styles.tabLabelCompact,
                  tight && styles.tabLabelTight,
                ]}
              >
                {tab.label}
              </Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
}

function SectionHeader({ title, iconName, iconFamily = "ion", onViewAll }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderCopy}>
        <View style={styles.sectionHeaderIconWrap}>
          {renderNavIcon(iconFamily, iconName, COLORS.blue, 21)}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.sectionLinkButton}>
        <Text style={styles.sectionLinkText}>View all</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.blue} />
      </Pressable>
    </View>
  );
}

function HotelFavoriteCard({
  hotel,
  isSaved,
  isStacked,
  onPress,
  onToggleSaved,
}) {
  return (
    <CardButton
      accessibilityLabel={`Open ${hotel.name}`}
      onPress={onPress}
      style={[
        styles.hotelCard,
        cardShadowStyle,
        isStacked && styles.hotelCardStacked,
      ]}
    >
      <View style={[styles.hotelImageWrap, isStacked && styles.hotelImageWrapStacked]}>
        <Image source={hotel.image} resizeMode="cover" style={styles.hotelImage} />
        <View
          style={[
            styles.hotelBadge,
            { backgroundColor: hotel.badgeBackground },
          ]}
        >
          <Ionicons name="star-outline" size={17} color={hotel.badgeTextColor} />
          <Text style={[styles.hotelBadgeText, { color: hotel.badgeTextColor }]}>
            {hotel.badge}
          </Text>
        </View>
      </View>

      <View style={styles.hotelContent}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardHeadlineCopy}>
            <Text numberOfLines={2} style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={16} color={COLORS.blue} />
              <Text style={styles.metaText}>{hotel.location}</Text>
            </View>
          </View>

          <IconButton
            accessibilityLabel={isSaved ? `Remove ${hotel.name} from favorites` : `Save ${hotel.name}`}
            iconName={isSaved ? "heart" : "heart-outline"}
            color={isSaved ? COLORS.coral : COLORS.text}
            onPress={onToggleSaved}
          />
        </View>

        <View style={styles.hotelStatsRow}>
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={18} color="#F5B32C" />
            <Text style={styles.ratingText}>{hotel.rating}</Text>
          </View>
          <Text style={styles.reviewText}>({hotel.reviewCount} reviews)</Text>
          <Text style={styles.metaDivider}>|</Text>
          <View style={styles.priceWrap}>
            <Text style={styles.priceText}>${hotel.price}</Text>
            <Text style={styles.priceSuffix}>/night</Text>
          </View>
        </View>

        <View style={styles.amenitiesRow}>
          {hotel.amenities.map((amenity) => (
            <View key={amenity} style={styles.amenityPill}>
              {renderAmenityIcon(amenity)}
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.noteBox, { backgroundColor: hotel.noteBackground }]}>
          <View style={[styles.noteIconWrap, { backgroundColor: "#FFFFFF" }]}>
            <MaterialCommunityIcons
              name="robot-happy-outline"
              size={22}
              color={hotel.noteIconColor}
            />
          </View>
          <Text style={styles.noteText}>
            <Text style={styles.noteLabel}>Wayfinder note:</Text> {hotel.note}
          </Text>
        </View>
      </View>
    </CardButton>
  );
}

function AirlineLogo({ flight }) {
  if (flight.id === "ana-lax-nrt") {
    return (
      <View style={styles.airlineLogoRow}>
        <Text style={[styles.airlineLogoText, styles.anaLogoText]}>ANA</Text>
        <View style={styles.anaStripe} />
      </View>
    );
  }

  if (flight.id === "jal-lax-nrt") {
    return (
      <View style={styles.airlineLogoRow}>
        <View style={styles.jalMark}>
          <Text style={styles.jalMarkText}>JAL</Text>
        </View>
        <Text numberOfLines={1} style={styles.airlineSecondaryText}>JAPAN AIRLINES</Text>
      </View>
    );
  }

  return (
    <View style={styles.airlineLogoRow}>
      <View style={styles.koreanMark}>
        <View style={styles.koreanMarkTop} />
        <View style={styles.koreanMarkBottom} />
      </View>
      <Text numberOfLines={1} style={styles.airlineSecondaryText}>KOREAN AIR</Text>
    </View>
  );
}

function FlightFavoriteRow({
  flight,
  isSaved,
  compact,
  onPress,
  onToggleSaved,
}) {
  const heartButton = (
    <IconButton
      accessibilityLabel={isSaved ? `Remove ${flight.airline} flight from favorites` : `Save ${flight.airline} flight`}
      iconName={isSaved ? "heart" : "heart-outline"}
      color={isSaved ? COLORS.coral : COLORS.text}
      onPress={onToggleSaved}
    />
  );

  const priceBlock = (
    <View style={[styles.flightPriceBlock, compact && styles.flightPriceBlockCompact]}>
      <Text style={styles.flightPriceText}>${flight.price}</Text>
      <Text style={styles.flightPriceMeta}>round trip</Text>
    </View>
  );

  if (compact) {
    return (
      <CardButton
        accessibilityLabel={`Open saved flight with ${flight.airline}`}
        onPress={onPress}
        style={[styles.flightRowCard, cardShadowStyle]}
      >
        <View style={styles.flightCompactTopRow}>
          <View style={styles.flightAirlineBlockCompact}>
            <AirlineLogo flight={flight} />
            <Text numberOfLines={1} style={styles.flightAirlineName}>{flight.airline}</Text>
          </View>

          <View style={styles.flightCompactTopActions}>
            {priceBlock}
            {heartButton}
          </View>
        </View>

        <View style={styles.flightScheduleBlockCompact}>
          <View style={styles.flightTimeColumn}>
            <Text style={styles.flightTimeText}>{flight.departureTime}</Text>
            <Text style={styles.flightCodeText}>{flight.departureCode}</Text>
          </View>

          <View style={styles.flightRouteBlockCompact}>
            <Text style={styles.flightDurationText}>{flight.duration}</Text>
            <View style={styles.routeTrackRow}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <View style={styles.routeMidDot} />
              <View style={styles.routeLine} />
              <View style={styles.routeDot} />
            </View>
            <Text style={[styles.flightStopText, { color: flight.stopColor }]}>{flight.stopInfo}</Text>
          </View>

          <View style={[styles.flightTimeColumn, styles.flightTimeColumnArrival]}>
            <View style={styles.arrivalTimeRow}>
              <Text style={styles.flightTimeText}>{flight.arrivalTime}</Text>
              <Text style={styles.flightOffsetText}>{flight.arrivalOffset}</Text>
            </View>
            <Text style={styles.flightCodeText}>{flight.arrivalCode}</Text>
          </View>
        </View>
      </CardButton>
    );
  }

  return (
    <CardButton
      accessibilityLabel={`Open saved flight with ${flight.airline}`}
      onPress={onPress}
      style={[styles.flightRowCard, cardShadowStyle]}
    >
      <View style={styles.flightRowMain}>
        <View style={styles.flightAirlineBlock}>
          <AirlineLogo flight={flight} />
          <Text numberOfLines={1} style={styles.flightAirlineName}>{flight.airline}</Text>
        </View>

        <View style={styles.flightScheduleBlock}>
          <View style={styles.flightTimeColumn}>
            <Text style={styles.flightTimeText}>{flight.departureTime}</Text>
            <Text style={styles.flightCodeText}>{flight.departureCode}</Text>
          </View>

          <View style={styles.flightRouteBlock}>
            <Text style={styles.flightDurationText}>{flight.duration}</Text>
            <View style={styles.routeTrackRow}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <View style={styles.routeMidDot} />
              <View style={styles.routeLine} />
              <View style={styles.routeDot} />
            </View>
            <Text style={[styles.flightStopText, { color: flight.stopColor }]}>{flight.stopInfo}</Text>
          </View>

          <View style={styles.flightTimeColumn}>
            <View style={styles.arrivalTimeRow}>
              <Text style={styles.flightTimeText}>{flight.arrivalTime}</Text>
              <Text style={styles.flightOffsetText}>{flight.arrivalOffset}</Text>
            </View>
            <Text style={styles.flightCodeText}>{flight.arrivalCode}</Text>
          </View>
        </View>

        {priceBlock}
        {heartButton}
      </View>
    </CardButton>
  );
}

function TagChip({ label }) {
  const iconName =
    label === "Flights"
      ? "airplane-outline"
      : label === "Hotels"
        ? "bed-outline"
        : "map-outline";
  const iconFamily = label === "Hotels" ? "material" : "ion";

  return (
    <View style={styles.tagChip}>
      {renderNavIcon(iconFamily, iconName, COLORS.blue, 15)}
      <Text style={styles.tagChipText}>{label}</Text>
    </View>
  );
}

function ItineraryFavoriteCard({
  itinerary,
  isSaved,
  compact,
  onPress,
  onToggleSaved,
}) {
  const accentIcon = renderNavIcon(
    itinerary.accentIconFamily,
    itinerary.accentIconName,
    itinerary.accentIconColor,
    18
  );

  const actionButtons = (
    <View style={styles.itineraryActions}>
      <IconButton
        accessibilityLabel={isSaved ? `Remove ${itinerary.title} from favorites` : `Save ${itinerary.title}`}
        iconName={isSaved ? "heart" : "heart-outline"}
        color={isSaved ? COLORS.coral : COLORS.text}
        onPress={onToggleSaved}
      />
      <IconButton
        accessibilityLabel={`Open ${itinerary.title} itinerary`}
        iconName="chevron-forward"
        color={COLORS.text}
        filled
        onPress={onPress}
      />
    </View>
  );

  if (compact) {
    return (
      <CardButton
        accessibilityLabel={`Open ${itinerary.title}`}
        onPress={onPress}
        style={[styles.itineraryCard, styles.itineraryCardCompact, cardShadowStyle]}
      >
        <View style={styles.itineraryCompactTopRow}>
          <View style={styles.itineraryMediaGroupCompact}>
            <Image
              source={itinerary.image}
              resizeMode="cover"
              style={[styles.itineraryImage, styles.itineraryImageCompact]}
            />

            <View style={[styles.itineraryDateBlock, styles.itineraryDateBlockCompact]}>
              <Text style={styles.itineraryMonthText}>{itinerary.month}</Text>
              <Text style={styles.itineraryDayText}>{itinerary.day}</Text>
              <Text style={styles.itineraryYearText}>{itinerary.year}</Text>
            </View>
          </View>

          <View style={[styles.itineraryBody, styles.itineraryDetailsCompact]}>
            <View style={styles.itineraryTitleRow}>
              <Text numberOfLines={2} style={[styles.itineraryTitle, styles.itineraryTitleCompact]}>
                {itinerary.title}
              </Text>
              {accentIcon}
            </View>

            <Text numberOfLines={2} style={[styles.itineraryMeta, styles.itineraryMetaCompact]}>
              {itinerary.dates} <Text style={styles.itineraryMetaDivider}>•</Text> {itinerary.nights}
            </Text>
          </View>

          {actionButtons}
        </View>

        <View style={[styles.itineraryTagsRow, styles.itineraryTagsRowCompact]}>
          {itinerary.tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </View>
      </CardButton>
    );
  }

  return (
    <CardButton
      accessibilityLabel={`Open ${itinerary.title}`}
      onPress={onPress}
      style={[styles.itineraryCard, cardShadowStyle]}
    >
      <View style={styles.itineraryTopRow}>
        <View style={styles.itineraryMediaGroup}>
          <Image source={itinerary.image} resizeMode="cover" style={styles.itineraryImage} />

          <View style={styles.itineraryDateBlock}>
            <Text style={styles.itineraryMonthText}>{itinerary.month}</Text>
            <Text style={styles.itineraryDayText}>{itinerary.day}</Text>
            <Text style={styles.itineraryYearText}>{itinerary.year}</Text>
          </View>
        </View>

        <View style={styles.itineraryBody}>
          <View style={styles.itineraryTitleRow}>
            <Text numberOfLines={2} style={styles.itineraryTitle}>
              {itinerary.title}
            </Text>
            {accentIcon}
          </View>

          <Text style={styles.itineraryMeta}>
            {itinerary.dates} <Text style={styles.itineraryMetaDivider}>•</Text> {itinerary.nights}
          </Text>
        </View>

        {actionButtons}
      </View>

      <View style={styles.itineraryTagsRow}>
        {itinerary.tags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </View>
    </CardButton>
  );
}

function SavedPlaceCard({ place, isSaved, compact, onPress, onToggleSaved }) {
  return (
    <CardButton
      accessibilityLabel={`Open ${place.title}`}
      onPress={onPress}
      style={[
        styles.savedPlaceCard,
        cardShadowStyle,
        compact ? styles.savedPlaceCardCompact : styles.savedPlaceCardWide,
      ]}
    >
      <View style={styles.savedPlaceImageShell}>
        <Image source={place.image} resizeMode="contain" style={styles.savedPlaceImage} />
        <View style={styles.savedPlaceHeartWrap}>
          <IconButton
            accessibilityLabel={isSaved ? `Remove ${place.title} from favorites` : `Save ${place.title}`}
            iconName={isSaved ? "heart" : "heart-outline"}
            color={isSaved ? COLORS.coral : COLORS.text}
            onPress={onToggleSaved}
          />
        </View>
      </View>

      <View style={styles.savedPlaceCopy}>
        <Text numberOfLines={2} style={styles.savedPlaceTitle}>{place.title}</Text>
        <Text style={styles.savedPlaceMeta}>
          {place.meta} <Text style={styles.savedPlaceDivider}>•</Text> {place.distance}
        </Text>
      </View>
    </CardButton>
  );
}

export default function FavoritesScreen({ onGoBack, onNavigateHome, onNavigate }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 760;
  const isCompact = width < 460;
  const useTightTabs = width < 520;
  const shouldStackHotelCards = width < 900;
  const shouldCompactFlightRows = width < 680;
  const shouldCompactItineraryCards = width < 640;
  const pageMaxWidth = width >= 1100 ? 1040 : 980;

  const scrollRef = useRef(null);
  const sectionOffsetsRef = useRef({});

  const [activeTab, setActiveTab] = useState("hotels");
  const [savedHotelIds, setSavedHotelIds] = useState(SAVED_HOTELS.map((hotel) => hotel.id));
  const [savedFlightIds, setSavedFlightIds] = useState(SAVED_FLIGHTS.map((flight) => flight.id));
  const [savedItineraryIds, setSavedItineraryIds] = useState(
    SAVED_ITINERARIES.map((itinerary) => itinerary.id)
  );
  const [savedPlaceIds, setSavedPlaceIds] = useState(SAVED_PLACES.map((place) => place.id));

  const toggleSaved = (setter, itemId) => {
    setter((currentIds) =>
      currentIds.includes(itemId)
        ? currentIds.filter((currentId) => currentId !== itemId)
        : [...currentIds, itemId]
    );
  };

  const setSectionOffset = (sectionKey, event) => {
    sectionOffsetsRef.current[sectionKey] = event.nativeEvent.layout.y;
  };

  const scrollToSection = (sectionKey) => {
    const nextOffset = Math.max((sectionOffsetsRef.current[sectionKey] || 0) - 14, 0);
    scrollRef.current?.scrollTo({ y: nextOffset, animated: true });
  };

  const handleTabSelect = (sectionKey) => {
    setActiveTab(sectionKey);
    scrollToSection(sectionKey);
  };

  const handleViewAll = (sectionKey) => {
    setActiveTab(sectionKey);
    scrollToSection(sectionKey);
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: BOTTOM_NAV_CONTENT_PADDING + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.pageInner, { maxWidth: pageMaxWidth }]}>
            <View style={styles.pageGlowTop} />
            <View style={styles.pageGlowBottom} />

            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={handleGoBack}
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

            <View style={[styles.heroSection, isPhone && styles.heroSectionStacked]}>
              <View style={[styles.heroCopyColumn, isPhone && styles.heroCopyColumnStacked]}>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>
                    Favorites
                  </Text>
                  <Ionicons name="heart" size={isCompact ? 28 : 34} color="#8FA2FF" />
                </View>
                <Text style={[styles.heroSubtitle, isCompact && styles.heroSubtitleCompact]}>
                  All your saved places, flights, and trips in one spot.
                </Text>
              </View>

              <View style={[styles.heroArtworkWrap, isPhone && styles.heroArtworkWrapStacked]}>
                <View style={styles.heroArtworkGlow} />
                <Image source={heroArtworkImage} resizeMode="cover" style={styles.heroArtworkImage} />
              </View>
            </View>

            <FavoriteTabs
              activeTab={activeTab}
              onSelect={handleTabSelect}
              compact={isCompact}
              tight={useTightTabs}
            />

            <View onLayout={(event) => setSectionOffset("hotels", event)}>
              <SectionHeader
                title="Saved Hotels"
                iconName="bed-outline"
                iconFamily="material"
                onViewAll={() => handleViewAll("hotels")}
              />
              <View style={styles.sectionStack}>
                {SAVED_HOTELS.map((hotel) => (
                  <HotelFavoriteCard
                    key={hotel.id}
                    hotel={hotel}
                    isSaved={savedHotelIds.includes(hotel.id)}
                    isStacked={shouldStackHotelCards}
                    onPress={() => onNavigate?.("hotels")}
                    onToggleSaved={() => toggleSaved(setSavedHotelIds, hotel.id)}
                  />
                ))}
              </View>
            </View>

            <View onLayout={(event) => setSectionOffset("flights", event)}>
              <SectionHeader
                title="Saved Flights"
                iconName="airplane-outline"
                onViewAll={() => handleViewAll("flights")}
              />
              <View style={styles.sectionStack}>
                {SAVED_FLIGHTS.map((flight) => (
                  <FlightFavoriteRow
                    key={flight.id}
                    flight={flight}
                    isSaved={savedFlightIds.includes(flight.id)}
                    compact={shouldCompactFlightRows}
                    onPress={() => onNavigate?.("flights")}
                    onToggleSaved={() => toggleSaved(setSavedFlightIds, flight.id)}
                  />
                ))}
              </View>
            </View>

            <View onLayout={(event) => setSectionOffset("itineraries", event)}>
              <SectionHeader
                title="Saved Itineraries"
                iconName="calendar-outline"
                onViewAll={() => handleViewAll("itineraries")}
              />
              <View style={styles.sectionStack}>
                {SAVED_ITINERARIES.map((itinerary) => (
                  <ItineraryFavoriteCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    isSaved={savedItineraryIds.includes(itinerary.id)}
                    compact={shouldCompactItineraryCards}
                    onPress={() => onNavigate?.("itinerary")}
                    onToggleSaved={() => toggleSaved(setSavedItineraryIds, itinerary.id)}
                  />
                ))}
              </View>
            </View>

            <View onLayout={(event) => setSectionOffset("places", event)}>
              <SectionHeader
                title="Saved Places"
                iconName="location-outline"
                onViewAll={() => handleViewAll("places")}
              />
              <View style={styles.savedPlacesGrid}>
                {SAVED_PLACES.map((place) => (
                  <SavedPlaceCard
                    key={place.id}
                    place={place}
                    isSaved={savedPlaceIds.includes(place.id)}
                    compact={isPhone}
                    onPress={() => onNavigate?.("maps")}
                    onToggleSaved={() => toggleSaved(setSavedPlaceIds, place.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <BottomNav activeLabel="Favorites" onNavigate={onNavigate} />
      </View>
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
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  pageInner: {
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
    top: 7,
    right: 7,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#FF7A32",
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

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  heroTitle: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "800",
    letterSpacing: -2,
    color: COLORS.text,
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
    color: COLORS.subtext,
  },

  heroSubtitleCompact: {
    fontSize: 17,
    lineHeight: 28,
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

  tabsShell: {
    marginTop: 18,
    marginBottom: 24,
    padding: 8,
    borderRadius: 32,
    backgroundColor: COLORS.card,
  },

  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tabsRowTight: {
    gap: 4,
  },

  tabButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 24,
    minHeight: 56,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },

  tabButtonActive: {
    backgroundColor: COLORS.blue,
  },

  tabButtonCompact: {
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 13,
  },

  tabButtonTight: {
    gap: 4,
    borderRadius: 20,
    minHeight: 52,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },

  tabLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
    textAlign: "center",
  },

  tabLabelActive: {
    color: "#FFFFFF",
  },

  tabLabelCompact: {
    fontSize: 14,
  },

  tabLabelTight: {
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: -0.1,
  },

  sectionHeaderRow: {
    marginTop: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeaderCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionHeaderIconWrap: {
    width: 30,
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#14253E",
    letterSpacing: -0.6,
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  sectionLinkText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.blue,
  },

  sectionStack: {
    gap: 16,
  },

  cardHovered: {
    backgroundColor: "#F8FBFF",
  },

  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.98,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EEF9",
  },

  iconButtonFilled: {
    backgroundColor: "#F4F7FC",
  },

  iconButtonPressed: {
    opacity: 0.88,
  },

  hotelCard: {
    flexDirection: "row",
    gap: 20,
    padding: 16,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  hotelCardStacked: {
    flexDirection: "column",
  },

  hotelImageWrap: {
    width: 270,
    minWidth: 270,
    height: 212,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
  },

  hotelImageWrapStacked: {
    width: "100%",
    minWidth: 0,
    height: 220,
  },

  hotelImage: {
    width: "100%",
    height: "100%",
  },

  hotelBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  hotelBadgeText: {
    fontSize: 15,
    fontWeight: "800",
  },

  hotelContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  cardHeadlineCopy: {
    flex: 1,
    minWidth: 0,
  },

  hotelName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.6,
  },

  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  metaText: {
    fontSize: 16,
    color: COLORS.subtext,
  },

  hotelStatsRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },

  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ratingText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.blue,
  },

  reviewText: {
    fontSize: 16,
    color: COLORS.subtext,
  },

  metaDivider: {
    fontSize: 16,
    color: "#94A3B8",
  },

  priceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    flexShrink: 0,
  },

  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.blue,
  },

  priceSuffix: {
    fontSize: 17,
    color: COLORS.text,
  },

  amenitiesRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  amenityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  amenityText: {
    fontSize: 16,
    color: COLORS.text,
  },

  noteBox: {
    marginTop: 18,
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9E7FB",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  noteIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
  },

  noteLabel: {
    fontWeight: "800",
  },

  flightRowCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  flightRowMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },

  flightCompactTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  flightAirlineBlock: {
    width: 170,
  },

  flightAirlineBlockCompact: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  flightCompactTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  airlineLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  airlineLogoText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  anaLogoText: {
    color: "#2557D6",
  },

  anaStripe: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2557D6",
    transform: [{ skewX: "-24deg" }],
  },

  jalMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },

  jalMarkText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D53032",
  },

  koreanMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#E8EEF9",
  },

  koreanMarkTop: {
    flex: 1,
    backgroundColor: "#E03A3E",
  },

  koreanMarkBottom: {
    flex: 1,
    backgroundColor: "#2452D4",
  },

  airlineSecondaryText: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },

  flightAirlineName: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.subtext,
  },

  flightScheduleBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  flightScheduleBlockCompact: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  flightTimeColumn: {
    minWidth: 74,
    alignItems: "flex-start",
  },

  flightTimeText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  arrivalTimeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },

  flightOffsetText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },

  flightCodeText: {
    marginTop: 6,
    fontSize: 15,
    color: COLORS.subtext,
  },

  flightRouteBlock: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    minWidth: 110,
  },

  flightRouteBlockCompact: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 8,
  },

  flightDurationText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.subtext,
  },

  routeTrackRow: {
    width: "100%",
    maxWidth: 160,
    flexDirection: "row",
    alignItems: "center",
  },

  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#AFC3E3",
  },

  routeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#93ADD3",
    backgroundColor: "#FFFFFF",
  },

  routeMidDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#93ADD3",
  },

  flightStopText: {
    fontSize: 15,
    fontWeight: "700",
  },

  flightPriceBlock: {
    width: 88,
    alignItems: "flex-end",
  },

  flightPriceBlockCompact: {
    width: 74,
  },

  flightTimeColumnArrival: {
    alignItems: "flex-end",
  },

  flightPriceText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.blue,
  },

  flightPriceMeta: {
    marginTop: 4,
    fontSize: 15,
    color: COLORS.subtext,
  },

  itineraryCard: {
    padding: 16,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  itineraryCardCompact: {
    paddingBottom: 18,
  },

  itineraryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  itineraryCompactTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  itineraryMediaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  itineraryMediaGroupCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  itineraryImage: {
    width: 194,
    height: 112,
    borderRadius: 18,
  },

  itineraryImageCompact: {
    width: 102,
    height: 92,
  },

  itineraryDateBlock: {
    width: 74,
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#F7FAFF",
  },

  itineraryDateBlockCompact: {
    width: 66,
    minHeight: 92,
    borderRadius: 16,
    paddingVertical: 10,
  },

  itineraryMonthText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.blue,
  },

  itineraryDayText: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -1.2,
  },

  itineraryYearText: {
    fontSize: 13,
    color: COLORS.subtext,
  },

  itineraryBody: {
    flex: 1,
    minWidth: 0,
  },

  itineraryDetailsCompact: {
    flex: 1,
    minWidth: 0,
  },

  itineraryTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minWidth: 0,
  },

  itineraryTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  itineraryTitleCompact: {
    fontSize: 18,
    lineHeight: 24,
  },

  itineraryMeta: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.subtext,
  },

  itineraryMetaCompact: {
    fontSize: 15,
    lineHeight: 22,
  },

  itineraryMetaDivider: {
    color: "#94A3B8",
  },

  itineraryTagsRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  itineraryTagsRowCompact: {
    marginTop: 12,
    gap: 8,
  },

  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F1F6FF",
  },

  tagChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  itineraryActions: {
    width: 40,
    alignItems: "center",
    gap: 12,
  },

  savedPlacesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  savedPlaceCard: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  savedPlaceCardWide: {
    flexBasis: "48.5%",
    flexGrow: 1,
  },

  savedPlaceCardCompact: {
    width: "100%",
  },

  savedPlaceImageShell: {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FD",
  },

  savedPlaceImage: {
    width: "100%",
    height: 160,
    borderRadius: 18,
  },

  savedPlaceHeartWrap: {
    position: "absolute",
    top: 12,
    right: 12,
  },

  savedPlaceCopy: {
    paddingTop: 14,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },

  savedPlaceTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  savedPlaceMeta: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.subtext,
  },

  savedPlaceDivider: {
    color: "#94A3B8",
  },
});
