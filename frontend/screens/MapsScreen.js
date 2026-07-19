import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  AppState,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import * as dashboardApi from "../src/api/dashboard";
import {
  mapFavoriteForMaps,
  mapPlaceForMaps,
  placeFavoriteKey,
  placeFavoritePayload,
} from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import {
  DEFAULT_LAT,
  DEFAULT_LNG,
  geocodeQuery,
  reverseGeocodeLabel,
} from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";

const heroArtworkImage = require("../assets/images/maps/maps-hero-art.png");
const wideMapArtworkImage = require("../assets/images/maps/maps-static-map-wide.png");

const COLORS = {
  background: "#EAF2FC",
  card: "#FFFFFF",
  border: "#D6E4F8",
  text: "#10213B",
  subtext: "#51607D",
  blue: "#1F78FF",
};

const MOBILE_MAP_ASPECT_RATIO = 624 / 282;
const MAP_RADIUS_KM = 5;
const LIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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
    image: require("../assets/images/maps/maps-tokyo-tower.png"),
  },
  {
    id: "shibuya-crossing",
    title: "Shibuya Crossing",
    meta: "Attraction",
    distance: "1.0 km",
    image: require("../assets/images/maps/maps-shibuya-crossing.png"),
  },
  {
    id: "meiji-jingu-shrine",
    title: "Meiji Jingu Shrine",
    meta: "Attraction",
    distance: "3.2 km",
    image: require("../assets/images/maps/maps-meiji-shrine.png"),
  },
  {
    id: "tsukiji-outer-market",
    title: "Tsukiji Outer Market",
    meta: "Food",
    distance: "2.7 km",
    image: require("../assets/images/maps/maps-tsukiji-market.png"),
  },
];

const MAP_PLACE_IMAGES = SAVED_PLACES.map((place) => place.image);

const MAP_INTERACTIVE_AREAS = {
  wide: {
    locationSelector: { top: "4%", left: "2.5%", width: "26%", height: "24%" },
    controls: [
      { id: "recenter", top: "13%", right: "2.4%", width: 54, height: 54 },
      { id: "layers", top: "35.5%", right: "2.4%", width: 54, height: 54 },
      { id: "navigate", top: "58.2%", right: "2.4%", width: 54, height: 54 },
    ],
  },
  mobile: {
    locationSelector: { top: "4%", left: "2.5%", width: "27%", height: "24%" },
    controls: [
      { id: "recenter", top: "13%", right: "2.4%", width: "8.7%", height: "19.2%" },
      { id: "layers", top: "35.5%", right: "2.4%", width: "8.7%", height: "19.2%" },
      { id: "navigate", top: "58.2%", right: "2.4%", width: "8.7%", height: "19.2%" },
    ],
  },
};

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

function HeroArtwork({ isPhone = false }) {
  return (
    <View style={[styles.heroArtworkShell, isPhone && styles.heroArtworkShellPhone]}>
      <View style={styles.heroArtworkFrame}>
        <Image source={heroArtworkImage} resizeMode="cover" style={styles.heroArtworkImage} />
      </View>
    </View>
  );
}

function TitleIllustration() {
  return (
    <View style={styles.titleIllustrationWrap}>
      <Ionicons name="map-outline" size={34} color={COLORS.blue} />
      <View style={styles.titleIllustrationPin}>
        <Ionicons name="location" size={12} color="#FFFFFF" />
      </View>
    </View>
  );
}

function SearchActionButton({ item, selectedId, onPress }) {
  const isSelected = selectedId === item.id;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item.id)}
      style={[styles.searchActionButton, isSelected && styles.searchActionButtonSelected]}
    >
      <View
        style={[
          styles.searchActionIconWrap,
          isSelected && styles.searchActionIconWrapSelected,
        ]}
      >
        {renderIcon(item.iconFamily, item.iconName, isSelected ? "#FFFFFF" : COLORS.blue, 21)}
      </View>
      <Text
        style={[
          styles.searchActionLabel,
          isSelected && styles.searchActionLabelSelected,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function ActionPanel({ isNarrow }) {
  return (
    <View style={styles.actionGrid}>
      {MAP_ACTIONS.map((item) => (
        <DimPressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => {}}
          style={[
            styles.actionCard,
            cardShadowStyle,
            isNarrow ? styles.actionCardNarrow : styles.actionCardWide,
          ]}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: item.iconBackground }]}>
            {renderIcon(item.iconFamily, item.iconName, item.iconColor, 28)}
          </View>
          <Text style={styles.actionTitle}>{item.title}</Text>
          <Text style={styles.actionDescription}>{item.description}</Text>
        </DimPressable>
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
          <Ionicons name="chevron-forward" size={18} color={COLORS.blue} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ExploreCard({ item, width, isPhone = false, horizontal = false, onPress }) {
  return (
    <DimPressable
      accessibilityRole="button"
      onPress={() => onPress?.(item)}
      style={[
        styles.categoryCard,
        cardShadowStyle,
        width ? { width } : null,
        isPhone && styles.categoryCardPhone,
        horizontal && styles.categoryCardHorizontal,
      ]}
    >
      <View style={[styles.categoryIconWrap, { backgroundColor: item.iconBackground }]}>
        {renderIcon(item.iconFamily, item.iconName, item.iconColor, 26)}
      </View>
      <Text style={styles.categoryCardTitle}>{item.title}</Text>
      <Text style={styles.categoryCardMeta}>{item.meta}</Text>
    </DimPressable>
  );
}

function ExploreSection({ items, isPhone, cardWidth, onPress }) {
  if (isPhone) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCardsRow}
      >
        {items.map((item) => (
          <ExploreCard key={item.id} item={item} width={cardWidth} isPhone horizontal onPress={onPress} />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.catalogGrid}>
      {items.map((item) => (
        <ExploreCard key={item.id} item={item} width={cardWidth} onPress={onPress} />
      ))}
    </View>
  );
}

function SavedPlaceCard({ item, width, isSaved, onToggleSaved }) {
  return (
    <View style={[styles.savedPlaceCard, cardShadowStyle, { width }]}>
      <View style={styles.savedPlaceImageWrap}>
        <Image source={item.image} resizeMode="cover" style={styles.savedPlaceImage} />
        <DimPressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
          onPress={() => onToggleSaved(item)}
          style={styles.savedPlaceHeart}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={20}
            color={isSaved ? "#FF5A4E" : COLORS.text}
          />
        </DimPressable>
      </View>

      <View style={styles.savedPlaceCopy}>
        <Text style={styles.savedPlaceTitle}>{item.title}</Text>
        <Text style={styles.savedPlaceMeta}>
          {item.meta} <Text style={styles.savedPlaceSeparator}>•</Text> {item.distance}
        </Text>
      </View>
    </View>
  );
}

function TripBanner({ onPress, isPhone }) {
  return (
    <View style={[styles.tripBanner, cardShadowStyle, isPhone && styles.tripBannerPhone]}>
      <View style={styles.tripBannerIllustration}>
        <View style={styles.tripRouteLoop} />
        <View style={[styles.tripPin, styles.tripPinStart]}>
          <Ionicons name="location" size={18} color="#FFFFFF" />
        </View>
        <View style={[styles.tripPin, styles.tripPinEnd]}>
          <Ionicons name="location" size={18} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.tripBannerCopy}>
        <Text style={styles.tripBannerTitle}>Plan Your Trip on Map</Text>
        <Text style={styles.tripBannerText}>
          See all your saved places and itinerary stops in one view.
        </Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onPress} style={styles.tripBannerButton}>
        <Text style={styles.tripBannerButtonText}>View My Trip Map</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function projectMarker(place, center, radiusKm) {
  if (place?.lat == null || place?.lng == null || !center) return null;
  const latKm = (place.lat - center.lat) * 111;
  const lngKm = (place.lng - center.lng) * 111 * Math.cos((center.lat * Math.PI) / 180);
  return {
    left: `${Math.max(6, Math.min(94, 50 + (lngKm / radiusKm) * 45))}%`,
    top: `${Math.max(8, Math.min(92, 50 - (latKm / radiusKm) * 43))}%`,
  };
}

function MapInteractiveOverlay({ isPhone, places, center, onRecenter }) {
  const areas = isPhone ? MAP_INTERACTIVE_AREAS.mobile : MAP_INTERACTIVE_AREAS.wide;

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onRecenter} style={[styles.mapHotspot, areas.locationSelector]} />
      {places.map((place, index) => {
        const position = projectMarker(place, center, MAP_RADIUS_KM);
        return position ? (
          <View
            key={place.id}
            accessibilityLabel={`${place.title}, ${place.distance}`}
            style={[styles.liveMapMarker, position]}
          >
            <Ionicons
              name="location"
              size={index === 0 ? 31 : 26}
              color={index === 0 ? "#FF5A4E" : "#1F78FF"}
            />
          </View>
        ) : null;
      })}
      {areas.controls.map((control) => (
        <Pressable
          key={control.id}
          accessibilityRole="button"
          onPress={control.id === "recenter" ? onRecenter : undefined}
          style={[styles.mapHotspot, styles.mapControlHotspot, control]}
        />
      ))}
    </>
  );
}

function MapCard({ isPhone, height, places, center, onRecenter }) {
  return (
    <View style={[styles.mapCard, isPhone && styles.mapCardPhone, cardShadowStyle, { height }]}>
      <Image
        source={wideMapArtworkImage}
        resizeMode={isPhone ? "contain" : "cover"}
        style={[styles.mapArtworkImage, isPhone && styles.mapArtworkImagePhone]}
      />
      <MapInteractiveOverlay
        isPhone={isPhone}
        places={places}
        center={center}
        onRecenter={onRecenter}
      />
    </View>
  );
}

export default function MapsScreen({ onNavigate, onBack }) {
  const { width } = useWindowDimensions();
  const { refreshLocation } = useUserLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToolbarId, setSelectedToolbarId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [locationLabel, setLocationLabel] = useState("Current area");
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [isStale, setIsStale] = useState(false);
  const activeSearchRef = useRef({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, category: null });
  const requestInFlightRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const isPhone = width < 520;
  const isNarrow = width < 760;
  const isCompactPhone = width < 430;
  const pageHorizontalPadding = 18;
  const pageWidth = Math.min(Math.max(width - pageHorizontalPadding * 2, 280), 1040);
  const gridGap = 14;
  const categoryCardWidth = isPhone ? 138 : 150;
  const essentialsCardWidth = isPhone ? 146 : 154;
  const savedColumns = width >= 920 ? 4 : width >= 620 ? 2 : 1;
  const savedCardWidth =
    savedColumns === 1
      ? pageWidth
      : (pageWidth - gridGap * (savedColumns - 1)) / savedColumns;
  const mapHeight = isPhone
    ? Math.round(Math.min(pageWidth / MOBILE_MAP_ASPECT_RATIO, 420))
    : Math.round(Math.min(pageWidth * 0.45, 470));
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

  const savedPlaceKeys = new Set(
    savedPlaces.map((place) => placeFavoriteKey(place.provider, place.providerPlaceId))
  );

  const loadFavorites = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const payload = await dashboardApi.fetchFavorites(token);
    setSavedPlaces(
      payload
        .filter((item) => item.item_type === "place")
        .map((item, index) =>
          mapFavoriteForMaps(item, MAP_PLACE_IMAGES[index % MAP_PLACE_IMAGES.length])
        )
    );
  }, []);

  const loadPlaces = useCallback(async (query = activeSearchRef.current, initial = false) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    if (initial) setLoading(true);
    setMapError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to explore nearby places.");
      const payload = await dashboardApi.fetchPopularPlaces(
        token,
        query.lat,
        query.lng,
        MAP_RADIUS_KM,
        12,
        query.category
      );
      setPlaces(
        payload.map((place, index) =>
          mapPlaceForMaps(place, MAP_PLACE_IMAGES[index % MAP_PLACE_IMAGES.length])
        )
      );
      setMapCenter({ lat: query.lat, lng: query.lng });
      setIsStale(false);
    } catch (error) {
      setMapError(error?.message || "Couldn't load nearby places.");
      setIsStale(true);
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const useCurrentLocation = useCallback(async () => {
    const location = await refreshLocation();
    const center = location || { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    const label =
      (await reverseGeocodeLabel(center.lat, center.lng)) ||
      (location ? "Current area" : "Bali, Indonesia");
    setLocationLabel(label);
    activeSearchRef.current = {
      ...center,
      category: activeSearchRef.current.category,
    };
    await loadPlaces(activeSearchRef.current, true);
  }, [loadPlaces, refreshLocation]);

  useEffect(() => {
    useCurrentLocation();
    loadFavorites().catch(() => {});
  }, [loadFavorites, useCurrentLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (appStateRef.current === "active") loadPlaces();
    }, LIVE_REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        loadPlaces();
        loadFavorites().catch(() => {});
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loadFavorites, loadPlaces]);

  async function handleSearchSubmit() {
    const query = searchQuery.trim();
    if (!query) return;
    const result = await geocodeQuery(query);
    if (!result) {
      setMapError("Location not found.");
      return;
    }
    setLocationLabel(result.label);
    activeSearchRef.current = { lat: result.lat, lng: result.lng, category: selectedCategory };
    await loadPlaces(activeSearchRef.current, true);
  }

  async function handleCategoryPress(item) {
    const category = selectedCategory === item.id ? null : item.id;
    setSelectedCategory(category);
    activeSearchRef.current = { ...activeSearchRef.current, category };
    await loadPlaces(activeSearchRef.current, true);
  }

  async function handleToggleSaved(place) {
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to save places.");
      const key = placeFavoriteKey(place.provider, place.providerPlaceId);
      if (savedPlaceKeys.has(key)) {
        await dashboardApi.removeFavorite(token, {
          itemType: "place",
          provider: place.provider,
          providerItemId: place.providerPlaceId,
        });
      } else {
        await dashboardApi.addFavorite(token, placeFavoritePayload(place));
      }
      await loadFavorites();
    } catch (error) {
      setMapError(error?.message || "Couldn't update saved places.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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

            <View style={[styles.heroSection, isPhone && styles.heroSectionPhone]}>
              <View style={[styles.heroCopyColumn, isPhone && styles.heroCopyColumnPhone]}>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.heading, isCompactPhone && styles.headingCompact]}>
                    Maps
                  </Text>
                  <TitleIllustration />
                </View>
                <Text style={[styles.subtitle, isPhone && styles.subtitlePhone]}>
                  Find places, get directions, and{"\n"}
                  explore your destination.
                </Text>
              </View>

              <HeroArtwork isPhone={isPhone} />
            </View>

            <View style={[styles.searchControlsCard, cardShadowStyle]}>
              <View style={[styles.searchControlsRow, isNarrow && styles.searchControlsRowStacked]}>
                <View style={styles.searchInputWrap}>
                  <Ionicons name="search-outline" size={26} color={COLORS.text} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search for a place, address, or destination"
                    placeholderTextColor="#8F9BB3"
                    selectionColor={COLORS.blue}
                    returnKeyType="search"
                    onSubmitEditing={handleSearchSubmit}
                    style={styles.searchInput}
                  />
                  <Pressable accessibilityRole="button" onPress={handleSearchSubmit} style={styles.filterButton}>
                    <Ionicons name="options-outline" size={22} color={COLORS.blue} />
                  </Pressable>
                </View>

                <View style={[styles.searchActionsRow, isPhone && styles.searchActionsRowPhone]}>
                  {toolbarItems.map((item) => (
                    <SearchActionButton
                      key={item.id}
                      item={item}
                      selectedId={selectedToolbarId}
                      onPress={setSelectedToolbarId}
                    />
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.mapLocationLabel}>
              {locationLabel}{isStale ? " (showing last results)" : ""}
            </Text>
            {mapError ? <Text style={styles.mapStateText}>{mapError}</Text> : null}
            <MapCard
              isPhone={isPhone}
              height={mapHeight}
              places={places}
              center={mapCenter}
              onRecenter={useCurrentLocation}
            />

            <ActionPanel isNarrow={isNarrow} />

            <SectionHeader title="Explore Nearby" onPress={() => {}} />
            <ExploreSection
              items={EXPLORE_CATEGORIES}
              isPhone={isPhone}
              cardWidth={categoryCardWidth}
              onPress={handleCategoryPress}
            />

            <SectionHeader
              title="Nearby Places"
              subtitle={loading ? "Refreshing nearby results..." : `${places.length} places within ${MAP_RADIUS_KM} km.`}
              onPress={() => loadPlaces()}
            />
            <View style={styles.savedPlacesGrid}>
              {places.map((item) => (
                <SavedPlaceCard
                  key={item.id}
                  item={item}
                  width={savedCardWidth}
                  isSaved={savedPlaceKeys.has(placeFavoriteKey(item.provider, item.providerPlaceId))}
                  onToggleSaved={handleToggleSaved}
                />
              ))}
              {!loading && places.length === 0 ? (
                <Text style={styles.mapStateText}>No nearby places found.</Text>
              ) : null}
            </View>

            <SectionHeader title="Saved Places" onPress={() => setSelectedToolbarId("lists")} />
            <View style={styles.savedPlacesGrid}>
              {savedPlaces.map((item) => (
                <SavedPlaceCard
                  key={`${item.provider}-${item.providerPlaceId}`}
                  item={item}
                  width={savedCardWidth}
                  isSaved
                  onToggleSaved={handleToggleSaved}
                />
              ))}
              {savedPlaces.length === 0 ? (
                <Text style={styles.mapStateText}>No saved places yet.</Text>
              ) : null}
            </View>

            <SectionHeader
              title="Nearby Essentials"
              subtitle="Important places around your location."
              onPress={() => {}}
            />
            <ExploreSection
              items={NEARBY_ESSENTIALS}
              isPhone={isPhone}
              cardWidth={essentialsCardWidth}
              onPress={handleCategoryPress}
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

  mapLocationLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },

  mapStateText: {
    color: COLORS.subtext,
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 10,
  },

  liveMapMarker: {
    position: "absolute",
    zIndex: 4,
    marginLeft: -13,
    marginTop: -25,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: BOTTOM_NAV_CONTENT_PADDING + 18,
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
    backgroundColor: "#FF7A32",
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
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  heading: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "800",
    letterSpacing: -2,
    color: COLORS.text,
  },

  headingCompact: {
    fontSize: 46,
    lineHeight: 50,
  },

  titleIllustrationWrap: {
    width: 48,
    height: 48,
    marginLeft: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
    position: "relative",
  },

  titleIllustrationPin: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5A4E",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 30,
    color: COLORS.subtext,
  },

  subtitlePhone: {
    fontSize: 18,
    lineHeight: 28,
  },

  heroArtworkShell: {
    flexGrow: 1,
    minWidth: 240,
    maxWidth: 470,
    height: 248,
    justifyContent: "flex-end",
  },

  heroArtworkShellPhone: {
    minWidth: 0,
    width: "100%",
    maxWidth: 470,
    height: 196,
    marginTop: 8,
  },

  heroArtworkFrame: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  searchControlsCard: {
    marginTop: 10,
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  searchControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  searchControlsRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchInputWrap: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FBFDFF",
  },

  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },

  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
  },

  searchActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  searchActionsRowPhone: {
    width: "100%",
  },

  searchActionButton: {
    minWidth: 154,
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  searchActionButtonSelected: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  searchActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
    marginRight: 10,
  },

  searchActionIconWrapSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },

  searchActionLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  searchActionLabelSelected: {
    color: "#FFFFFF",
  },

  mapCard: {
    marginTop: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FBFF",
    overflow: "hidden",
    position: "relative",
  },

  mapCardPhone: {
    justifyContent: "center",
  },

  mapArtworkImage: {
    width: "100%",
    height: "100%",
  },

  mapArtworkImagePhone: {
    alignSelf: "center",
  },

  mapHotspot: {
    position: "absolute",
    backgroundColor: "transparent",
  },

  mapControlHotspot: {
    borderRadius: 999,
  },

  actionGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },

  actionCard: {
    minHeight: 168,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  actionCardWide: {
    width: "23.9%",
  },

  actionCardNarrow: {
    width: "48.4%",
  },

  actionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },

  actionDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.subtext,
  },

  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.6,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.subtext,
  },

  sectionLinkButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionLinkText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.blue,
    marginRight: 2,
  },

  horizontalCardsRow: {
    paddingBottom: 6,
    paddingRight: 4,
  },

  catalogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  categoryCard: {
    minHeight: 152,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  categoryCardPhone: {
    minHeight: 150,
  },

  categoryCardHorizontal: {
    marginRight: 14,
  },

  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  categoryCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  categoryCardMeta: {
    fontSize: 15,
    color: COLORS.subtext,
  },

  savedPlacesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  savedPlaceCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },

  savedPlaceImageWrap: {
    position: "relative",
    padding: 14,
    paddingBottom: 0,
  },

  savedPlaceImage: {
    width: "100%",
    height: 136,
    borderRadius: 18,
    backgroundColor: "#DDEBFF",
  },

  savedPlaceHeart: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },

  savedPlaceCopy: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },

  savedPlaceTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  savedPlaceMeta: {
    fontSize: 15,
    color: COLORS.subtext,
  },

  savedPlaceSeparator: {
    color: "#94A3B8",
  },

  tripBanner: {
    marginTop: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#EEF5FF",
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },

  tripBannerPhone: {
    flexWrap: "wrap",
  },

  tripBannerIllustration: {
    width: 84,
    height: 62,
    position: "relative",
    justifyContent: "center",
  },

  tripRouteLoop: {
    position: "absolute",
    left: 12,
    top: 14,
    width: 58,
    height: 30,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: COLORS.blue,
  },

  tripPin: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.blue,
  },

  tripPinStart: {
    left: 0,
    bottom: 8,
  },

  tripPinEnd: {
    right: 0,
    top: 0,
  },

  tripBannerCopy: {
    flex: 1,
    minWidth: 220,
  },

  tripBannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },

  tripBannerText: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.subtext,
    maxWidth: 420,
  },

  tripBannerButton: {
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  tripBannerButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
