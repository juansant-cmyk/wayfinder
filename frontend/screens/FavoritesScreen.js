import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import {
  PLAN_FAVORITE_ITEM_TYPE,
  PLAN_FAVORITE_PROVIDER,
  mapPlanFavoriteToCard,
} from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const heroArtworkImage = require("../assets/images/favorites/favorites-hero-art.png");
const sunsetInnImage = require("../assets/images/favorites/favorites-hotel-sunset-inn-clean.png");
const cityViewImage = require("../assets/images/favorites/favorites-hotel-city-view-clean.png");
const losAngelesTripImage = require("../assets/images/favorites/favorites-itinerary-los-angeles.png");
const tokyoTowerImage = require("../assets/images/favorites/favorites-place-tokyo-tower.png");
const shibuyaCrossingImage = require("../assets/images/favorites/favorites-place-shibuya-crossing.png");
const tipBotImage = require("../assets/images/itinerary-tip-bot-reference.png");

/** Preview caps per Favorites section — raise later without rewriting UI. */
const SECTION_PREVIEW_LIMITS = {
  itineraries: 3,
};

/** Fraction of screen height for the "View all" sheet (scalable). */
const VIEW_ALL_SHEET_HEIGHT_RATIO = 0.75;
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

function renderAmenityIcon(amenity, size = 19) {
  if (amenity === "Pool") {
    return <MaterialCommunityIcons name="pool" size={size} color="#14253E" />;
  }

  if (amenity === "Parking") {
    return <Ionicons name="car-outline" size={size} color="#14253E" />;
  }

  if (amenity === "Breakfast") {
    return <Ionicons name="cafe-outline" size={size} color="#14253E" />;
  }

  if (amenity === "Gym") {
    return <Ionicons name="barbell-outline" size={size} color="#14253E" />;
  }

  return <Ionicons name="wifi-outline" size={size} color="#14253E" />;
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
  compact = false,
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
        compact && styles.iconButtonCompact,
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
                tight ? 14 : compact ? 16 : 18
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

function SectionHeader({
  title,
  iconName,
  iconFamily = "ion",
  onViewAll,
  showViewAll = true,
  compact = false,
}) {
  return (
    <View style={[styles.sectionHeaderRow, compact && styles.sectionHeaderRowCompact]}>
      <View style={styles.sectionHeaderCopy}>
        <View style={styles.sectionHeaderIconWrap}>
          {renderNavIcon(iconFamily, iconName, COLORS.blue, compact ? 16 : 18)}
        </View>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>{title}</Text>
      </View>

      {showViewAll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View all ${title}`}
          onPress={onViewAll}
          style={styles.sectionLinkButton}
        >
          <Text style={[styles.sectionLinkText, compact && styles.sectionLinkTextCompact]}>
            View all
          </Text>
          <Ionicons name="chevron-forward" size={compact ? 16 : 18} color={COLORS.blue} />
        </Pressable>
      ) : null}
    </View>
  );
}

function FavoritesViewAllSheet({
  visible,
  title,
  heightRatio = VIEW_ALL_SHEET_HEIGHT_RATIO,
  onClose,
  children,
}) {
  const { height } = useWindowDimensions();
  const sheetHeight = Math.round(height * heightRatio);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.viewAllOverlay}>
        <Pressable
          style={styles.viewAllBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close view all sheet"
        />
        <View style={[styles.viewAllSheet, { height: sheetHeight }]}>
          <View style={styles.viewAllHandle} />
          <View style={styles.viewAllHeader}>
            <Text style={styles.viewAllTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.viewAllScroll}
            contentContainerStyle={styles.viewAllScrollContent}
            showsVerticalScrollIndicator
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function HotelFavoriteCard({
  hotel,
  isSaved,
  isStacked,
  compact = false,
  onPress,
  onToggleSaved,
}) {
  const amenityIconSize = compact ? 14 : 16;

  return (
    <CardButton
      accessibilityLabel={`Open ${hotel.name}`}
      onPress={onPress}
      style={[
        styles.hotelCard,
        cardShadowStyle,
        compact && styles.hotelCardCompact,
        isStacked && styles.hotelCardStacked,
      ]}
    >
      <View
        style={[
          styles.hotelImageWrap,
          compact && styles.hotelImageWrapCompact,
          isStacked && styles.hotelImageWrapStacked,
        ]}
      >
        <Image
          source={hotel.image}
          resizeMode="cover"
          style={styles.hotelImage}
        />
        <View
          style={[
            styles.hotelBadge,
            compact && styles.hotelBadgeCompact,
            { backgroundColor: hotel.badgeBackground },
          ]}
        >
          <Ionicons
            name="star-outline"
            size={compact ? 13 : 17}
            color={hotel.badgeTextColor}
          />
          <Text
            style={[
              styles.hotelBadgeText,
              compact && styles.hotelBadgeTextCompact,
              { color: hotel.badgeTextColor },
            ]}
          >
            {hotel.badge}
          </Text>
        </View>
      </View>

      <View style={styles.hotelContent}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardHeadlineCopy}>
            <Text
              numberOfLines={2}
              style={[styles.hotelName, compact && styles.hotelNameCompact]}
            >
              {hotel.name}
            </Text>
            <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
              <Ionicons name="location" size={compact ? 13 : 16} color={COLORS.blue} />
              <Text style={[styles.metaText, compact && styles.metaTextCompact]}>
                {hotel.location}
              </Text>
            </View>
          </View>

          <IconButton
            accessibilityLabel={isSaved ? `Remove ${hotel.name} from favorites` : `Save ${hotel.name}`}
            iconName={isSaved ? "heart" : "heart-outline"}
            color={isSaved ? COLORS.coral : COLORS.text}
            size={compact ? 18 : 20}
            onPress={onToggleSaved}
          />
        </View>

        <View style={[styles.hotelStatsRow, compact && styles.hotelStatsRowCompact]}>
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={compact ? 14 : 18} color="#F5B32C" />
            <Text style={[styles.ratingText, compact && styles.ratingTextCompact]}>
              {hotel.rating}
            </Text>
          </View>
          <Text style={[styles.reviewText, compact && styles.reviewTextCompact]}>
            ({hotel.reviewCount} reviews)
          </Text>
          <Text style={[styles.metaDivider, compact && styles.metaDividerCompact]}>|</Text>
          <View style={styles.priceWrap}>
            <Text style={[styles.priceText, compact && styles.priceTextCompact]}>
              ${hotel.price}
            </Text>
            <Text style={[styles.priceSuffix, compact && styles.priceSuffixCompact]}>
              /night
            </Text>
          </View>
        </View>

        <View style={[styles.amenitiesRow, compact && styles.amenitiesRowCompact]}>
          {hotel.amenities.map((amenity) => (
            <View key={amenity} style={[styles.amenityPill, compact && styles.amenityPillCompact]}>
              {renderAmenityIcon(amenity, amenityIconSize)}
              <Text style={[styles.amenityText, compact && styles.amenityTextCompact]}>
                {amenity}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.noteBox,
            compact && styles.noteBoxCompact,
            { backgroundColor: hotel.noteBackground },
          ]}
        >
          <Image
            source={tipBotImage}
            resizeMode="contain"
            style={[styles.noteRobotImage, compact && styles.noteRobotImageCompact]}
          />
          <Text style={[styles.noteText, compact && styles.noteTextCompact]}>
            <Text style={styles.noteLabel}>Wayfinder note:</Text> {hotel.note}
          </Text>
        </View>
      </View>
    </CardButton>
  );
}

function AirlineLogo({ flight, compact = false }) {
  if (flight.id === "ana-lax-nrt") {
    return (
      <View style={styles.airlineLogoRow}>
        <Text style={[styles.airlineLogoText, styles.anaLogoText, compact && styles.airlineLogoTextCompact]}>
          ANA
        </Text>
        <View style={[styles.anaStripe, compact && styles.anaStripeCompact]} />
      </View>
    );
  }

  if (flight.id === "jal-lax-nrt") {
    return (
      <View style={styles.airlineLogoRow}>
        <View style={[styles.jalMark, compact && styles.jalMarkCompact]}>
          <Text style={[styles.jalMarkText, compact && styles.jalMarkTextCompact]}>JAL</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.airlineLogoRow}>
      <View style={[styles.koreanMark, compact && styles.koreanMarkCompact]}>
        <View style={styles.koreanMarkTop} />
        <View style={styles.koreanMarkBottom} />
      </View>
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
  return (
    <CardButton
      accessibilityLabel={`Open saved flight with ${flight.airline}`}
      onPress={onPress}
      style={[styles.flightRowCard, compact && styles.flightRowCardCompact, cardShadowStyle]}
    >
      <View style={styles.flightRowMain}>
        <View style={[styles.flightAirlineCol, compact && styles.flightAirlineColCompact]}>
          <AirlineLogo flight={flight} compact={compact} />
          <Text numberOfLines={1} style={[styles.flightAirlineName, compact && styles.flightAirlineNameCompact]}>
            {flight.airline}
          </Text>
        </View>

        <View style={[styles.flightDepCol, compact && styles.flightTimeColCompact]}>
          <Text numberOfLines={1} style={[styles.flightTimeText, compact && styles.flightTimeTextCompact]}>
            {flight.departureTime}
          </Text>
          <Text style={[styles.flightCodeText, compact && styles.flightCodeTextCompact]}>
            {flight.departureCode}
          </Text>
        </View>

        <View style={[styles.flightRouteCol, compact && styles.flightRouteColCompact]}>
          <Text numberOfLines={1} style={[styles.flightDurationText, compact && styles.flightDurationTextCompact]}>
            {flight.duration}
          </Text>
          <View style={styles.routeTrackRow}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <View style={styles.routeMidDot} />
            <View style={styles.routeLine} />
            <View style={styles.routeDot} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.flightStopText, compact && styles.flightStopTextCompact, { color: flight.stopColor }]}
          >
            {flight.stopInfo}
          </Text>
        </View>

        <View style={[styles.flightArrCol, compact && styles.flightTimeColCompact]}>
          <View style={styles.arrivalTimeRow}>
            <Text numberOfLines={1} style={[styles.flightTimeText, compact && styles.flightTimeTextCompact]}>
              {flight.arrivalTime}
            </Text>
            <Text style={[styles.flightOffsetText, compact && styles.flightOffsetTextCompact]}>
              {flight.arrivalOffset}
            </Text>
          </View>
          <Text style={[styles.flightCodeText, compact && styles.flightCodeTextCompact]}>
            {flight.arrivalCode}
          </Text>
        </View>

        <View style={[styles.flightPriceCol, compact && styles.flightPriceColCompact]}>
          <Text numberOfLines={1} style={[styles.flightPriceText, compact && styles.flightPriceTextCompact]}>
            ${flight.price}
          </Text>
          <Text numberOfLines={1} style={[styles.flightPriceMeta, compact && styles.flightPriceMetaCompact]}>
            round trip
          </Text>
        </View>

        <View style={styles.flightHeartCol}>
          <IconButton
            accessibilityLabel={
              isSaved
                ? `Remove ${flight.airline} flight from favorites`
                : `Save ${flight.airline} flight`
            }
            iconName={isSaved ? "heart" : "heart-outline"}
            color={isSaved ? COLORS.coral : COLORS.text}
            size={compact ? 15 : 17}
            compact={compact}
            onPress={onToggleSaved}
          />
        </View>
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
    compact ? 14 : 16
  );

  const actionButtons = (
    <View style={styles.itineraryActions}>
      <IconButton
        accessibilityLabel={isSaved ? `Remove ${itinerary.title} from favorites` : `Save ${itinerary.title}`}
        iconName={isSaved ? "heart" : "heart-outline"}
        color={isSaved ? COLORS.coral : COLORS.text}
        size={compact ? 18 : 20}
        onPress={onToggleSaved}
      />
      <IconButton
        accessibilityLabel={`Open ${itinerary.title} itinerary`}
        iconName="chevron-forward"
        color={COLORS.text}
        size={compact ? 18 : 20}
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
              <Text style={[styles.itineraryMonthText, styles.itineraryMonthTextCompact]}>
                {itinerary.month}
              </Text>
              <Text style={[styles.itineraryDayText, styles.itineraryDayTextCompact]}>
                {itinerary.day}
              </Text>
              <Text style={[styles.itineraryYearText, styles.itineraryYearTextCompact]}>
                {itinerary.year}
              </Text>
            </View>
          </View>

          <View style={[styles.itineraryBody, styles.itineraryDetailsCompact]}>
            <View style={styles.itineraryTitleRow}>
              <Text numberOfLines={2} style={[styles.itineraryTitle, styles.itineraryTitleCompact]}>
                {itinerary.title}
              </Text>
              {accentIcon}
            </View>

            <Text numberOfLines={3} style={[styles.itineraryMeta, styles.itineraryMetaCompact]}>
              {itinerary.destination ? (
                <>
                  {itinerary.destination}
                  {"\n"}
                </>
              ) : null}
              {itinerary.dates}
              {itinerary.nights ? (
                <>
                  {" "}
                  <Text style={styles.itineraryMetaDivider}>•</Text> {itinerary.nights}
                </>
              ) : null}
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
            {itinerary.destination ? (
              <>
                {itinerary.destination}
                {"\n"}
              </>
            ) : null}
            {itinerary.dates}
            {itinerary.nights ? (
              <>
                {" "}
                <Text style={styles.itineraryMetaDivider}>•</Text> {itinerary.nights}
              </>
            ) : null}
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
      style={[styles.savedPlaceCard, cardShadowStyle, compact && styles.savedPlaceCardCompact]}
    >
      <View style={[styles.savedPlaceImageShell, compact && styles.savedPlaceImageShellCompact]}>
        <Image
          source={place.image}
          resizeMode="cover"
          style={styles.savedPlaceImage}
        />
      </View>

      <View style={styles.savedPlaceCopy}>
        <Text numberOfLines={2} style={[styles.savedPlaceTitle, compact && styles.savedPlaceTitleCompact]}>
          {place.title}
        </Text>
        <Text numberOfLines={1} style={[styles.savedPlaceMeta, compact && styles.savedPlaceMetaCompact]}>
          {place.meta} <Text style={styles.savedPlaceDivider}>•</Text> {place.distance}
        </Text>
      </View>

      <View style={styles.savedPlaceHeartCol}>
        <IconButton
          accessibilityLabel={isSaved ? `Remove ${place.title} from favorites` : `Save ${place.title}`}
          iconName={isSaved ? "heart" : "heart-outline"}
          color={isSaved ? COLORS.coral : COLORS.text}
          size={compact ? 16 : 18}
          onPress={onToggleSaved}
        />
      </View>
    </CardButton>
  );
}

export default function FavoritesScreen({ onGoBack, onNavigateHome, onNavigate }) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width } = useWindowDimensions();
  const isPhone = width < 700;
  const isCompactPhone = width < 400;
  const useTightTabs = width < 520;
  // Keep hotel cards side-by-side like the mockup; stack only on very narrow widths.
  const shouldStackHotelCards = width < 340;
  // Use compact flight column sizing on phone widths to prevent overlap.
  const shouldCompactFlightRows = width < 700;
  const shouldCompactItineraryCards = width < 640;
  const pageMaxWidth = width >= 1100 ? 980 : 900;
  const pagePaddingHorizontal = isCompactPhone ? 14 : isPhone ? 16 : 18;

  // Favorites hero art is 842×356 — size near natural resolution (avoid soft upscaling).
  const heroAspectRatio = 842 / 356;
  const heroArtworkWidth = isCompactPhone
    ? Math.min(Math.round(width * 0.44), 156)
    : isPhone
      ? Math.min(Math.round(width * 0.42), 184)
      : width < 900
        ? Math.min(Math.round(width * 0.34), 280)
        : Math.min(Math.round(width * 0.30), 340);
  const heroTitleSize = isCompactPhone ? 28 : isPhone ? 32 : width < 900 ? 38 : 42;
  const heroSubtitleSize = isCompactPhone ? 12 : isPhone ? 13 : 15;
  const backButtonSize = isCompactPhone ? 40 : isPhone ? 44 : 48;
  const headerIconSize = isPhone ? 22 : 26;
  const profileIconSize = isPhone ? 28 : 32;
  const heroHeartSize = isCompactPhone ? 20 : isPhone ? 24 : 28;

  const scrollRef = useRef(null);
  const sectionOffsetsRef = useRef({});

  const [activeTab, setActiveTab] = useState("hotels");
  const [savedHotelIds, setSavedHotelIds] = useState(SAVED_HOTELS.map((hotel) => hotel.id));
  const [savedFlightIds, setSavedFlightIds] = useState(SAVED_FLIGHTS.map((flight) => flight.id));
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [itinerariesLoading, setItinerariesLoading] = useState(true);
  const [itinerariesError, setItinerariesError] = useState("");
  const [pendingItineraryIds, setPendingItineraryIds] = useState([]);
  const [itinerariesSheetVisible, setItinerariesSheetVisible] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState(SAVED_PLACES.map((place) => place.id));
  const [refreshing, setRefreshing] = useState(false);

  const itineraryPreviewLimit = SECTION_PREVIEW_LIMITS.itineraries ?? 3;
  const previewItineraries = savedItineraries.slice(0, itineraryPreviewLimit);
  const hasMoreItineraries = savedItineraries.length > itineraryPreviewLimit;
  const loadSavedItineraries = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) {
      setItinerariesLoading(true);
    }
    setItinerariesError("");
    try {
      const token = await getToken();
      if (!token) {
        setSavedItineraries([]);
        setItinerariesError("Sign in to see saved itineraries.");
        return;
      }
      const favorites = await dashboardApi.fetchFavorites(token);
      const plans = (favorites || [])
        .filter((item) => item.item_type === PLAN_FAVORITE_ITEM_TYPE)
        .map((item) => mapPlanFavoriteToCard(item, losAngelesTripImage));
      setSavedItineraries(plans);
    } catch (err) {
      setItinerariesError(err?.message || "Couldn't load saved itineraries.");
    } finally {
      if (!quiet) {
        setItinerariesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSavedItineraries();
  }, [loadSavedItineraries]);

  const onRefreshFavorites = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSavedItineraries({ quiet: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadSavedItineraries]);

  const toggleSaved = (setter, itemId) => {
    setter((currentIds) =>
      currentIds.includes(itemId)
        ? currentIds.filter((currentId) => currentId !== itemId)
        : [...currentIds, itemId]
    );
  };

  const toggleItineraryFavorite = async (itinerary) => {
    if (pendingItineraryIds.includes(itinerary.id)) {
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in required", "Sign in to manage saved itineraries.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => onNavigate?.("login") },
      ]);
      return;
    }

    setPendingItineraryIds((current) => [...current, itinerary.id]);
    setSavedItineraries((current) => current.filter((item) => item.id !== itinerary.id));

    try {
      await dashboardApi.removeFavorite(token, {
        itemType: PLAN_FAVORITE_ITEM_TYPE,
        provider: PLAN_FAVORITE_PROVIDER,
        providerItemId: String(itinerary.id),
      });
    } catch (err) {
      setSavedItineraries((current) =>
        current.some((item) => item.id === itinerary.id) ? current : [...current, itinerary]
      );
      Alert.alert("Couldn't update favorites", err?.message || "Please try again.");
    } finally {
      setPendingItineraryIds((current) => current.filter((id) => id !== itinerary.id));
    }
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
    if (sectionKey === "itineraries") {
      setActiveTab("itineraries");
      setItinerariesSheetVisible(true);
      return;
    }
    setActiveTab(sectionKey);
    scrollToSection(sectionKey);
  };

  const openItineraryFromFavorites = (itinerary) => {
    setItinerariesSheetVisible(false);
    onNavigate?.("itinerary", { planId: itinerary.planId });
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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: bottomNavPadding,
              paddingHorizontal: pagePaddingHorizontal,
              paddingTop: isPhone ? 12 : 18,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshFavorites} />
          }
        >
          <View style={[styles.pageInner, { maxWidth: pageMaxWidth }]}>
            <View style={styles.pageGlowTop} />
            <View style={styles.pageGlowBottom} />

            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={handleGoBack}
                style={[
                  styles.roundHeaderButton,
                  {
                    width: backButtonSize,
                    height: backButtonSize,
                    borderRadius: backButtonSize / 2,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={isPhone ? 22 : 26} color="#14253E" />
              </DimPressable>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  style={[
                    styles.headerActionButton,
                    isPhone && styles.headerActionButtonPhone,
                  ]}
                >
                  <Ionicons name="notifications-outline" size={headerIconSize} color="#111827" />
                  <View
                    style={[
                      styles.notificationDot,
                      isPhone && styles.notificationDotPhone,
                    ]}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                  style={[
                    styles.headerActionButton,
                    isPhone && styles.headerActionButtonPhone,
                  ]}
                >
                  <Ionicons name="person-circle-outline" size={profileIconSize} color="#111827" />
                </Pressable>
              </View>
            </View>

            <View style={[styles.heroSection, isPhone && styles.heroSectionPhone]}>
              <View style={[styles.heroCopyColumn, isPhone && styles.heroCopyColumnPhone]}>
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
                    Favorites
                  </Text>
                  <Ionicons name="heart" size={heroHeartSize} color="#8FA2FF" />
                </View>
                <Text
                  style={[
                    styles.heroSubtitle,
                    {
                      fontSize: heroSubtitleSize,
                      lineHeight: heroSubtitleSize + 8,
                      marginTop: isPhone ? 4 : 8,
                    },
                  ]}
                >
                  All your saved places, flights, and trips in one spot.
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
                <View style={styles.heroArtworkGlow} />
                <Image
                  source={heroArtworkImage}
                  resizeMode="contain"
                  style={styles.heroArtworkImage}
                />
              </View>
            </View>

            <FavoriteTabs
              activeTab={activeTab}
              onSelect={handleTabSelect}
              compact={isPhone}
              tight={useTightTabs}
            />

            <View onLayout={(event) => setSectionOffset("hotels", event)}>
              <SectionHeader
                title="Saved Hotels"
                iconName="bed-outline"
                iconFamily="material"
                compact={isPhone}
                onViewAll={() => handleViewAll("hotels")}
              />
              <View style={[styles.sectionStack, isPhone && styles.sectionStackPhone]}>
                {SAVED_HOTELS.map((hotel) => (
                  <HotelFavoriteCard
                    key={hotel.id}
                    hotel={hotel}
                    isSaved={savedHotelIds.includes(hotel.id)}
                    isStacked={shouldStackHotelCards}
                    compact={isPhone}
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
                compact={isPhone}
                onViewAll={() => handleViewAll("flights")}
              />
              <View style={[styles.sectionStack, isPhone && styles.sectionStackPhone]}>
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
                compact={isPhone}
                onViewAll={() => handleViewAll("itineraries")}
                showViewAll={
                  !itinerariesLoading && !itinerariesError && savedItineraries.length > 0
                }
              />
              <View style={[styles.sectionStack, isPhone && styles.sectionStackPhone]}>
                {itinerariesLoading ? (
                  <View style={styles.itinerariesStatusBlock}>
                    <ActivityIndicator size="small" color={COLORS.blue} />
                    <Text style={styles.itinerariesStatusText}>Loading saved trips…</Text>
                  </View>
                ) : null}

                {!itinerariesLoading && itinerariesError ? (
                  <View style={styles.itinerariesStatusBlock}>
                    <Text style={styles.itinerariesStatusText}>{itinerariesError}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry loading itineraries"
                      onPress={loadSavedItineraries}
                    >
                      <Text style={styles.itinerariesRetryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}

                {!itinerariesLoading && !itinerariesError && savedItineraries.length === 0 ? (
                  <View style={styles.itinerariesStatusBlock}>
                    <Text style={styles.itinerariesStatusText}>
                      Heart a trip on Itinerary to save it here.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open itinerary"
                      onPress={() => onNavigate?.("itinerary")}
                    >
                      <Text style={styles.itinerariesRetryText}>Open Itinerary</Text>
                    </Pressable>
                  </View>
                ) : null}

                {!itinerariesLoading &&
                  !itinerariesError &&
                  previewItineraries.map((itinerary) => (
                    <ItineraryFavoriteCard
                      key={itinerary.id}
                      itinerary={itinerary}
                      isSaved
                      compact={shouldCompactItineraryCards}
                      onPress={() => openItineraryFromFavorites(itinerary)}
                      onToggleSaved={() => toggleItineraryFavorite(itinerary)}
                    />
                  ))}

                {!itinerariesLoading && !itinerariesError && hasMoreItineraries ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View all saved itineraries"
                    onPress={() => handleViewAll("itineraries")}
                    style={styles.viewAllInlineButton}
                  >
                    <Text style={styles.viewAllInlineText}>
                      View all {savedItineraries.length} itineraries
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.blue} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View onLayout={(event) => setSectionOffset("places", event)}>
              <SectionHeader
                title="Saved Places"
                iconName="location-outline"
                compact={isPhone}
                onViewAll={() => handleViewAll("places")}
              />
              <View style={[styles.savedPlacesGrid, isPhone && styles.savedPlacesGridPhone]}>
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

        <FavoritesViewAllSheet
          visible={itinerariesSheetVisible}
          title={`Saved Itineraries (${savedItineraries.length})`}
          heightRatio={VIEW_ALL_SHEET_HEIGHT_RATIO}
          onClose={() => setItinerariesSheetVisible(false)}
        >
          {savedItineraries.length === 0 ? (
            <Text style={styles.itinerariesStatusText}>No saved itineraries yet.</Text>
          ) : (
            savedItineraries.map((itinerary) => (
              <ItineraryFavoriteCard
                key={`sheet-${itinerary.id}`}
                itinerary={itinerary}
                isSaved
                compact
                onPress={() => openItineraryFromFavorites(itinerary)}
                onToggleSaved={() => toggleItineraryFavorite(itinerary)}
              />
            ))
          )}
        </FavoritesViewAllSheet>

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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    flexShrink: 0,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  headerActionButton: {
    width: 44,
    height: 44,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionButtonPhone: {
    width: 40,
    height: 40,
    marginLeft: 2,
  },

  notificationDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF7A32",
  },

  notificationDotPhone: {
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  heroSection: {
    marginTop: 10,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    overflow: "visible",
  },

  heroSectionPhone: {
    marginTop: 8,
    gap: 4,
  },

  heroCopyColumn: {
    flex: 1,
    minWidth: 0,
    maxWidth: 400,
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    zIndex: 2,
  },

  heroCopyColumnPhone: {
    maxWidth: "54%",
    paddingTop: 0,
    paddingBottom: 0,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  heroTitle: {
    flexShrink: 1,
    fontWeight: "800",
    letterSpacing: -1.4,
    color: COLORS.text,
  },

  heroSubtitle: {
    maxWidth: 340,
    color: COLORS.subtext,
  },

  heroArtworkWrap: {
    flexShrink: 0,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },

  heroArtworkGlow: {
    position: "absolute",
    right: 14,
    bottom: 10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(111, 170, 255, 0.14)",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  tabsShell: {
    marginTop: 12,
    marginBottom: 8,
    padding: 5,
    borderRadius: 24,
    backgroundColor: COLORS.card,
  },

  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  tabsRowTight: {
    gap: 3,
  },

  tabButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: "#FFFFFF",
  },

  tabButtonActive: {
    backgroundColor: COLORS.blue,
  },

  tabButtonCompact: {
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: 16,
  },

  tabButtonTight: {
    gap: 2,
    borderRadius: 14,
    minHeight: 38,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },

  tabLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
    textAlign: "center",
  },

  tabLabelActive: {
    color: "#FFFFFF",
  },

  tabLabelCompact: {
    fontSize: 12,
  },

  tabLabelTight: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.15,
  },

  sectionHeaderRow: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeaderRowCompact: {
    marginTop: 16,
    marginBottom: 6,
  },

  sectionHeaderCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },

  sectionHeaderIconWrap: {
    width: 24,
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#14253E",
    letterSpacing: -0.4,
  },

  sectionTitleCompact: {
    fontSize: 15,
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },

  sectionLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.blue,
  },

  sectionLinkTextCompact: {
    fontSize: 13,
  },

  sectionStack: {
    gap: 12,
  },

  sectionStackPhone: {
    gap: 10,
  },

  itinerariesStatusBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 6,
  },

  itinerariesStatusText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.subtext,
    textAlign: "center",
    fontWeight: "500",
  },

  itinerariesRetryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.blue,
  },

  viewAllInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },

  viewAllInlineText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.blue,
  },

  viewAllOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(16, 33, 59, 0.35)",
  },

  viewAllBackdrop: {
    flex: 1,
  },

  viewAllSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },

  viewAllHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D5DEEC",
    marginBottom: 12,
  },

  viewAllHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  viewAllTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  viewAllScroll: {
    flex: 1,
  },

  viewAllScrollContent: {
    gap: 14,
    paddingBottom: 24,
  },

  cardHovered: {
    backgroundColor: "#F8FBFF",
  },

  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.98,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EEF9",
    flexShrink: 0,
  },

  iconButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  iconButtonFilled: {
    backgroundColor: "#F4F7FC",
  },

  iconButtonPressed: {
    opacity: 0.88,
  },

  hotelCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    padding: 10,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  hotelCardCompact: {
    gap: 10,
    padding: 8,
    borderRadius: 16,
  },

  hotelCardStacked: {
    flexDirection: "column",
  },

  hotelImageWrap: {
    width: "34%",
    minWidth: 118,
    maxWidth: 148,
    alignSelf: "stretch",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
    backgroundColor: "#E8EEF6",
  },

  hotelImageWrapCompact: {
    width: "34%",
    minWidth: 112,
    maxWidth: 132,
    borderRadius: 12,
  },

  hotelImageWrapStacked: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    height: 160,
    alignSelf: "auto",
  },

  hotelImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  hotelBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },

  hotelBadgeCompact: {
    top: 6,
    left: 6,
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
  },

  hotelBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  hotelBadgeTextCompact: {
    fontSize: 10,
  },

  hotelContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },

  cardHeadlineCopy: {
    flex: 1,
    minWidth: 0,
  },

  hotelName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  hotelNameCompact: {
    fontSize: 15,
  },

  metaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaRowCompact: {
    marginTop: 3,
    gap: 3,
  },

  metaText: {
    fontSize: 13,
    color: COLORS.subtext,
    flexShrink: 1,
  },

  metaTextCompact: {
    fontSize: 12,
  },

  hotelStatsRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  hotelStatsRowCompact: {
    marginTop: 6,
    gap: 4,
  },

  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.blue,
  },

  ratingTextCompact: {
    fontSize: 12,
  },

  reviewText: {
    fontSize: 12,
    color: COLORS.subtext,
  },

  reviewTextCompact: {
    fontSize: 11,
  },

  metaDivider: {
    fontSize: 12,
    color: "#94A3B8",
  },

  metaDividerCompact: {
    fontSize: 11,
  },

  priceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    flexShrink: 0,
  },

  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.blue,
  },

  priceTextCompact: {
    fontSize: 14,
  },

  priceSuffix: {
    fontSize: 13,
    color: COLORS.text,
  },

  priceSuffixCompact: {
    fontSize: 12,
  },

  amenitiesRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  amenitiesRowCompact: {
    marginTop: 6,
    gap: 6,
  },

  amenityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  amenityPillCompact: {
    gap: 3,
  },

  amenityText: {
    fontSize: 12,
    color: COLORS.text,
  },

  amenityTextCompact: {
    fontSize: 11,
  },

  noteBox: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E7FB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  noteBoxCompact: {
    marginTop: 8,
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },

  noteRobotImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },

  noteRobotImageCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.text,
  },

  noteTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },

  noteLabel: {
    fontWeight: "800",
  },

  flightRowCard: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  flightRowCardCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },

  flightRowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },

  flightAirlineCol: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "20%",
    minWidth: 0,
    maxWidth: 86,
  },

  flightAirlineColCompact: {
    flexBasis: "19%",
    maxWidth: 72,
  },

  airlineLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
    minWidth: 0,
  },

  airlineLogoText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  airlineLogoTextCompact: {
    fontSize: 12,
  },

  anaLogoText: {
    color: "#2557D6",
  },

  anaStripe: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2557D6",
    transform: [{ skewX: "-24deg" }],
  },

  anaStripeCompact: {
    width: 11,
    height: 3,
  },

  jalMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },

  jalMarkCompact: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  jalMarkText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#D53032",
  },

  jalMarkTextCompact: {
    fontSize: 6,
  },

  koreanMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E8EEF9",
  },

  koreanMarkCompact: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  koreanMarkTop: {
    flex: 1,
    backgroundColor: "#E03A3E",
  },

  koreanMarkBottom: {
    flex: 1,
    backgroundColor: "#2452D4",
  },

  flightAirlineName: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 11,
    color: COLORS.subtext,
  },

  flightAirlineNameCompact: {
    fontSize: 8,
    lineHeight: 10,
  },

  flightDepCol: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "16%",
    minWidth: 52,
    maxWidth: 68,
  },

  flightArrCol: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "16%",
    minWidth: 56,
    maxWidth: 72,
    alignItems: "flex-end",
  },

  flightTimeColCompact: {
    flexBasis: "15%",
    minWidth: 48,
    maxWidth: 60,
  },

  flightTimeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.2,
  },

  flightTimeTextCompact: {
    fontSize: 11,
  },

  arrivalTimeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },

  flightOffsetText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#EF4444",
  },

  flightOffsetTextCompact: {
    fontSize: 8,
  },

  flightCodeText: {
    marginTop: 1,
    fontSize: 10,
    color: COLORS.subtext,
  },

  flightCodeTextCompact: {
    fontSize: 9,
  },

  flightRouteCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "23%",
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 2,
  },

  flightRouteColCompact: {
    flexBasis: "22%",
    gap: 1,
  },

  flightDurationText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.subtext,
  },

  flightDurationTextCompact: {
    fontSize: 8,
  },

  routeTrackRow: {
    width: "100%",
    maxWidth: 78,
    flexDirection: "row",
    alignItems: "center",
  },

  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#AFC3E3",
  },

  routeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#93ADD3",
    backgroundColor: "#FFFFFF",
  },

  routeMidDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#93ADD3",
  },

  flightStopText: {
    fontSize: 9,
    fontWeight: "700",
  },

  flightStopTextCompact: {
    fontSize: 8,
  },

  flightPriceCol: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "13%",
    minWidth: 48,
    maxWidth: 58,
    alignItems: "flex-end",
  },

  flightPriceColCompact: {
    flexBasis: "12%",
    minWidth: 44,
    maxWidth: 52,
  },

  flightPriceText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.blue,
  },

  flightPriceTextCompact: {
    fontSize: 12,
  },

  flightPriceMeta: {
    marginTop: 0,
    fontSize: 8,
    color: COLORS.subtext,
  },

  flightPriceMetaCompact: {
    fontSize: 7,
  },

  flightHeartCol: {
    width: 30,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  itineraryCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
  },

  itineraryCardCompact: {
    padding: 10,
    paddingBottom: 12,
    borderRadius: 16,
  },

  itineraryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  itineraryCompactTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  itineraryMediaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  itineraryMediaGroupCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },

  itineraryImage: {
    width: 112,
    height: 76,
    borderRadius: 12,
  },

  itineraryImageCompact: {
    width: 78,
    height: 64,
    borderRadius: 10,
  },

  itineraryDateBlock: {
    width: 56,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F7FAFF",
  },

  itineraryDateBlockCompact: {
    width: 48,
    minHeight: 64,
    borderRadius: 10,
    paddingVertical: 6,
  },

  itineraryMonthText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.blue,
  },

  itineraryMonthTextCompact: {
    fontSize: 9,
  },

  itineraryDayText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.8,
  },

  itineraryDayTextCompact: {
    fontSize: 18,
    lineHeight: 20,
  },

  itineraryYearText: {
    fontSize: 10,
    color: COLORS.subtext,
  },

  itineraryYearTextCompact: {
    fontSize: 9,
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
    gap: 4,
    minWidth: 0,
  },

  itineraryTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.2,
  },

  itineraryTitleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },

  itineraryMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.subtext,
  },

  itineraryMetaCompact: {
    fontSize: 12,
    lineHeight: 16,
  },

  itineraryMetaDivider: {
    color: "#94A3B8",
  },

  itineraryTagsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  itineraryTagsRowCompact: {
    marginTop: 8,
    gap: 5,
  },

  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#F1F6FF",
  },

  tagChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
  },

  itineraryActions: {
    width: 34,
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },

  savedPlacesGrid: {
    flexDirection: "column",
    gap: 10,
  },

  savedPlacesGridPhone: {
    gap: 8,
  },

  savedPlaceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E3ECFA",
    width: "100%",
  },

  savedPlaceCardCompact: {
    gap: 8,
    padding: 8,
    borderRadius: 14,
  },

  savedPlaceImageShell: {
    width: 72,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#F4F7FD",
    position: "relative",
  },

  savedPlaceImageShellCompact: {
    width: 64,
    height: 52,
    borderRadius: 8,
  },

  savedPlaceImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  savedPlaceCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },

  savedPlaceHeartCol: {
    width: 32,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  savedPlaceTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  savedPlaceTitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },

  savedPlaceMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.subtext,
  },

  savedPlaceMetaCompact: {
    fontSize: 11,
    lineHeight: 15,
  },

  savedPlaceDivider: {
    color: "#94A3B8",
  },
});
