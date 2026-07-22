import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
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

import { DEFAULT_LAT, DEFAULT_LNG, reverseGeocodeLabel } from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";
import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import MapCanvas from "./shared/MapCanvas";

const heroArtworkImage = require("../assets/images/maps/maps-hero-art.png");

const COLORS = {
  background: "#EAF2FC",
  card: "#FFFFFF",
  border: "#D6E4F8",
  text: "#10213B",
  subtext: "#51607D",
  blue: "#1F78FF",
};

const HERO_ASPECT_RATIO = 418 / 168;
// Match the smaller Maps place thumbs (182×62) so Meiji/Tsukiji are not over-cropped.
// Higher-res favorites images still look sharp with a gentle center crop.
const SAVED_PLACE_IMAGE_ASPECT = 182 / 62;
const DEFAULT_MAP_DELTA = 0.08;
const EXPANDED_MAP_SHEET_RATIO = 0.88;

function buildMapRegion(lat, lng) {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: DEFAULT_MAP_DELTA,
    longitudeDelta: DEFAULT_MAP_DELTA,
  };
}

const MAP_ACTIONS = [
  {
    id: "directions",
    title: "Directions",
    description: "Get step-by-step routes",
    iconFamily: "ion",
    iconName: "navigate-outline",
    iconColor: "#1F78FF",
    iconBackground: "#EAF2FF",
  },
  {
    id: "transit",
    title: "Transit",
    description: "Bus, train, metro schedules",
    iconFamily: "ion",
    iconName: "train-outline",
    iconColor: "#19A64A",
    iconBackground: "#EAF9F0",
  },
  {
    id: "nearby",
    title: "Explore Nearby",
    description: "See places around you",
    iconFamily: "ion",
    iconName: "star-outline",
    iconColor: "#FF9A24",
    iconBackground: "#FFF4E4",
  },
  {
    id: "save",
    title: "Save Place",
    description: "Save and organize favorite spots",
    iconFamily: "ion",
    iconName: "location-outline",
    iconColor: "#FF5A4E",
    iconBackground: "#FFF0EC",
  },
];

const EXPLORE_CATEGORIES = [
  {
    id: "restaurants",
    title: "Restaurants",
    meta: "1.2 km",
    iconFamily: "ion",
    iconName: "restaurant-outline",
    iconColor: "#8A58F2",
    iconBackground: "#F1EAFF",
  },
  {
    id: "attractions",
    title: "Attractions",
    meta: "2.4 km",
    iconFamily: "ion",
    iconName: "camera-outline",
    iconColor: "#1FA85B",
    iconBackground: "#EAF8F0",
  },
  {
    id: "shopping",
    title: "Shopping",
    meta: "1.6 km",
    iconFamily: "ion",
    iconName: "bag-handle-outline",
    iconColor: "#1F78FF",
    iconBackground: "#EAF2FF",
  },
  {
    id: "cafes",
    title: "Cafes",
    meta: "950 m",
    iconFamily: "ion",
    iconName: "cafe-outline",
    iconColor: "#FF9A24",
    iconBackground: "#FFF4E4",
  },
  {
    id: "hotels",
    title: "Hotels",
    meta: "1.3 km",
    iconFamily: "material",
    iconName: "bed-outline",
    iconColor: "#FF5A4E",
    iconBackground: "#FFF0EC",
  },
  {
    id: "more",
    title: "More",
    meta: "Categories",
    iconFamily: "ion",
    iconName: "ellipsis-horizontal",
    iconColor: "#64748B",
    iconBackground: "#F3F6FB",
  },
];

const NEARBY_ESSENTIALS = [
  {
    id: "hospitals",
    title: "Hospitals",
    meta: "1.1 km",
    iconFamily: "ion",
    iconName: "medical-outline",
    iconColor: "#FF5A4E",
    iconBackground: "#FFF0EC",
  },
  {
    id: "pharmacies",
    title: "Pharmacies",
    meta: "800 m",
    iconFamily: "ion",
    iconName: "medkit-outline",
    iconColor: "#8A58F2",
    iconBackground: "#F1EAFF",
  },
  {
    id: "transit-stations",
    title: "Transit Stations",
    meta: "450 m",
    iconFamily: "ion",
    iconName: "train-outline",
    iconColor: "#1F78FF",
    iconBackground: "#EAF2FF",
  },
  {
    id: "grocery-stores",
    title: "Grocery Stores",
    meta: "1.2 km",
    iconFamily: "ion",
    iconName: "cart-outline",
    iconColor: "#1FA85B",
    iconBackground: "#EAF8F0",
  },
  {
    id: "atms",
    title: "ATMs",
    meta: "900 m",
    iconFamily: "ion",
    iconName: "card-outline",
    iconColor: "#FF9A24",
    iconBackground: "#FFF4E4",
  },
];

const SAVED_PLACES = [
  {
    id: "tokyo-tower",
    title: "Tokyo Tower",
    meta: "Landmark",
    distance: "2.1 km",
    // Prefer the higher-resolution existing favorites artwork for the same place.
    image: require("../assets/images/favorites/favorites-place-tokyo-tower.png"),
  },
  {
    id: "shibuya-crossing",
    title: "Shibuya Crossing",
    meta: "Attraction",
    distance: "1.0 km",
    image: require("../assets/images/favorites/favorites-place-shibuya-crossing.png"),
  },
  {
    id: "meiji-jingu-shrine",
    title: "Meiji Jingu Shrine",
    meta: "Attraction",
    distance: "3.2 km",
    // 182×62 source — keep near-native display size; contain avoids over-zoom.
    image: require("../assets/images/maps/maps-meiji-shrine.png"),
    imageResizeMode: "contain",
  },
  {
    id: "tsukiji-outer-market",
    title: "Tsukiji Outer Market",
    meta: "Food",
    distance: "2.7 km",
    image: require("../assets/images/maps/maps-tsukiji-market.png"),
    imageResizeMode: "contain",
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

function renderIcon(iconFamily, iconName, color, size) {
  if (iconFamily === "material") {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }

  return <Ionicons name={iconName} size={size} color={color} />;
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
      <Image source={heroArtworkImage} resizeMode="contain" style={styles.heroArtworkImage} />
    </View>
  );
}

function TitleIllustration({ size = 40, iconSize = 22 }) {
  const pinSize = Math.max(14, Math.round(size * 0.36));
  return (
    <View style={[styles.titleIllustrationWrap, { width: size, height: size, borderRadius: size * 0.34 }]}>
      <Ionicons name="map-outline" size={iconSize} color={COLORS.blue} />
      <View
        style={[
          styles.titleIllustrationPin,
          { width: pinSize, height: pinSize, borderRadius: pinSize / 2 },
        ]}
      >
        <Ionicons name="location" size={Math.max(9, Math.round(pinSize * 0.62))} color="#FFFFFF" />
      </View>
    </View>
  );
}

function SearchActionButton({ item, selectedId, onPress, compact = false }) {
  const isSelected = selectedId === item.id;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item.id)}
      style={[
        styles.searchActionButton,
        compact && styles.searchActionButtonCompact,
        isSelected && styles.searchActionButtonSelected,
      ]}
    >
      {renderIcon(
        item.iconFamily,
        item.iconName,
        isSelected ? "#FFFFFF" : COLORS.blue,
        compact ? 16 : 18
      )}
      <Text
        style={[
          styles.searchActionLabel,
          compact && styles.searchActionLabelCompact,
          isSelected && styles.searchActionLabelSelected,
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function ActionPanel({ isPhone = false, isCompactPhone = false }) {
  const iconSize = isCompactPhone ? 13 : isPhone ? 14 : 16;

  return (
    <View style={[styles.actionRowCard, cardShadowStyle, isPhone && styles.actionRowCardPhone]}>
      {MAP_ACTIONS.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 ? (
            <View style={[styles.actionDivider, isPhone && styles.actionDividerPhone]} />
          ) : null}
          <DimPressable
            accessibilityRole="button"
            onPress={() => {}}
            style={[styles.actionCell, isPhone && styles.actionCellPhone]}
          >
            <View
              style={[
                styles.actionIconWrap,
                isPhone && styles.actionIconWrapPhone,
                { backgroundColor: item.iconBackground },
              ]}
            >
              {renderIcon(item.iconFamily, item.iconName, item.iconColor, iconSize)}
            </View>
            <Text
              style={[
                styles.actionTitle,
                isPhone && styles.actionTitlePhone,
                item.id === "nearby" && styles.actionTitleNearby,
                item.id === "nearby" && isPhone && styles.actionTitleNearbyPhone,
              ]}
            >
              {item.title}
            </Text>
            <Text style={[styles.actionDescription, isPhone && styles.actionDescriptionPhone]}>
              {item.description}
            </Text>
          </DimPressable>
        </Fragment>
      ))}
    </View>
  );
}

function SectionHeader({ title, subtitle = null, onPress, showViewAll = true }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>

      {showViewAll ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.sectionLinkButton}>
          <Text style={styles.sectionLinkText}>View all</Text>
          <Ionicons name="chevron-forward" size={15} color={COLORS.blue} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ExploreCard({ item, width, isPhone = false, horizontal = false, dense = false }) {
  const isLongEssentialTitle =
    dense && (item.id === "transit-stations" || item.id === "grocery-stores");

  return (
    <DimPressable
      accessibilityRole="button"
      onPress={() => {}}
      style={[
        styles.categoryCard,
        cardShadowStyle,
        width ? { width } : null,
        isPhone && styles.categoryCardPhone,
        dense && styles.categoryCardDense,
        horizontal && styles.categoryCardHorizontal,
      ]}
    >
      <View
        style={[
          styles.categoryIconWrap,
          isPhone && styles.categoryIconWrapPhone,
          dense && styles.categoryIconWrapDense,
          { backgroundColor: item.iconBackground },
        ]}
      >
        {renderIcon(
          item.iconFamily,
          item.iconName,
          item.iconColor,
          dense ? (isPhone ? 15 : 17) : isPhone ? 16 : 18
        )}
      </View>
      <Text
        style={[
          styles.categoryCardTitle,
          isPhone && styles.categoryCardTitlePhone,
          dense && styles.categoryCardTitleDense,
          isLongEssentialTitle && styles.categoryCardTitleLongEssential,
        ]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text
        style={[
          styles.categoryCardMeta,
          isPhone && styles.categoryCardMetaPhone,
          dense && styles.categoryCardMetaDense,
        ]}
        numberOfLines={1}
      >
        {item.meta}
      </Text>
    </DimPressable>
  );
}

function ExploreSection({ items, isPhone, cardWidth, dense = false }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalCardsRow}
    >
      {items.map((item) => (
        <ExploreCard
          key={item.id}
          item={item}
          width={cardWidth}
          isPhone={isPhone}
          horizontal
          dense={dense}
        />
      ))}
    </ScrollView>
  );
}

function SavedPlaceCard({ item, width, isSaved, onToggleSaved, isPhone = false }) {
  // Keep thumbs near native size for the 182×62 Maps assets to avoid soft upscaling.
  const imageHeight = Math.round(width / SAVED_PLACE_IMAGE_ASPECT);

  return (
    <View
      style={[
        styles.savedPlaceCard,
        cardShadowStyle,
        { width },
        isPhone && styles.savedPlaceCardPhone,
      ]}
    >
      <View
        style={[
          styles.savedPlaceImageWrap,
          isPhone && styles.savedPlaceImageWrapPhone,
          { height: imageHeight },
        ]}
      >
        <Image
          source={item.image}
          resizeMode={item.imageResizeMode || "cover"}
          style={styles.savedPlaceImage}
        />
        <DimPressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
          onPress={() => onToggleSaved(item.id)}
          style={[styles.savedPlaceHeart, isPhone && styles.savedPlaceHeartPhone]}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={isPhone ? 13 : 15}
            color={isSaved ? "#FF5A4E" : COLORS.text}
          />
        </DimPressable>
      </View>

      <View style={[styles.savedPlaceCopy, isPhone && styles.savedPlaceCopyPhone]}>
        <Text style={[styles.savedPlaceTitle, isPhone && styles.savedPlaceTitlePhone]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.savedPlaceMeta, isPhone && styles.savedPlaceMetaPhone]} numberOfLines={1}>
          {item.meta} <Text style={styles.savedPlaceSeparator}>•</Text> {item.distance}
        </Text>
      </View>
    </View>
  );
}

function TripBanner({ onPress, isPhone }) {
  return (
    <View style={[styles.tripBanner, cardShadowStyle, isPhone && styles.tripBannerPhone]}>
      <View style={[styles.tripBannerIllustration, isPhone && styles.tripBannerIllustrationPhone]}>
        <View style={[styles.tripRouteLoop, isPhone && styles.tripRouteLoopPhone]} />
        <View style={[styles.tripPin, styles.tripPinStart, isPhone && styles.tripPinPhone]}>
          <Ionicons name="location" size={isPhone ? 14 : 16} color="#FFFFFF" />
        </View>
        <View style={[styles.tripPin, styles.tripPinEnd, isPhone && styles.tripPinPhone]}>
          <Ionicons name="location" size={isPhone ? 14 : 16} color="#FFFFFF" />
        </View>
      </View>

      <View style={[styles.tripBannerCopy, isPhone && styles.tripBannerCopyPhone]}>
        <Text style={[styles.tripBannerTitle, isPhone && styles.tripBannerTitlePhone]}>
          Plan Your Trip on Map
        </Text>
        <Text style={[styles.tripBannerText, isPhone && styles.tripBannerTextPhone]}>
          See all your saved places and itinerary stops in one view.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.tripBannerButton, isPhone && styles.tripBannerButtonPhone]}
      >
        <Text
          style={[styles.tripBannerButtonText, isPhone && styles.tripBannerButtonTextPhone]}
          numberOfLines={1}
        >
          View My Trip Map
        </Text>
        <Ionicons name="arrow-forward" size={isPhone ? 16 : 18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function MapOverlayControls({ onRecenter, onExpand, isPhone = false }) {
  const controlSize = isPhone ? 32 : 36;
  const iconSize = isPhone ? 16 : 18;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recenter map on your location"
        onPress={onRecenter}
        style={[
          styles.mapRecenterButton,
          {
            width: controlSize,
            height: controlSize,
            borderRadius: controlSize / 2,
            top: isPhone ? 8 : 10,
            right: isPhone ? 8 : 10,
          },
        ]}
      >
        <Ionicons name="locate-outline" size={iconSize} color={COLORS.blue} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Expand map"
        onPress={onExpand}
        style={[
          styles.mapExpandButton,
          {
            width: controlSize,
            height: controlSize,
            borderRadius: controlSize / 2,
            top: isPhone ? 46 : 52,
            right: isPhone ? 8 : 10,
          },
        ]}
      >
        <Ionicons name="expand-outline" size={iconSize} color={COLORS.blue} />
      </Pressable>
    </>
  );
}

function MapCard({
  height,
  region,
  locationLabel,
  locationHint,
  mapRef,
  onRecenter,
  onExpand,
  isPhone = false,
}) {
  return (
    <View style={[styles.mapCard, cardShadowStyle, { height }, isPhone && styles.mapCardPhone]}>
      <MapCanvas ref={mapRef} region={region} locationLabel={locationLabel} style={styles.mapCanvas} />

      <View style={[styles.mapLocationChip, isPhone && styles.mapLocationChipPhone]}>
        <View style={styles.mapLocationChipCopy}>
          <Text style={[styles.mapLocationChipTitle, isPhone && styles.mapLocationChipTitlePhone]} numberOfLines={1}>
            {locationLabel}
          </Text>
          {locationHint ? (
            <Text style={styles.mapLocationChipHint} numberOfLines={1}>
              {locationHint}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={isPhone ? 14 : 16} color={COLORS.subtext} />
      </View>

      <MapOverlayControls onRecenter={onRecenter} onExpand={onExpand} isPhone={isPhone} />
    </View>
  );
}

function MapExpandedSheet({
  visible,
  onClose,
  region,
  locationLabel,
  mapRef,
  onRecenter,
  sheetHeight,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.mapSheetOverlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close expanded map"
          onPress={onClose}
          style={styles.mapSheetBackdrop}
        />
        <View style={[styles.mapSheet, { height: sheetHeight }]}>
          <View style={styles.mapSheetHandle} />
          <View style={styles.mapSheetHeader}>
            <Text style={styles.mapSheetTitle} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close map"
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <View style={styles.mapSheetMapWrap}>
            <MapCanvas
              ref={mapRef}
              region={region}
              locationLabel={locationLabel}
              style={styles.mapCanvas}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recenter map on your location"
              onPress={onRecenter}
              style={styles.mapRecenterButton}
            >
              <Ionicons name="locate-outline" size={22} color={COLORS.blue} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MapsScreen({ onNavigate, onBack }) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width, height: windowHeight } = useWindowDimensions();
  const { location, status: locationStatus, refreshLocation } = useUserLocation();
  const inlineMapRef = useRef(null);
  const expandedMapRef = useRef(null);
  const didInitialCenterRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToolbarId, setSelectedToolbarId] = useState(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState(SAVED_PLACES.map((place) => place.id));
  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  const region = useMemo(
    () => buildMapRegion(mapCenter.lat, mapCenter.lng),
    [mapCenter.lat, mapCenter.lng]
  );

  const animateMapsToRegion = useCallback((nextRegion) => {
    inlineMapRef.current?.animateToRegion(nextRegion);
    expandedMapRef.current?.animateToRegion(nextRegion);
  }, []);

  // One-time initial center on the device GPS (or keep DEFAULT_* fallback).
  // After this, the user can pan/zoom freely; only the locate button recenters.
  useEffect(() => {
    let cancelled = false;

    async function centerOnInitialLocation() {
      if (didInitialCenterRef.current) {
        return;
      }

      let nextLocation = location;
      if (nextLocation?.lat == null || nextLocation?.lng == null) {
        nextLocation = await refreshLocation();
      }

      if (cancelled || didInitialCenterRef.current) {
        return;
      }

      didInitialCenterRef.current = true;

      if (nextLocation?.lat == null || nextLocation?.lng == null) {
        return;
      }

      const center = { lat: nextLocation.lat, lng: nextLocation.lng };
      setMapCenter(center);
      animateMapsToRegion(buildMapRegion(center.lat, center.lng));
    }

    centerOnInitialLocation();

    return () => {
      cancelled = true;
    };
    // Mount-only: do not re-run when `location` updates after the user pans.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time initial center
  }, [animateMapsToRegion, refreshLocation]);

  useEffect(() => {
    if (!mapExpanded) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      expandedMapRef.current?.animateToRegion(region);
    });

    return () => cancelAnimationFrame(frame);
  }, [mapExpanded, region]);

  const handleRecenter = useCallback(async () => {
    const nextLocation = await refreshLocation();
    const center = nextLocation ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    setMapCenter(center);
    animateMapsToRegion(buildMapRegion(center.lat, center.lng));
  }, [animateMapsToRegion, refreshLocation]);

  useEffect(() => {
    let cancelled = false;

    async function labelLocation() {
      if (!location && locationStatus === "loading") {
        setLocationLabel("Locating…");
        return;
      }

      try {
        const resolved = await reverseGeocodeLabel(mapCenter.lat, mapCenter.lng);
        if (!cancelled) {
          setLocationLabel(resolved || (location ? "Current area" : "Default area"));
        }
      } catch {
        if (!cancelled) {
          setLocationLabel(location ? "Current area" : "Default area");
        }
      }
    }

    labelLocation();
    return () => {
      cancelled = true;
    };
  }, [location, locationStatus, mapCenter.lat, mapCenter.lng]);

  const isPhone = width < 520;
  const isCompactPhone = width < 400;
  const stackSearchControls = width < 360;
  const pageMaxWidth = width >= 1100 ? 1040 : 980;
  const pagePaddingHorizontal = isCompactPhone ? 14 : isPhone ? 16 : 18;
  const pageWidth = Math.min(Math.max(width - pagePaddingHorizontal * 2, 280), pageMaxWidth);
  // Wide enough that labels like "Restaurants" stay whole; still show several cards.
  const categoryCardWidth = isCompactPhone ? 96 : isPhone ? 102 : 112;
  // Wide enough for "Transit Stations" / "Grocery Stores" on one line.
  const essentialsCardWidth = isCompactPhone ? 122 : isPhone ? 130 : 140;
  const savedCardWidth = isCompactPhone
    ? Math.min(Math.round(pageWidth * 0.44), 158)
    : isPhone
      ? Math.min(Math.round(pageWidth * 0.42), 168)
      : Math.min(Math.round(pageWidth * 0.24), 180);
  // Wide short map panel (reference proportion), not a tall near-square.
  const mapHeight = isPhone
    ? Math.round(Math.min(pageWidth * 0.48, 196))
    : Math.round(Math.min(pageWidth * 0.36, 320));
  const expandedMapSheetHeight = Math.round(windowHeight * EXPANDED_MAP_SHEET_RATIO);

  // Maps hero art is 418×168 — size near natural resolution (avoid soft upscaling).
  const heroArtworkWidth = isCompactPhone
    ? Math.min(Math.round(width * 0.44), 158)
    : isPhone
      ? Math.min(Math.round(width * 0.42), 180)
      : width < 900
        ? Math.min(Math.round(width * 0.32), 260)
        : Math.min(Math.round(width * 0.26), 320);
  const heroTitleSize = isCompactPhone ? 28 : isPhone ? 32 : width < 900 ? 38 : 42;
  const heroSubtitleSize = isCompactPhone ? 12 : isPhone ? 12 : 14;
  const heroSubtitleLineHeight = isCompactPhone ? 16 : isPhone ? 17 : 20;
  const backButtonSize = isCompactPhone ? 40 : isPhone ? 44 : 48;
  const headerIconSize = isPhone ? 24 : 26;
  const profileIconSize = isPhone ? 30 : 32;
  const titleIconSize = isCompactPhone ? 28 : isPhone ? 32 : 36;
  const titleIconGlyphSize = isCompactPhone ? 16 : isPhone ? 18 : 20;
  const locationHint =
    locationStatus === "denied" ? "enable location for GPS" : null;
  const toolbarItems = [
    {
      id: "categories",
      label: "Categories",
      iconFamily: "ion",
      iconName: "grid-outline",
    },
    {
      id: "lists",
      label: "My Lists",
      iconFamily: "ion",
      iconName: "bookmark-outline",
    },
  ];

  const handleGoBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    onNavigate?.("home");
  };

  const handleToggleSaved = (placeId) => {
    setSavedPlaceIds((currentSavedIds) =>
      currentSavedIds.includes(placeId)
        ? currentSavedIds.filter((currentId) => currentId !== placeId)
        : [...currentSavedIds, placeId]
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
              paddingTop: isPhone ? 12 : 16,
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
                <View style={styles.heroTitleRow}>
                  <Text
                    style={[
                      styles.heading,
                      {
                        fontSize: heroTitleSize,
                        lineHeight: heroTitleSize + 2,
                      },
                    ]}
                  >
                    Maps
                  </Text>
                  <TitleIllustration size={titleIconSize} iconSize={titleIconGlyphSize} />
                </View>
                <Text
                  style={[
                    styles.subtitle,
                    {
                      fontSize: heroSubtitleSize,
                      lineHeight: heroSubtitleLineHeight,
                      marginTop: isPhone ? 4 : 6,
                    },
                  ]}
                >
                  {"Find places, get directions, and explore your destination."}
                </Text>
              </View>

              <HeroArtwork width={heroArtworkWidth} aspectRatio={HERO_ASPECT_RATIO} />
            </View>

            <View
              style={[
                styles.searchControlsRow,
                stackSearchControls && styles.searchControlsRowStacked,
                isPhone && styles.searchControlsRowPhone,
              ]}
            >
              <View
                style={[
                  styles.searchInputWrap,
                  cardShadowStyle,
                  isPhone && styles.searchInputWrapPhone,
                  !stackSearchControls && styles.searchInputWrapInline,
                ]}
              >
                <Ionicons name="search-outline" size={isPhone ? 18 : 20} color={COLORS.subtext} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for a place, address, or destination"
                  placeholderTextColor="#8F9BB3"
                  selectionColor={COLORS.blue}
                  style={[styles.searchInput, isPhone && styles.searchInputPhone]}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {}}
                  style={[styles.filterButton, isPhone && styles.filterButtonPhone]}
                >
                  <Ionicons name="options-outline" size={isPhone ? 16 : 18} color={COLORS.blue} />
                </Pressable>
              </View>

              <View
                style={[
                  styles.searchActionsRow,
                  stackSearchControls && styles.searchActionsRowStacked,
                ]}
              >
                {toolbarItems.map((item) => (
                  <SearchActionButton
                    key={item.id}
                    item={item}
                    selectedId={selectedToolbarId}
                    onPress={setSelectedToolbarId}
                    compact={isPhone}
                  />
                ))}
              </View>
            </View>

            <MapCard
              height={mapHeight}
              region={region}
              locationLabel={locationLabel}
              locationHint={locationHint}
              mapRef={inlineMapRef}
              onRecenter={handleRecenter}
              onExpand={() => setMapExpanded(true)}
              isPhone={isPhone}
            />

            <MapExpandedSheet
              visible={mapExpanded}
              onClose={() => setMapExpanded(false)}
              region={region}
              locationLabel={locationLabel}
              mapRef={expandedMapRef}
              onRecenter={handleRecenter}
              sheetHeight={expandedMapSheetHeight}
            />

            <ActionPanel isPhone={isPhone} isCompactPhone={isCompactPhone} />

            <SectionHeader title="Explore Nearby" onPress={() => {}} />
            <ExploreSection items={EXPLORE_CATEGORIES} isPhone={isPhone} cardWidth={categoryCardWidth} />

            <SectionHeader title="Saved Places" onPress={() => {}} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardsRow}
            >
              {SAVED_PLACES.map((item) => (
                <View key={item.id} style={styles.savedPlaceCardHorizontal}>
                  <SavedPlaceCard
                    item={item}
                    width={savedCardWidth}
                    isSaved={savedPlaceIds.includes(item.id)}
                    onToggleSaved={handleToggleSaved}
                    isPhone={isPhone}
                  />
                </View>
              ))}
            </ScrollView>

            <SectionHeader
              title="Nearby Essentials"
              subtitle="Important places around your location."
              onPress={() => {}}
            />
            <ExploreSection
              items={NEARBY_ESSENTIALS}
              isPhone={isPhone}
              cardWidth={essentialsCardWidth}
              dense
            />

            <TripBanner onPress={() => onNavigate?.("itinerary")} isPhone={isPhone} />
          </View>
        </ScrollView>

        <BottomNav activeLabel="Maps" onNavigate={onNavigate} />
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

  // Matches ItineraryScreen `roundHeaderButton` (circle back control).
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
    flexShrink: 0,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  headerActionButton: {
    width: 42,
    height: 42,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionButtonPhone: {
    width: 38,
    height: 38,
    marginLeft: 0,
  },

  notificationDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#FF7A32",
  },

  notificationDotPhone: {
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  heroSection: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  heroSectionPhone: {
    marginTop: 6,
    alignItems: "center",
  },

  heroCopyColumn: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 420,
    paddingRight: 6,
  },

  heroCopyColumnPhone: {
    flexBasis: 0,
    flexGrow: 1,
    maxWidth: "64%",
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },

  heading: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1,
    color: COLORS.text,
  },

  titleIllustrationWrap: {
    width: 32,
    height: 32,
    marginLeft: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
    position: "relative",
  },

  titleIllustrationPin: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5A4E",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.subtext,
    maxWidth: 220,
  },

  heroArtworkShell: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    justifyContent: "center",
    alignItems: "flex-end",
    overflow: "visible",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  searchControlsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  searchControlsRowPhone: {
    marginTop: 8,
    gap: 5,
  },

  searchControlsRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchInputWrap: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  searchInputWrapInline: {
    flex: 1,
    minWidth: 0,
  },

  searchInputWrapPhone: {
    minHeight: 40,
    paddingLeft: 10,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },

  searchInputPhone: {
    fontSize: 12,
    marginLeft: 6,
  },

  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
  },

  filterButtonPhone: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  searchActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },

  searchActionsRowStacked: {
    width: "100%",
  },

  searchActionButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  searchActionButtonCompact: {
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  searchActionButtonSelected: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  searchActionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  searchActionLabelCompact: {
    fontSize: 12,
  },

  searchActionLabelSelected: {
    color: "#FFFFFF",
  },

  mapCard: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FBFF",
    overflow: "hidden",
    position: "relative",
  },

  mapCardPhone: {
    marginTop: 8,
    borderRadius: 18,
  },

  mapCanvas: {
    flex: 1,
    borderRadius: 22,
  },

  mapLocationChip: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 3,
    maxWidth: "56%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  mapLocationChipPhone: {
    top: 8,
    left: 8,
    maxWidth: "60%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
  },

  mapLocationChipCopy: {
    flexShrink: 1,
    minWidth: 0,
  },

  mapLocationChipTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },

  mapLocationChipTitlePhone: {
    fontSize: 11,
  },

  mapLocationChipHint: {
    marginTop: 1,
    fontSize: 10,
    color: COLORS.subtext,
  },

  mapRecenterButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 3,
  },

  mapExpandButton: {
    position: "absolute",
    top: 50,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 3,
  },

  mapSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  mapSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 33, 59, 0.42)",
  },

  mapSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  mapSheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    marginTop: 10,
    backgroundColor: COLORS.border,
  },

  mapSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },

  mapSheetTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  mapSheetMapWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    position: "relative",
  },

  actionRowCard: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
    paddingVertical: 1,
  },

  actionRowCardPhone: {
    marginTop: 6,
    borderRadius: 12,
  },

  actionCell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 7,
    paddingVertical: 8,
    alignItems: "flex-start",
  },

  actionCellPhone: {
    paddingHorizontal: 5,
    paddingVertical: 7,
  },

  actionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },

  actionDividerPhone: {
    marginVertical: 5,
  },

  actionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  actionIconWrapPhone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 3,
  },

  actionTitle: {
    width: "100%",
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
    flexShrink: 1,
  },

  actionTitlePhone: {
    fontSize: 10,
    lineHeight: 12,
  },

  // Keep "Explore Nearby" on one line without ellipsis/truncation.
  actionTitleNearby: {
    fontSize: 10,
    lineHeight: 12,
  },

  actionTitleNearbyPhone: {
    fontSize: 9,
    lineHeight: 11,
  },

  actionDescription: {
    width: "100%",
    minWidth: 0,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.subtext,
    flexShrink: 1,
  },

  actionDescriptionPhone: {
    fontSize: 9,
    lineHeight: 11,
  },

  sectionHeaderRow: {
    marginTop: 10,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.subtext,
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  sectionLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.blue,
    marginRight: 1,
  },

  horizontalCardsRow: {
    paddingBottom: 2,
    paddingRight: 4,
  },

  categoryCard: {
    minHeight: 88,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  categoryCardPhone: {
    minHeight: 84,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
  },

  categoryCardDense: {
    minHeight: 88,
    justifyContent: "flex-start",
    paddingHorizontal: 8,
  },

  categoryCardHorizontal: {
    marginRight: 7,
  },

  categoryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  categoryIconWrapPhone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 5,
  },

  categoryIconWrapDense: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },

  categoryCardTitle: {
    width: "100%",
    minWidth: 0,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
    flexShrink: 1,
  },

  categoryCardTitlePhone: {
    fontSize: 11,
    lineHeight: 14,
  },

  categoryCardTitleDense: {
    fontSize: 11,
    lineHeight: 13,
  },

  // Keeps "Transit Stations" / "Grocery Stores" on one readable line.
  categoryCardTitleLongEssential: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.2,
  },

  categoryCardMeta: {
    width: "100%",
    minWidth: 0,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.subtext,
    flexShrink: 1,
  },

  categoryCardMetaPhone: {
    fontSize: 10,
    lineHeight: 12,
  },

  categoryCardMetaDense: {
    fontSize: 10,
    lineHeight: 12,
  },

  savedPlaceCardHorizontal: {
    marginRight: 8,
  },

  savedPlaceCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },

  savedPlaceCardPhone: {
    borderRadius: 12,
  },

  savedPlaceImageWrap: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },

  savedPlaceImageWrapPhone: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  savedPlaceImage: {
    width: "100%",
    height: "100%",
  },

  savedPlaceHeart: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },

  savedPlaceHeartPhone: {
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  savedPlaceCopy: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },

  savedPlaceCopyPhone: {
    paddingHorizontal: 7,
    paddingTop: 5,
    paddingBottom: 7,
  },

  savedPlaceTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },

  savedPlaceTitlePhone: {
    fontSize: 11,
    lineHeight: 14,
  },

  savedPlaceMeta: {
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.subtext,
  },

  savedPlaceMetaPhone: {
    fontSize: 9,
    lineHeight: 12,
  },

  savedPlaceSeparator: {
    color: "#94A3B8",
  },

  tripBanner: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#EEF5FF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  tripBannerPhone: {
    padding: 12,
    gap: 10,
    borderRadius: 18,
    flexWrap: "nowrap",
  },

  tripBannerIllustration: {
    width: 64,
    height: 48,
    position: "relative",
    justifyContent: "center",
    flexShrink: 0,
  },

  tripBannerIllustrationPhone: {
    width: 52,
    height: 40,
  },

  tripRouteLoop: {
    position: "absolute",
    left: 8,
    top: 10,
    width: 44,
    height: 22,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.blue,
  },

  tripRouteLoopPhone: {
    left: 6,
    top: 8,
    width: 36,
    height: 18,
  },

  tripPin: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.blue,
  },

  tripPinPhone: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  tripPinStart: {
    left: 0,
    bottom: 4,
  },

  tripPinEnd: {
    right: 0,
    top: 0,
  },

  tripBannerCopy: {
    flex: 1,
    minWidth: 0,
  },

  tripBannerCopyPhone: {
    minWidth: 0,
    flexShrink: 1,
  },

  tripBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 3,
  },

  tripBannerTitlePhone: {
    fontSize: 13,
  },

  tripBannerText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.subtext,
  },

  tripBannerTextPhone: {
    fontSize: 11,
    lineHeight: 15,
  },

  tripBannerButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    flexShrink: 0,
  },

  tripBannerButtonPhone: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    maxWidth: "42%",
  },

  tripBannerButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  tripBannerButtonTextPhone: {
    fontSize: 12,
  },
});
