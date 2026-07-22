import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import {
  favoriteKeyFromItem,
  hotelFavoriteKey,
  mapHotelForAlly,
  sortKeyToApi,
} from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { geocodeQuery, reverseGeocodeLabel } from "../src/location/geo";
import { useUserLocation } from "../src/location/UserLocationContext";
import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const hotelHeroImage = require("../assets/images/hotels/hotel-hero-complete.png");
const tipBotImage = require("../assets/images/itinerary-tip-bot-reference.png");

const HOTEL_CARD_BADGES = [
  {
    label: "Best Match",
    background: "#FFD86B",
    color: "#14253E",
    icon: "star",
  },
  {
    label: "Best Budget",
    background: "#DDF8E4",
    color: "#12804C",
    icon: "checkmark-circle",
  },
];

const sortOptions = [
  { key: "bestMatch", label: "Best Match", icon: "star-outline", library: "ionicons" },
  { key: "lowestPrice", label: "Lowest Price", icon: "pricetag-outline", library: "ionicons" },
  {
    key: "highestRated",
    label: "Highest Rated",
    icon: "star-circle-outline",
    library: "material",
  },
  { key: "closest", label: "Closest", icon: "location-outline", library: "ionicons" },
];

function renderSortIcon(option, isSelected, compact = false) {
  const iconColor = isSelected ? "#FFFFFF" : "#1F78FF";
  const size = compact ? 14 : option.library === "material" ? 22 : 21;

  if (option.library === "material") {
    return <MaterialCommunityIcons name={option.icon} size={size} color={iconColor} />;
  }

  return <Ionicons name={option.icon} size={size} color={iconColor} />;
}

function renderAmenityIcon(amenity, iconSize = 20) {
  const key = String(amenity || "").trim().toLowerCase();

  if (key.includes("pool")) {
    return <MaterialCommunityIcons name="pool" size={iconSize} color="#14253E" />;
  }

  if (key.includes("parking") || key.includes("garage")) {
    return <Ionicons name="car-outline" size={iconSize} color="#14253E" />;
  }

  if (key.includes("breakfast") || key.includes("board")) {
    return <Ionicons name="cafe-outline" size={iconSize} color="#14253E" />;
  }

  if (key.includes("gym") || key.includes("fitness")) {
    return <Ionicons name="barbell-outline" size={iconSize} color="#14253E" />;
  }

  if (key.includes("free cancellation") || key === "refundable") {
    return <Ionicons name="shield-checkmark-outline" size={iconSize} color="#14253E" />;
  }

  if (key.includes("non-refundable") || key.includes("non refundable")) {
    return <Ionicons name="close-circle-outline" size={iconSize} color="#14253E" />;
  }

  if (key.includes("wifi") || key.includes("wi-fi")) {
    return <Ionicons name="wifi-outline" size={iconSize} color="#14253E" />;
  }

  return <Ionicons name="checkmark-circle-outline" size={iconSize} color="#14253E" />;
}

function SortPill({ option, isSelected, onPress, compact = false, scrollable = false }) {
  const Button = isSelected ? Pressable : DimPressable;

  return (
    <Button
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.sortPill,
        compact && styles.sortPillCompact,
        scrollable && styles.sortPillScrollable,
        isSelected && styles.sortPillSelected,
      ]}
    >
      {renderSortIcon(option, isSelected, compact)}
      <Text
        style={[
          styles.sortPillLabel,
          compact && styles.sortPillLabelCompact,
          isSelected && styles.sortPillLabelSelected,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {option.label}
      </Text>
    </Button>
  );
}

export default function HotelsScreen({
  onGoBack,
  onNavigateHome,
  onNavigate,
  params = {},
  previewMode = false,
}) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const { width: windowWidth } = useWindowDimensions();
  const compact = windowWidth < 700;
  const isPhone = windowWidth < 520;
  const narrowPhone = windowWidth < 360;
  const stackCardActions = windowWidth < 380;
  const pagePad = narrowPhone ? 12 : isPhone ? 16 : 18;
  const heroArtworkWidth = isPhone
    ? Math.min(Math.round(windowWidth * 0.42), 168)
    : compact
      ? Math.min(Math.round(windowWidth * 0.34), 200)
      : Math.min(Math.round(windowWidth * 0.26), 248);
  // Model: image ~1/3 card width; height stretches to match content (no dead space)
  const hotelImageWidth = isPhone
    ? Math.min(Math.max(Math.round(windowWidth * 0.24), 90), 104)
    : compact
      ? 118
      : 128;
  const scrollBottomPadding = bottomNavPadding + (isPhone ? 10 : 8);
  const { location, status, isUsingDeviceLocation, refreshLocation } = useUserLocation();
  const seededDestination = params.destination?.trim() || "";
  const [destination, setDestination] = useState(seededDestination);
  const [appliedDestination, setAppliedDestination] = useState(seededDestination);
  const [searchOrigin, setSearchOrigin] = useState(null);
  const [destinationReady, setDestinationReady] = useState(Boolean(seededDestination));
  const [selectedSort, setSelectedSort] = useState("bestMatch");
  const [savedHotels, setSavedHotels] = useState([]);
  const [pendingFavoriteKeys, setPendingFavoriteKeys] = useState([]);
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invalidLocationQuery, setInvalidLocationQuery] = useState(null);
  const pendingFavoriteKeysRef = useRef(new Set());

  const loadSavedFavorites = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setSavedHotels([]);
        return;
      }
      const favorites = await dashboardApi.fetchFavorites(token);
      const keys = (favorites || [])
        .filter((item) => item.item_type === "hotel")
        .map((item) => favoriteKeyFromItem(item))
        .filter(Boolean);
      setSavedHotels(keys);
    } catch {
      // Keep local heart state if refresh fails; search still works.
    }
  }, []);

  useEffect(() => {
    loadSavedFavorites();
  }, [loadSavedFavorites]);

  // Seed destination from GPS → nearest city (unless navigated here with a destination).
  useEffect(() => {
    if (seededDestination) {
      let cancelled = false;
      (async () => {
        const resolved = await geocodeQuery(seededDestination);
        if (cancelled) {
          return;
        }
        if (resolved) {
          setSearchOrigin(resolved);
          setDestination(resolved.label);
          setAppliedDestination(resolved.label);
        } else {
          setInvalidLocationQuery(seededDestination);
          setError(
            `No results found for ${seededDestination}. Please enter a valid location.`
          );
        }
        setDestinationReady(true);
      })();
      return () => {
        cancelled = true;
      };
    }

    if (status === "loading") {
      return undefined;
    }

    // Keep keyword-driven search centers; don't overwrite with GPS refresh.
    if (searchOrigin?.source === "search") {
      setDestinationReady(true);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      if (location?.lat != null && location?.lng != null) {
        const city = await reverseGeocodeLabel(location.lat, location.lng);
        if (cancelled) {
          return;
        }
        const label =
          city || `${Number(location.lat).toFixed(2)}, ${Number(location.lng).toFixed(2)}`;
        // Leave the search bar empty on load; still search hotels for this area.
        setAppliedDestination(label);
        setSearchOrigin({
          lat: location.lat,
          lng: location.lng,
          source: location.source || "gps",
          label,
        });
        setInvalidLocationQuery(null);
        setDestinationReady(true);
        return;
      }

      setDestination("");
      setAppliedDestination("");
      setSearchOrigin(null);
      setDestinationReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [seededDestination, status, location?.lat, location?.lng, location?.source, searchOrigin?.source]);

  const runSearch = useCallback(async () => {
    if (!destinationReady || status === "loading") {
      return;
    }

    if (invalidLocationQuery) {
      setHotels([]);
      setLoading(false);
      return;
    }

    const query = appliedDestination.trim();
    if (!query) {
      setHotels([]);
      setLoading(false);
      return;
    }

    const apiSort = sortKeyToApi(selectedSort);
    const origin = searchOrigin;

    if (apiSort === "distance" && (origin?.lat == null || origin?.lng == null)) {
      setError("Enable location access or search a valid city to sort by closest.");
      setHotels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Sign in to search hotels.");
        setHotels([]);
        return;
      }

      const results = await dashboardApi.searchHotels(token, query, apiSort, origin);
      setHotels(results.map((hotel, index) => mapHotelForAlly(hotel, index, origin)));
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : "Search failed.";
      setError(message);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [
    appliedDestination,
    selectedSort,
    searchOrigin,
    status,
    destinationReady,
    invalidLocationQuery,
  ]);

  const locationLabel =
    status === "loading" && !searchOrigin
      ? "Locating you..."
      : searchOrigin?.label
        ? searchOrigin.source === "search"
          ? `Searching near ${searchOrigin.label}`
          : `Near you · ${searchOrigin.label}`
        : isUsingDeviceLocation
          ? `Using your GPS (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})`
          : "Enter a city to search hotels nearby";

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const visibleHotels = hotels;
  const resultsLabel = loading
    ? "Searching..."
    : `${visibleHotels.length} result${visibleHotels.length === 1 ? "" : "s"}`;
  const usingMockData =
    !loading && !error && hotels.length > 0 && hotels.every((hotel) => hotel.provider === "mock");

  const handleFindHotels = async () => {
    const query = destination.trim();
    if (!query) {
      setInvalidLocationQuery("");
      setError("Please enter a valid location.");
      setHotels([]);
      return;
    }

    setLoading(true);
    setError(null);
    setInvalidLocationQuery(null);

    const resolved = await geocodeQuery(query);
    if (!resolved) {
      setInvalidLocationQuery(query);
      setAppliedDestination(query);
      setSearchOrigin(null);
      setHotels([]);
      setError(`No results found for ${query}. Please enter a valid location.`);
      setLoading(false);
      return;
    }

    setSearchOrigin(resolved);
    setDestination(resolved.label);
    setAppliedDestination(resolved.label);
    setExpandedHotelId(null);
    setInvalidLocationQuery(null);
    // runSearch triggers via appliedDestination / searchOrigin
  };

  const handleToggleSaved = async (hotel) => {
    const key = hotelFavoriteKey(hotel.provider, hotel.providerHotelId);
    if (!key || pendingFavoriteKeysRef.current.has(key)) {
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in required", "Sign in to save hotels to your favorites.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign in",
          onPress: () => onNavigate?.("login"),
        },
      ]);
      return;
    }

    const wasSaved = savedHotels.includes(key);
    pendingFavoriteKeysRef.current.add(key);
    setPendingFavoriteKeys(Array.from(pendingFavoriteKeysRef.current));
    setSavedHotels((current) =>
      wasSaved ? current.filter((savedKey) => savedKey !== key) : [...current, key]
    );

    try {
      if (wasSaved) {
        await dashboardApi.removeFavorite(token, {
          itemType: "hotel",
          provider: hotel.provider,
          providerItemId: hotel.providerHotelId,
        });
      } else {
        await dashboardApi.addFavorite(token, {
          item_type: "hotel",
          provider: hotel.provider,
          provider_item_id: hotel.providerHotelId,
          entity_id: hotel.id,
          snapshot: {
            name: hotel.name,
            price: hotel.price,
            currency: hotel.currency || "USD",
            rating: hotel.rating,
            address: hotel.location,
            image_url: hotel.imageUrl || null,
            subtitle: (hotel.amenities || []).slice(0, 3).join(" • ") || null,
            lat: hotel.lat ?? null,
            lng: hotel.lng ?? null,
          },
        });
      }
    } catch (err) {
      setSavedHotels((current) =>
        wasSaved
          ? current.includes(key)
            ? current
            : [...current, key]
          : current.filter((savedKey) => savedKey !== key)
      );
      Alert.alert("Couldn't update favorites", err?.message || "Please try again.");
    } finally {
      pendingFavoriteKeysRef.current.delete(key);
      setPendingFavoriteKeys(Array.from(pendingFavoriteKeysRef.current));
    }
  };

  const handleUseMyLocation = async () => {
    setInvalidLocationQuery(null);
    setError(null);
    const next = await refreshLocation();
    if (!next) {
      setError("Location access needed — allow GPS to use your area.");
      return;
    }
    const city = await reverseGeocodeLabel(next.lat, next.lng);
    const label = city || `${next.lat.toFixed(2)}, ${next.lng.toFixed(2)}`;
    setDestination(label);
    setAppliedDestination(label);
    setSearchOrigin({ ...next, label, source: "gps" });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <StatusBar style="dark" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isPhone && styles.scrollContentPhone,
            { paddingBottom: scrollBottomPadding, paddingHorizontal: pagePad },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentInner}>
            <View style={[styles.headerRow, isPhone && styles.headerRowPhone]}>
                <DimPressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={onGoBack || onNavigateHome}
                  style={[styles.roundHeaderButton, isPhone && styles.roundHeaderButtonPhone]}
                >
                  <Ionicons name="arrow-back" size={isPhone ? 18 : 24} color="#14253E" />
                </DimPressable>

                <View style={styles.headerSpacer} />

                <View style={styles.headerActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                    onPress={() => onNavigate?.("notifications")}
                    style={[styles.headerActionButton, isPhone && styles.headerActionButtonPhone]}
                  >
                    <Ionicons name="notifications-outline" size={isPhone ? 20 : 24} color="#111827" />
                    <View style={[styles.notificationDot, isPhone && styles.notificationDotPhone]} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Profile"
                    onPress={() => onNavigate?.("profile")}
                    style={[styles.headerActionButton, isPhone && styles.headerActionButtonPhone]}
                  >
                    <Ionicons name="person-circle-outline" size={isPhone ? 24 : 28} color="#111827" />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.heroSection, isPhone && styles.heroSectionPhone]}>
                <View style={[styles.heroTextColumn, isPhone && styles.heroTextColumnPhone]}>
                  <Text style={[styles.heading, isPhone && styles.headingPhone]}>Hotels</Text>
                  <Text style={[styles.subtitle, isPhone && styles.subtitlePhone]}>
                    Wayfinder finds great places so you can focus on{" "}
                    <Text style={styles.subtitleAccent}>your trip.</Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.heroArtworkWrap,
                    isPhone && styles.heroArtworkWrapPhone,
                    { width: heroArtworkWidth },
                  ]}
                >
                  <Image
                    source={hotelHeroImage}
                    style={styles.heroArtworkImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

            <View style={[styles.searchCard, isPhone && styles.searchCardPhone]}>
              <View style={styles.searchDecorCircle} />
              <View style={styles.searchDecorRoute} />
              <MaterialCommunityIcons
                name="office-building"
                size={isPhone ? 34 : 48}
                color="rgba(255, 255, 255, 0.18)"
                style={styles.searchDecorBuilding}
              />
              <MaterialCommunityIcons
                name="city-variant"
                size={isPhone ? 28 : 40}
                color="rgba(255, 255, 255, 0.12)"
                style={styles.searchDecorCity}
              />
              <MaterialCommunityIcons
                name="palm-tree"
                size={isPhone ? 30 : 42}
                color="rgba(255, 255, 255, 0.2)"
                style={styles.searchDecorPalm}
              />
              <Ionicons
                name="location"
                size={isPhone ? 20 : 28}
                color="rgba(255, 255, 255, 0.9)"
                style={styles.searchDecorLocation}
              />

              <View style={styles.searchHeaderRow}>
                <View style={[styles.searchIconBadge, isPhone && styles.searchIconBadgePhone]}>
                  <MaterialCommunityIcons name="bed" size={isPhone ? 18 : 24} color="#1F5EE9" />
                </View>

                <View style={[styles.searchCopy, isPhone && styles.searchCopyPhone]}>
                  <View style={styles.searchTitleRow}>
                    <Text style={[styles.searchTitle, isPhone && styles.searchTitlePhone]}>
                      Find your stay
                    </Text>
                    <Ionicons
                      name="sparkles"
                      size={isPhone ? 14 : 18}
                      color="#FFD54A"
                      style={styles.searchSparkles}
                    />
                  </View>
                  <Text
                    style={[styles.searchSubtitle, isPhone && styles.searchSubtitlePhone]}
                    numberOfLines={2}
                  >
                    Search hotels by destination and compare options.
                  </Text>
                </View>
              </View>

              <View style={[styles.destinationInputWrap, isPhone && styles.destinationInputWrapPhone]}>
                <Ionicons name="search-outline" size={isPhone ? 18 : 26} color="#7D8AA5" />
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Where are you going?"
                  placeholderTextColor="#8F9AAF"
                  selectionColor="#1F78FF"
                  style={[styles.destinationInput, isPhone && styles.destinationInputPhone]}
                  returnKeyType="search"
                  onSubmitEditing={handleFindHotels}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleFindHotels}
                style={[styles.findHotelsButton, isPhone && styles.findHotelsButtonPhone]}
              >
                <Text style={[styles.findHotelsButtonText, isPhone && styles.findHotelsButtonTextPhone]}>
                  Find Hotels
                </Text>
                <Ionicons
                  name="sparkles"
                  size={isPhone ? 14 : 18}
                  color="#FFFFFF"
                  style={styles.findHotelsButtonSparkles}
                />
              </Pressable>
            </View>

            <Text style={[styles.sortHeading, isPhone && styles.sortHeadingPhone]}>Sort by</Text>
            <View style={[styles.locationStatusRow, isPhone && styles.locationStatusRowPhone]}>
              <Ionicons
                name={searchOrigin?.source === "search" ? "search" : isUsingDeviceLocation ? "navigate" : "location-outline"}
                size={isPhone ? 13 : 16}
                color="#1F78FF"
              />
              <Text style={[styles.locationStatusText, isPhone && styles.locationStatusTextPhone]}>
                {locationLabel}
              </Text>
              {status !== "loading" ? (
                <Pressable onPress={handleUseMyLocation} hitSlop={8}>
                  <Text style={[styles.locationRefreshText, isPhone && styles.locationRefreshTextPhone]}>
                    Use my location
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {narrowPhone ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.sortRow, styles.sortRowPhone, styles.sortRowScroll]}
              >
                {sortOptions.map((option) => (
                  <SortPill
                    key={option.key}
                    option={option}
                    isSelected={selectedSort === option.key}
                    onPress={() => setSelectedSort(option.key)}
                    compact={isPhone}
                    scrollable
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.sortRow, isPhone && styles.sortRowPhone]}>
                {sortOptions.map((option) => (
                  <SortPill
                    key={option.key}
                    option={option}
                    isSelected={selectedSort === option.key}
                    onPress={() => setSelectedSort(option.key)}
                    compact={isPhone}
                  />
                ))}
              </View>
            )}

            <View style={[styles.picksSectionHeader, isPhone && styles.picksSectionHeaderPhone]}>
              <View style={[styles.picksTitleWrap, isPhone && styles.picksTitleWrapPhone]}>
                <View style={[styles.picksIconBadge, isPhone && styles.picksIconBadgePhone]}>
                  <Ionicons name="checkmark" size={isPhone ? 12 : 18} color="#FFFFFF" />
                </View>

                <View style={styles.picksCopy}>
                  <Text style={[styles.picksTitle, isPhone && styles.picksTitlePhone]}>Wayfinder Picks</Text>
                  <Text
                    style={[styles.picksSubtitle, isPhone && styles.picksSubtitlePhone]}
                    numberOfLines={2}
                  >
                    Handpicked recommendations just for you.
                  </Text>
                </View>
              </View>

              <Text style={[styles.resultsCount, isPhone && styles.resultsCountPhone]}>{resultsLabel}</Text>
            </View>

            {usingMockData ? (
              <View style={styles.mockBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#B45309" />
                <Text style={styles.mockBannerText}>
                  Showing demo hotels — the API is using mock data, not LiteAPI live rates.
                </Text>
              </View>
            ) : null}

            {previewMode ? (
              <View style={styles.previewMessageCard}>
                <Ionicons name="eye-outline" size={18} color="#1F78FF" />
                <Text style={styles.previewMessageText}>
                  Local preview mode is showing curated hotel cards without calling the backend.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.emptyStateCard}>
                <MaterialCommunityIcons
                  name={invalidLocationQuery != null ? "map-marker-off" : "bed-outline"}
                  size={32}
                  color="#1F78FF"
                />
                <Text style={styles.emptyStateTitle}>
                  {invalidLocationQuery != null ? "No results found" : "Could not load hotels"}
                </Text>
                <Text style={styles.emptyStateCopy}>{error}</Text>
                {invalidLocationQuery != null ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleUseMyLocation}
                    style={styles.clearSearchButton}
                  >
                    <Text style={styles.clearSearchButtonText}>Use my location</Text>
                  </Pressable>
                ) : (
                  <Pressable accessibilityRole="button" onPress={runSearch} style={styles.clearSearchButton}>
                    <Text style={styles.clearSearchButtonText}>Try again</Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {!error && loading ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Finding hotels...</Text>
              </View>
            ) : null}

            {!error && !loading && visibleHotels.length > 0 ? (
              visibleHotels.map((hotel, hotelIndex) => {
                const favoriteKey = hotelFavoriteKey(hotel.provider, hotel.providerHotelId);
                const isSaved = savedHotels.includes(favoriteKey);
                const isFavoritePending = pendingFavoriteKeys.includes(favoriteKey);
                const isExpanded = expandedHotelId === hotel.id;
                const visibleAmenities = hotel.amenities || [];
                const amenityIconSize = isPhone ? 12 : 16;
                // Prefer short place label like the model ("Los Angeles, CA")
                const placeLabel = hotel.neighborhood || hotel.location || "";
                const badge = HOTEL_CARD_BADGES[hotelIndex % HOTEL_CARD_BADGES.length];
                const distanceLabel =
                  hotel.distanceMiles != null
                    ? `${hotel.distanceMiles.toFixed(1)} mi${
                        searchOrigin?.source === "search" ? " from search" : " from you"
                      }`
                    : null;

                return (
                  <View key={hotel.id} style={[styles.hotelCard, isPhone && styles.hotelCardPhone]}>
                    <View style={[styles.hotelCardTop, isPhone && styles.hotelCardTopPhone]}>
                      <View
                        style={[
                          styles.hotelImageShell,
                          isPhone && styles.hotelImageShellPhone,
                          { width: hotelImageWidth, height: hotelImageWidth },
                        ]}
                      >
                        <Image
                          source={hotel.image}
                          style={styles.hotelImageFill}
                          resizeMode="cover"
                        />
                        <View
                          style={[
                            styles.hotelBadge,
                            isPhone && styles.hotelBadgePhone,
                            { backgroundColor: badge.background },
                          ]}
                        >
                          <Ionicons
                            name={badge.icon}
                            size={isPhone ? 10 : 12}
                            color={badge.color}
                          />
                          <Text
                            style={[
                              styles.hotelBadgeText,
                              isPhone && styles.hotelBadgeTextPhone,
                              { color: badge.color },
                            ]}
                          >
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.hotelContent, isPhone && styles.hotelContentPhone]}>
                        <View style={[styles.hotelInfoCol, isPhone && styles.hotelInfoColPhone]}>
                          <Text
                            style={[styles.hotelName, isPhone && styles.hotelNamePhone]}
                            numberOfLines={2}
                          >
                            {hotel.name}
                          </Text>

                          <View style={[styles.locationRow, isPhone && styles.locationRowPhone]}>
                            <Ionicons
                              name="location"
                              size={isPhone ? 11 : 14}
                              color="#1F78FF"
                              style={styles.locationPin}
                            />
                            <Text
                              style={[styles.locationText, isPhone && styles.locationTextPhone]}
                              numberOfLines={2}
                            >
                              {placeLabel}
                              {distanceLabel ? ` • ${distanceLabel}` : ""}
                            </Text>
                          </View>

                          <View style={[styles.ratingRow, isPhone && styles.ratingRowPhone]}>
                            <Ionicons name="star" size={isPhone ? 11 : 14} color="#F5B402" />
                            <Text style={[styles.ratingValue, isPhone && styles.ratingValuePhone]}>
                              {Number(hotel.rating).toFixed(1)}
                            </Text>
                            {hotel.reviewCount > 0 ? (
                              <Text style={[styles.reviewText, isPhone && styles.reviewTextPhone]}>
                                {" "}
                                | ({hotel.reviewCount} reviews)
                              </Text>
                            ) : null}
                          </View>

                          {visibleAmenities.length > 0 ? (
                            <View style={[styles.amenitiesRow, isPhone && styles.amenitiesRowPhone]}>
                              {visibleAmenities.map((amenity) => (
                                <View
                                  key={amenity}
                                  style={[styles.amenityItem, isPhone && styles.amenityItemPhone]}
                                >
                                  {renderAmenityIcon(amenity, amenityIconSize)}
                                  <Text
                                    style={[styles.amenityText, isPhone && styles.amenityTextPhone]}
                                    numberOfLines={1}
                                  >
                                    {amenity}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>

                        <View style={[styles.priceBlock, isPhone && styles.priceBlockPhone]}>
                          <DimPressable
                            accessibilityRole="button"
                            accessibilityLabel={isSaved ? "Remove hotel from saved" : "Save hotel"}
                            accessibilityState={{ disabled: isFavoritePending }}
                            disabled={isFavoritePending}
                            onPress={() => handleToggleSaved(hotel)}
                            style={[
                              styles.favoriteButtonInline,
                              isPhone && styles.favoriteButtonInlinePhone,
                            ]}
                            hitSlop={8}
                          >
                            <Ionicons
                              name={isSaved ? "heart" : "heart-outline"}
                              size={isPhone ? 17 : 20}
                              color={isSaved ? "#FF5A4E" : "#14253E"}
                            />
                          </DimPressable>
                          <Text style={[styles.priceValue, isPhone && styles.priceValuePhone]}>
                            ${hotel.price}
                          </Text>
                          <Text style={[styles.priceUnit, isPhone && styles.priceUnitPhone]}>
                            / night
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.noteRow,
                        isPhone && styles.noteRowPhone,
                        stackCardActions && styles.noteRowStacked,
                      ]}
                    >
                      <View
                        style={[
                          styles.noteCard,
                          isPhone && styles.noteCardPhone,
                          stackCardActions && styles.noteCardStacked,
                          { backgroundColor: hotel.noteBackground },
                        ]}
                      >
                        <Image
                          source={tipBotImage}
                          resizeMode="contain"
                          style={[styles.noteRobotImage, isPhone && styles.noteRobotImagePhone]}
                        />
                        <Text style={[styles.noteText, isPhone && styles.noteTextPhone]}>
                          <Text style={styles.noteTextStrong}>Wayfinder note: </Text>
                          {hotel.recommendation}
                        </Text>
                      </View>

                      <DimPressable
                        accessibilityRole="button"
                        onPress={() =>
                          setExpandedHotelId((currentHotelId) =>
                            currentHotelId === hotel.id ? null : hotel.id
                          )
                        }
                        style={[
                          styles.detailsButton,
                          isPhone && styles.detailsButtonPhone,
                          stackCardActions && styles.detailsButtonStacked,
                        ]}
                      >
                        <Text
                          style={[styles.detailsButtonText, isPhone && styles.detailsButtonTextPhone]}
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                        </Text>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-forward"}
                          size={isPhone ? 13 : 15}
                          color="#1F5EE9"
                          style={styles.detailsButtonIcon}
                        />
                      </DimPressable>
                    </View>

                    {isExpanded ? (
                      <View
                        style={[
                          styles.expandedDetailsCard,
                          isPhone && styles.expandedDetailsCardPhone,
                        ]}
                      >
                        <Text
                          style={[styles.expandedTitle, isPhone && styles.expandedTitlePhone]}
                        >
                          Why it stands out
                        </Text>
                        <Text style={[styles.expandedCopy, isPhone && styles.expandedCopyPhone]}>
                          {hotel.details}
                        </Text>
                        <View style={styles.expandedChipRow}>
                          {hotel.detailChips.map((chip) => (
                            <View
                              key={chip}
                              style={[styles.expandedChip, isPhone && styles.expandedChipPhone]}
                            >
                              <Text
                                style={[
                                  styles.expandedChipText,
                                  isPhone && styles.expandedChipTextPhone,
                                ]}
                              >
                                {chip}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : null}

            {!error && !loading && visibleHotels.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <MaterialCommunityIcons name="bed-outline" size={32} color="#1F78FF" />
                <Text style={styles.emptyStateTitle}>
                  {appliedDestination
                    ? `No stays near ${appliedDestination.trim()} yet.`
                    : "Search a city to find stays."}
                </Text>
                <Text style={styles.emptyStateCopy}>
                  Try another city name, or use your current location.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleUseMyLocation}
                  style={styles.clearSearchButton}
                >
                  <Text style={styles.clearSearchButtonText}>Use my location</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <BottomNav activeLabel={null} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },
  screen: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 18,
    alignItems: "center",
    overflow: "visible",
  },
  scrollContentPhone: {
    paddingTop: 4,
  },
  contentInner: {
    width: "100%",
    maxWidth: 1040,
    overflow: "visible",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  headerRowPhone: {
    marginBottom: 0,
  },
  roundHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  roundHeaderButtonPhone: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerSpacer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
    width: 36,
    height: 36,
    marginLeft: 0,
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
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroSection: {
    marginTop: 4,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  heroSectionPhone: {
    marginTop: 2,
    marginBottom: 0,
    alignItems: "flex-end",
  },
  heroTextColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    paddingBottom: 6,
    zIndex: 2,
  },
  heroTextColumnPhone: {
    maxWidth: "55%",
    paddingRight: 4,
    paddingBottom: 4,
  },
  heading: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.4,
    color: "#10213B",
  },
  headingPhone: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: "#51607D",
  },
  subtitlePhone: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  subtitleAccent: {
    color: "#1F78FF",
    fontWeight: "700",
  },
  heroArtworkWrap: {
    width: 248,
    aspectRatio: 1536 / 896,
    marginLeft: -8,
    marginRight: -8,
    marginBottom: -10,
    overflow: "visible",
    zIndex: 1,
  },
  heroArtworkWrapPhone: {
    marginLeft: -10,
    marginRight: -6,
    marginBottom: -8,
    flexShrink: 0,
  },
  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },
  searchCard: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: "#156EF6",
    overflow: "hidden",
    zIndex: 3,
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  searchCardPhone: {
    marginTop: 2,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 18,
  },
  searchDecorCircle: {
    position: "absolute",
    top: -38,
    right: -42,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  searchDecorRoute: {
    position: "absolute",
    top: 22,
    right: 56,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
  },
  searchDecorLocation: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 2,
  },
  searchDecorBuilding: {
    position: "absolute",
    right: 70,
    bottom: 18,
  },
  searchDecorCity: {
    position: "absolute",
    right: 108,
    bottom: 24,
  },
  searchDecorPalm: {
    position: "absolute",
    right: 42,
    bottom: 12,
  },
  searchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  searchIconBadgePhone: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchCopy: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 72,
  },
  searchCopyPhone: {
    marginLeft: 8,
    paddingRight: 52,
  },
  searchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  searchTitlePhone: {
    fontSize: 15,
  },
  searchSparkles: {
    marginLeft: 4,
  },
  searchSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(244, 248, 255, 0.95)",
  },
  searchSubtitlePhone: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  destinationInputWrap: {
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  destinationInputWrapPhone: {
    marginTop: 8,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  destinationInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#14253E",
  },
  destinationInputPhone: {
    marginLeft: 8,
    fontSize: 14,
  },
  findHotelsButton: {
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#FF6E2E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  findHotelsButtonPhone: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 12,
  },
  findHotelsButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  findHotelsButtonTextPhone: {
    fontSize: 14,
  },
  findHotelsButtonSparkles: {
    marginLeft: 6,
  },
  sortHeading: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "800",
    color: "#14253E",
  },
  sortHeadingPhone: {
    marginTop: 12,
    fontSize: 14,
  },
  locationStatusRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationStatusRowPhone: {
    marginTop: 4,
  },
  locationStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  locationStatusTextPhone: {
    fontSize: 11,
  },
  locationRefreshText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F78FF",
  },
  locationRefreshTextPhone: {
    fontSize: 11,
  },
  sortRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  sortRowPhone: {
    marginTop: 8,
    flexWrap: "nowrap",
    marginHorizontal: -3,
  },
  sortRowScroll: {
    paddingRight: 8,
    flexGrow: 1,
  },
  sortPill: {
    minHeight: 42,
    minWidth: 120,
    marginHorizontal: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EDF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sortPillCompact: {
    flex: 1,
    minHeight: 34,
    minWidth: 0,
    marginHorizontal: 3,
    marginBottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 11,
  },
  sortPillScrollable: {
    flex: 0,
    minWidth: 104,
    paddingHorizontal: 10,
  },
  sortPillSelected: {
    backgroundColor: "#1F78FF",
    borderColor: "#1F78FF",
  },
  sortPillLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#16253C",
  },
  sortPillLabelCompact: {
    marginLeft: 3,
    fontSize: 10,
    letterSpacing: -0.15,
  },
  sortPillLabelSelected: {
    color: "#FFFFFF",
  },
  picksSectionHeader: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(131, 148, 171, 0.45)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  picksSectionHeaderPhone: {
    marginTop: 8,
    paddingTop: 10,
  },
  picksTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  picksTitleWrapPhone: {
    paddingRight: 8,
  },
  picksIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1F5EE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  picksIconBadgePhone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  picksCopy: {
    flex: 1,
    minWidth: 0,
  },
  picksTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F5EE9",
  },
  picksTitlePhone: {
    fontSize: 14,
  },
  picksSubtitle: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#4D5D7A",
  },
  picksSubtitlePhone: {
    fontSize: 11,
    lineHeight: 14,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F78FF",
    flexShrink: 0,
  },
  resultsCountPhone: {
    fontSize: 11,
  },
  mockBanner: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  mockBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#9A3412",
    fontWeight: "600",
  },
  previewMessageCard: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  previewMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#1E3A8A",
    fontWeight: "600",
  },

  // Hotel cards — compact top-aligned content (no title/price row gap)
  hotelCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#9AAECC",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  hotelCardPhone: {
    marginTop: 8,
    padding: 8,
    borderRadius: 14,
  },
  hotelCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hotelCardTopPhone: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hotelImageShell: {
    width: 128,
    height: 128,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#D9E6F7",
    flexShrink: 0,
    position: "relative",
  },
  hotelImageShellPhone: {
    borderRadius: 12,
  },
  hotelImageFill: {
    width: "100%",
    height: "100%",
  },
  hotelBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
  },
  hotelBadgePhone: {
    top: 5,
    left: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  hotelBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  hotelBadgeTextPhone: {
    fontSize: 9,
  },
  hotelContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hotelContentPhone: {
    marginLeft: 8,
  },
  hotelInfoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  hotelInfoColPhone: {
    paddingRight: 4,
  },
  hotelName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10213B",
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  hotelNamePhone: {
    fontSize: 13,
    lineHeight: 16,
  },
  priceBlock: {
    alignItems: "flex-end",
    flexShrink: 0,
    width: 52,
  },
  priceBlockPhone: {
    width: 48,
  },
  favoriteButtonInline: {
    width: 26,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  favoriteButtonInlinePhone: {
    width: 22,
    height: 18,
    marginBottom: 0,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F78FF",
    letterSpacing: -0.3,
  },
  priceValuePhone: {
    fontSize: 14,
  },
  priceUnit: {
    marginTop: -1,
    fontSize: 9,
    color: "#64748B",
  },
  priceUnitPhone: {
    fontSize: 8,
  },
  locationRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationRowPhone: {
    marginTop: 2,
  },
  locationPin: {
    marginTop: 1,
    marginRight: 3,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    color: "#4A5874",
  },
  locationTextPhone: {
    fontSize: 10,
    lineHeight: 13,
  },
  ratingRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  ratingRowPhone: {
    marginTop: 2,
  },
  ratingValue: {
    marginLeft: 3,
    fontSize: 12,
    fontWeight: "800",
    color: "#1F5EE9",
  },
  ratingValuePhone: {
    fontSize: 11,
  },
  reviewText: {
    fontSize: 11,
    color: "#64748B",
  },
  reviewTextPhone: {
    fontSize: 10,
  },
  amenitiesRow: {
    marginTop: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 6,
    rowGap: 2,
  },
  amenitiesRowPhone: {
    marginTop: 2,
    columnGap: 5,
    rowGap: 2,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  amenityItemPhone: {},
  amenityText: {
    marginLeft: 3,
    fontSize: 10,
    color: "#334155",
  },
  amenityTextPhone: {
    fontSize: 9,
  },
  noteRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteRowPhone: {
    marginTop: 5,
    gap: 5,
  },
  noteRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  noteCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  noteCardPhone: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 9,
  },
  noteCardStacked: {
    width: "100%",
  },
  noteRobotImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    flexShrink: 0,
    marginRight: 5,
  },
  noteRobotImagePhone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    color: "#16253C",
  },
  noteTextPhone: {
    fontSize: 10,
    lineHeight: 13,
  },
  noteTextStrong: {
    fontWeight: "800",
  },
  detailsButton: {
    minWidth: 100,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#C9DBFF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailsButtonPhone: {
    minWidth: 94,
    minHeight: 30,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  detailsButtonStacked: {
    alignSelf: "flex-end",
    minWidth: 104,
  },
  detailsButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1F5EE9",
  },
  detailsButtonTextPhone: {
    fontSize: 10,
  },
  detailsButtonIcon: {
    marginLeft: 3,
  },
  expandedDetailsCard: {
    marginTop: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFE9F7",
    backgroundColor: "#F8FBFF",
  },
  expandedDetailsCardPhone: {
    marginTop: 5,
    padding: 7,
    borderRadius: 9,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#14253E",
  },
  expandedTitlePhone: {
    fontSize: 11,
  },
  expandedCopy: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    color: "#4A5874",
  },
  expandedCopyPhone: {
    fontSize: 10,
    lineHeight: 14,
  },
  expandedChipRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  expandedChip: {
    marginRight: 5,
    marginBottom: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E9F7",
  },
  expandedChipPhone: {
    marginRight: 4,
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expandedChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
  },
  expandedChipTextPhone: {
    fontSize: 9,
  },
  emptyStateCard: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  emptyStateTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#14253E",
    textAlign: "center",
  },
  emptyStateCopy: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#51607D",
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#1F78FF",
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
