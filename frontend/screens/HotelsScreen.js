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
import { SafeAreaView } from "react-native-safe-area-context";

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
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import { WayfinderBrand } from "./AuthShared";

const hotelHeroImage = require("../assets/images/hotels/hotel-hero-complete.png");

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

function SortPill({ option, isSelected, onPress, compact = false }) {
  const Button = isSelected ? Pressable : DimPressable;

  return (
    <Button
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.sortPill, compact && styles.sortPillCompact, isSelected && styles.sortPillSelected]}
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

export default function HotelsScreen({ onGoBack, onNavigateHome, onNavigate, params = {} }) {
  const { width: windowWidth } = useWindowDimensions();
  const compact = windowWidth < 700;
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
  const [hotels, setHotels] = useState(() =>
    previewMode ? buildPreviewHotels(params.destination || dashboardApi.DEFAULT_DESTINATION) : []
  );
  const [loading, setLoading] = useState(previewMode);
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
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentInner}>
          <View style={[styles.headerRow, compact && styles.headerRowCompact]}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onGoBack || onNavigateHome}
                style={[styles.roundHeaderButton, compact && styles.roundHeaderButtonCompact]}
              >
                <Ionicons name="arrow-back" size={compact ? 22 : 28} color="#14253E" />
              </DimPressable>

              <View style={styles.brandSlot}>
                <WayfinderBrand
                  containerStyle={styles.headerBrandRow}
                  textStyle={[styles.headerBrandText, compact && styles.headerBrandTextCompact]}
                />
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  style={[styles.headerActionButton, compact && styles.headerActionButtonCompact]}
                >
                  <Ionicons name="notifications-outline" size={compact ? 22 : 28} color="#111827" />
                  <View style={[styles.notificationDot, compact && styles.notificationDotCompact]} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                  style={[styles.headerActionButton, compact && styles.headerActionButtonCompact]}
                >
                  <Ionicons name="person-circle-outline" size={compact ? 26 : 33} color="#111827" />
                </Pressable>
              </View>
            </View>

            <View style={[styles.heroSection, compact && styles.heroSectionCompact]}>
              <View style={[styles.heroTextColumn, compact && styles.heroTextColumnCompact]}>
                <Text style={[styles.heading, compact && styles.headingCompact]}>Hotels</Text>
                <Text
                  style={[styles.subtitle, compact && styles.subtitleCompact]}
                  numberOfLines={compact ? 2 : undefined}
                >
                  {compact ? (
                    <>
                      Wayfinder finds great places so you can{"\n"}
                      focus on <Text style={styles.subtitleAccent}>your trip.</Text>
                    </>
                  ) : (
                    <>
                      Wayfinder finds great places{"\n"}
                      so you can focus on <Text style={styles.subtitleAccent}>your trip.</Text>
                    </>
                  )}
                </Text>
              </View>

              <View style={[styles.heroArtworkWrap, compact && styles.heroArtworkWrapCompact]}>
                <Image
                  source={hotelHeroImage}
                  style={styles.heroArtworkImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={[styles.searchCard, compact && styles.searchCardCompact]}>
              <View style={styles.searchDecorCircle} />
              <View style={styles.searchDecorRoute} />
              <MaterialCommunityIcons
                name="office-building"
                size={compact ? 42 : 54}
                color="rgba(255, 255, 255, 0.2)"
                style={styles.searchDecorBuilding}
              />
              <MaterialCommunityIcons
                name="city-variant"
                size={compact ? 34 : 44}
                color="rgba(255, 255, 255, 0.14)"
                style={styles.searchDecorCity}
              />
              <MaterialCommunityIcons
                name="palm-tree"
                size={compact ? 38 : 48}
                color="rgba(255, 255, 255, 0.24)"
                style={styles.searchDecorPalm}
              />
              <Ionicons
                name="location"
                size={compact ? 26 : 34}
                color="rgba(255, 255, 255, 0.9)"
                style={styles.searchDecorLocation}
              />

              <View style={styles.searchHeaderRow}>
                <View style={[styles.searchIconBadge, compact && styles.searchIconBadgeCompact]}>
                  <MaterialCommunityIcons name="bed" size={compact ? 20 : 28} color="#1F5EE9" />
                </View>

                <View style={[styles.searchCopy, compact && styles.searchCopyCompact]}>
                  <View style={styles.searchTitleRow}>
                    <Text style={[styles.searchTitle, compact && styles.searchTitleCompact]}>
                      Find your stay
                    </Text>
                    <Ionicons
                      name="sparkles"
                      size={compact ? 16 : 22}
                      color="#FFD54A"
                      style={styles.searchSparkles}
                    />
                  </View>
                  {compact ? (
                    <Text style={[styles.searchSubtitle, styles.searchSubtitleCompact]} numberOfLines={1}>
                      Search hotels by destination and compare options.
                    </Text>
                  ) : (
                    <Text style={styles.searchSubtitle}>
                      Search hotels by destination and compare options.
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.destinationInputWrap, compact && styles.destinationInputWrapCompact]}>
                <Ionicons name="search-outline" size={compact ? 24 : 30} color="#7D8AA5" />
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Where are you going?"
                  placeholderTextColor="#8F9AAF"
                  selectionColor="#1F78FF"
                  style={[styles.destinationInput, compact && styles.destinationInputCompact]}
                  returnKeyType="search"
                  onSubmitEditing={handleFindHotels}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleFindHotels}
                style={[styles.findHotelsButton, compact && styles.findHotelsButtonCompact]}
              >
                <Text style={[styles.findHotelsButtonText, compact && styles.findHotelsButtonTextCompact]}>
                  Find Hotels
                </Text>
                <Ionicons
                  name="sparkles"
                  size={compact ? 16 : 20}
                  color="#FFFFFF"
                  style={styles.findHotelsButtonSparkles}
                />
              </Pressable>
            </View>

            <Text style={[styles.sortHeading, compact && styles.sortHeadingCompact]}>Sort by</Text>
            <View style={[styles.locationStatusRow, compact && styles.locationStatusRowCompact]}>
              <Ionicons
                name={searchOrigin?.source === "search" ? "search" : isUsingDeviceLocation ? "navigate" : "location-outline"}
                size={compact ? 14 : 16}
                color="#1F78FF"
              />
              <Text style={[styles.locationStatusText, compact && styles.locationStatusTextCompact]}>
                {locationLabel}
              </Text>
              {status !== "loading" ? (
                <Pressable onPress={handleUseMyLocation} hitSlop={8}>
                  <Text style={[styles.locationRefreshText, compact && styles.locationRefreshTextCompact]}>
                    Use my location
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.sortRow, compact && styles.sortRowCompact]}>
              {sortOptions.map((option) => (
                <SortPill
                  key={option.key}
                  option={option}
                  isSelected={selectedSort === option.key}
                  onPress={() => setSelectedSort(option.key)}
                  compact={compact}
                />
              ))}
            </View>

            <View style={[styles.picksSectionHeader, compact && styles.picksSectionHeaderCompact]}>
              <View style={styles.picksTitleWrap}>
                <View style={[styles.picksIconBadge, compact && styles.picksIconBadgeCompact]}>
                  <Ionicons name="checkmark" size={compact ? 14 : 22} color="#FFFFFF" />
                </View>

                <View style={styles.picksCopy}>
                  <Text style={[styles.picksTitle, compact && styles.picksTitleCompact]}>Wayfinder Picks</Text>
                  <Text style={[styles.picksSubtitle, compact && styles.picksSubtitleCompact]}>
                    Handpicked recommendations just for you.
                  </Text>
                </View>
              </View>

              <Text style={[styles.resultsCount, compact && styles.resultsCountCompact]}>{resultsLabel}</Text>
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
              visibleHotels.map((hotel) => {
                const favoriteKey = hotelFavoriteKey(hotel.provider, hotel.providerHotelId);
                const isSaved = savedHotels.includes(favoriteKey);
                const isFavoritePending = pendingFavoriteKeys.includes(favoriteKey);
                const isExpanded = expandedHotelId === hotel.id;
                const visibleAmenities = compact
                  ? (hotel.amenities || []).slice(0, 4)
                  : hotel.amenities || [];
                const amenityIconSize = compact ? 15 : 20;

                return (
                  <View key={hotel.id} style={[styles.hotelCard, compact && styles.hotelCardCompact]}>
                    <DimPressable
                      accessibilityRole="button"
                      accessibilityLabel={isSaved ? "Remove hotel from saved" : "Save hotel"}
                      accessibilityState={{ disabled: isFavoritePending }}
                      disabled={isFavoritePending}
                      onPress={() => handleToggleSaved(hotel)}
                      style={[styles.favoriteButton, compact && styles.favoriteButtonCompact]}
                    >
                      <Ionicons
                        name={isSaved ? "heart" : "heart-outline"}
                        size={compact ? 22 : 28}
                        color={isSaved ? "#FF5A4E" : "#14253E"}
                      />
                    </DimPressable>

                    <View style={[styles.hotelCardRow, compact && styles.hotelCardRowCompact]}>
                      <Image
                        source={hotel.image}
                        style={[styles.hotelImage, compact && styles.hotelImageCompact]}
                        resizeMode="cover"
                      />

                      <View style={[styles.hotelContent, compact && styles.hotelContentCompact]}>
                        <View style={[styles.hotelHeadingRow, compact && styles.hotelHeadingRowCompact]}>
                          <View style={[styles.hotelHeadingCopy, compact && styles.hotelHeadingCopyCompact]}>
                            <Text
                              style={[styles.hotelName, compact && styles.hotelNameCompact]}
                              numberOfLines={compact ? 2 : undefined}
                            >
                              {hotel.name}
                            </Text>

                            <View style={[styles.locationRow, compact && styles.locationRowCompact]}>
                              <Ionicons name="location" size={compact ? 13 : 16} color="#1F78FF" />
                              <Text
                                style={[styles.locationText, compact && styles.locationTextCompact]}
                                numberOfLines={compact ? 1 : undefined}
                              >
                                {hotel.neighborhood || hotel.location}
                              </Text>
                              {hotel.distanceMiles != null ? (
                                <>
                                  <Text style={[styles.inlineSeparator, compact && styles.inlineSeparatorCompact]}>
                                    |
                                  </Text>
                                  <Text style={[styles.locationText, compact && styles.locationTextCompact]}>
                                    {hotel.distanceMiles.toFixed(1)} mi
                                    {searchOrigin?.source === "search" ? " from search" : " from you"}
                                  </Text>
                                </>
                              ) : null}
                            </View>
                          </View>

                          <View style={[styles.priceBlock, compact && styles.priceBlockCompact]}>
                            <Text style={[styles.priceValue, compact && styles.priceValueCompact]}>
                              ${hotel.price}
                            </Text>
                            <Text style={[styles.priceUnit, compact && styles.priceUnitCompact]}>/ night</Text>
                          </View>
                        </View>

                        <View style={[styles.ratingRow, compact && styles.ratingRowCompact]}>
                          <View style={[styles.ratingBadge, compact && styles.ratingBadgeCompact]}>
                            <Ionicons name="star" size={compact ? 13 : 16} color="#F5B402" />
                            <Text style={[styles.ratingValue, compact && styles.ratingValueCompact]}>
                              {Number(hotel.rating).toFixed(1)}
                            </Text>
                          </View>

                          {hotel.reviewCount > 0 ? (
                            <>
                              <Text style={[styles.inlineSeparator, compact && styles.inlineSeparatorCompact]}>
                                |
                              </Text>
                              <Text style={[styles.reviewText, compact && styles.reviewTextCompact]}>
                                ({hotel.reviewCount} reviews)
                              </Text>
                            </>
                          ) : null}
                        </View>

                        <View style={[styles.amenitiesRow, compact && styles.amenitiesRowCompact]}>
                          {visibleAmenities.map((amenity) => (
                            <View
                              key={amenity}
                              style={[styles.amenityItem, compact && styles.amenityItemCompact]}
                            >
                              {renderAmenityIcon(amenity, amenityIconSize)}
                              <Text style={[styles.amenityText, compact && styles.amenityTextCompact]}>
                                {amenity}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View style={[styles.noteRow, compact && styles.noteRowCompact]}>
                          <View
                            style={[
                              styles.noteCard,
                              compact && styles.noteCardCompact,
                              { backgroundColor: hotel.noteBackground },
                            ]}
                          >
                            <View style={[styles.noteIconShell, compact && styles.noteIconShellCompact]}>
                              <MaterialCommunityIcons
                                name="robot-happy-outline"
                                size={compact ? 18 : 24}
                                color={hotel.noteIconColor}
                              />
                            </View>

                            <Text
                              style={[styles.noteText, compact && styles.noteTextCompact]}
                              numberOfLines={compact ? 2 : undefined}
                            >
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
                            style={[styles.detailsButton, compact && styles.detailsButtonCompact]}
                          >
                            <Text style={[styles.detailsButtonText, compact && styles.detailsButtonTextCompact]}>
                              {isExpanded ? "Hide Details" : "View Details"}
                            </Text>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-forward"}
                              size={compact ? 16 : 18}
                              color="#1F5EE9"
                              style={styles.detailsButtonIcon}
                            />
                          </DimPressable>
                        </View>

                        {isExpanded ? (
                          <View style={[styles.expandedDetailsCard, compact && styles.expandedDetailsCardCompact]}>
                            <Text style={[styles.expandedTitle, compact && styles.expandedTitleCompact]}>
                              Why it stands out
                            </Text>
                            <Text style={[styles.expandedCopy, compact && styles.expandedCopyCompact]}>
                              {hotel.details}
                            </Text>

                            <View style={styles.expandedChipRow}>
                              {hotel.detailChips.map((chip) => (
                                <View key={chip} style={[styles.expandedChip, compact && styles.expandedChipCompact]}>
                                  <Text
                                    style={[styles.expandedChipText, compact && styles.expandedChipTextCompact]}
                                  >
                                    {chip}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    </View>
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },

  scrollContent: {
    paddingTop: 62,
    paddingHorizontal: 18,
    paddingBottom: BOTTOM_NAV_CONTENT_PADDING,
    alignItems: "center",
    overflow: "visible",
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
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF7A32",
  },

  heroSection: {
    marginTop: 0,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    zIndex: 1,
  },

  heroTextColumn: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 10,
    zIndex: 2,
  },

  heading: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "800",
    letterSpacing: -1.8,
    color: "#10213B",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 26,
    color: "#51607D",
  },

  subtitleAccent: {
    color: "#1F78FF",
    fontWeight: "700",
  },

  heroArtworkWrap: {
    width: 268,
    aspectRatio: 1536 / 896,
    marginTop: -4,
    marginLeft: -12,
    marginRight: -14,
    // ~10% of banner height
    marginBottom: -16,
    overflow: "visible",
    position: "relative",
    zIndex: 1,
    backgroundColor: "#EAF2FC",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  searchCard: {
    marginTop: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 32,
    backgroundColor: "#156EF6",
    overflow: "hidden",
    zIndex: 3,
    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },

  searchDecorCircle: {
    position: "absolute",
    top: -38,
    right: -42,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  searchDecorRoute: {
    position: "absolute",
    top: 28,
    right: 66,
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.24)",
    borderStyle: "dashed",
  },

  searchDecorLocation: {
    position: "absolute",
    top: 22,
    right: 22,
    zIndex: 2,
  },

  searchDecorBuilding: {
    position: "absolute",
    right: 78,
    bottom: 22,
  },

  searchDecorCity: {
    position: "absolute",
    right: 118,
    bottom: 28,
  },

  searchDecorPalm: {
    position: "absolute",
    right: 48,
    bottom: 14,
  },

  searchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  searchIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0C56D7",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  searchCopy: {
    flex: 1,
    marginLeft: 16,
    paddingRight: 88,
  },

  searchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  searchTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },

  searchSparkles: {
    marginLeft: 6,
  },

  searchSubtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 23,
    color: "rgba(244, 248, 255, 0.95)",
  },

  destinationInputWrap: {
    marginTop: 20,
    minHeight: 78,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  destinationInput: {
    flex: 1,
    marginLeft: 14,
    fontSize: 18,
    color: "#14253E",
  },

  findHotelsButton: {
    marginTop: 14,
    minHeight: 68,
    paddingHorizontal: 26,
    borderRadius: 22,
    backgroundColor: "#FF6E2E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  findHotelsButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  findHotelsButtonSparkles: {
    marginLeft: 8,
  },

  sortHeading: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "800",
    color: "#14253E",
  },

  locationStatusRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  locationStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  locationRefreshText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F78FF",
  },

  sortRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  sortPill: {
    minHeight: 56,
    minWidth: 152,
    marginHorizontal: 6,
    marginBottom: 12,
    paddingHorizontal: 18,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EDF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A6B7CC",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  sortPillSelected: {
    backgroundColor: "#1F78FF",
    borderColor: "#1F78FF",
  },

  sortPillLabel: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#16253C",
    textAlign: "center",
  },

  sortPillLabelSelected: {
    color: "#FFFFFF",
  },

  picksSectionHeader: {
    marginTop: 8,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(131, 148, 171, 0.45)",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  picksTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    paddingRight: 12,
  },

  picksIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#1F5EE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  picksCopy: {
    flex: 1,
  },

  picksTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F5EE9",
  },

  picksSubtitle: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 22,
    color: "#4D5D7A",
  },

  resultsCount: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F78FF",
  },

  activeSearchPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE7F8",
    flexDirection: "row",
    alignItems: "center",
  },

  activeSearchText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#1F5EE9",
  },

  mockBanner: {
    marginTop: 12,
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

  hotelCard: {
    position: "relative",
    marginTop: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    shadowColor: "#9AAECC",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  favoriteButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    zIndex: 2,
  },

  hotelCardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  hotelImage: {
    width: 148,
    height: 148,
    borderRadius: 24,
  },

  hotelContent: {
    flex: 1,
    minWidth: 220,
    marginLeft: 18,
    paddingRight: 46,
  },

  hotelHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  hotelHeadingCopy: {
    flex: 1,
    minWidth: 180,
    paddingRight: 12,
  },

  hotelName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10213B",
    letterSpacing: -0.8,
  },

  locationRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  locationText: {
    marginLeft: 6,
    fontSize: 15,
    color: "#4A5874",
  },

  inlineSeparator: {
    marginHorizontal: 10,
    fontSize: 15,
    color: "#9AA7BD",
  },

  priceBlock: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginTop: 4,
  },

  priceValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F78FF",
    letterSpacing: -1.1,
  },

  priceUnit: {
    marginTop: 2,
    fontSize: 15,
    color: "#34435D",
  },

  ratingRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  ratingBadge: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FFF5D6",
    flexDirection: "row",
    alignItems: "center",
  },

  ratingValue: {
    marginLeft: 6,
    fontSize: 18,
    fontWeight: "800",
    color: "#1F5EE9",
  },

  reviewText: {
    fontSize: 16,
    color: "#45536E",
  },

  amenitiesRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  amenityItem: {
    marginRight: 18,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  amenityText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#16253C",
  },

  noteRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },

  noteCard: {
    flex: 1,
    minWidth: 220,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  noteIconShell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    marginRight: 10,
  },

  noteText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: "#16253C",
  },

  noteTextStrong: {
    fontWeight: "800",
  },

  detailsButton: {
    minWidth: 170,
    minHeight: 54,
    marginTop: 12,
    marginLeft: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#C9DBFF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F5EE9",
  },

  detailsButtonIcon: {
    marginLeft: 8,
  },

  expandedDetailsCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DFE9F7",
    backgroundColor: "#F8FBFF",
  },

  expandedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14253E",
  },

  expandedCopy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#4A5874",
  },

  expandedChipRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  expandedChip: {
    marginRight: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E9F7",
  },

  expandedChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  emptyStateCard: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    shadowColor: "#A3B4CA",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  emptyStateTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#14253E",
    textAlign: "center",
  },

  emptyStateCopy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#51607D",
    textAlign: "center",
  },

  clearSearchButton: {
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#1F78FF",
    alignItems: "center",
    justifyContent: "center",
  },

  clearSearchButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Narrow / phone — keep page design; shrink sort pills into one row.
  scrollContentCompact: {
    paddingTop: 52,
    paddingHorizontal: 14,
  },

  headerRowCompact: {
    marginBottom: 0,
  },

  roundHeaderButtonCompact: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  headerBrandTextCompact: {
    fontSize: 22,
  },

  headerActionButtonCompact: {
    width: 44,
    height: 44,
    marginLeft: 4,
  },

  notificationDotCompact: {
    top: 7,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  heroSectionCompact: {
    marginTop: 0,
    alignItems: "flex-end",
  },

  heroTextColumnCompact: {
    flex: 1,
    minWidth: 0,
    maxWidth: "54%",
    paddingTop: 0,
    paddingRight: 2,
    paddingBottom: 8,
  },

  headingCompact: {
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.2,
  },

  subtitleCompact: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },

  heroArtworkWrapCompact: {
    width: 204,
    aspectRatio: 1536 / 896,
    height: undefined,
    marginTop: -6,
    marginLeft: -16,
    marginRight: -14,
    // ~10% of banner height
    marginBottom: -12,
    flexShrink: 0,
    backgroundColor: "#EAF2FC",
  },

  searchCardCompact: {
    marginTop: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  searchIconBadgeCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },

  searchCopyCompact: {
    marginLeft: 10,
    paddingRight: 72,
  },

  searchTitleCompact: {
    fontSize: 17,
    letterSpacing: -0.3,
  },

  searchSubtitleCompact: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },

  destinationInputWrapCompact: {
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  destinationInputCompact: {
    marginLeft: 8,
    fontSize: 15,
  },

  findHotelsButtonCompact: {
    marginTop: 8,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  findHotelsButtonTextCompact: {
    fontSize: 14,
  },

  sortHeadingCompact: {
    marginTop: 14,
    fontSize: 15,
  },

  locationStatusRowCompact: {
    marginTop: 4,
  },

  locationStatusTextCompact: {
    fontSize: 12,
  },

  locationRefreshTextCompact: {
    fontSize: 12,
  },

  sortRowCompact: {
    marginTop: 8,
    flexWrap: 'nowrap',
    marginHorizontal: -3,
  },

  sortPillCompact: {
    flex: 1,
    minHeight: 36,
    minWidth: 0,
    marginHorizontal: 3,
    marginBottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRadius: 12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  sortPillLabelCompact: {
    marginLeft: 2,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: -0.35,
    textAlign: "center",
    flexShrink: 1,
  },

  picksSectionHeaderCompact: {
    marginTop: 8,
    marginBottom: 2,
  },

  picksIconBadgeCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  picksTitleCompact: {
    fontSize: 15,
  },

  picksSubtitleCompact: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
  },

  resultsCountCompact: {
    marginTop: 0,
    fontSize: 12,
  },

  hotelCardCompact: {
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    minHeight: 118,
  },

  favoriteButtonCompact: {
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  hotelCardRowCompact: {
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    minHeight: 100,
  },

  hotelImageCompact: {
    width: 132,
    height: 100,
    borderRadius: 12,
  },

  hotelContentCompact: {
    minWidth: 0,
    flex: 1,
    marginLeft: 12,
    paddingRight: 32,
    justifyContent: 'space-between',
  },

  hotelHeadingRowCompact: {
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
  },

  hotelHeadingCopyCompact: {
    minWidth: 0,
    flex: 1,
    paddingRight: 8,
  },

  hotelNameCompact: {
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 19,
  },

  locationRowCompact: {
    marginTop: 3,
  },

  locationTextCompact: {
    marginLeft: 3,
    fontSize: 11,
    flexShrink: 1,
  },

  inlineSeparatorCompact: {
    marginHorizontal: 5,
    fontSize: 11,
  },

  priceBlockCompact: {
    marginTop: 0,
  },

  priceValueCompact: {
    fontSize: 18,
    letterSpacing: -0.4,
  },

  priceUnitCompact: {
    fontSize: 10,
  },

  ratingRowCompact: {
    marginTop: 6,
  },

  ratingBadgeCompact: {
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 8,
  },

  ratingValueCompact: {
    marginLeft: 3,
    fontSize: 12,
  },

  reviewTextCompact: {
    fontSize: 11,
  },

  amenitiesRowCompact: {
    marginTop: 6,
  },

  amenityItemCompact: {
    marginRight: 8,
    marginBottom: 2,
  },

  amenityTextCompact: {
    marginLeft: 3,
    fontSize: 11,
  },

  noteRowCompact: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },

  noteCardCompact: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },

  noteIconShellCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },

  noteTextCompact: {
    fontSize: 11,
    lineHeight: 14,
  },

  detailsButtonCompact: {
    minWidth: 0,
    minHeight: 34,
    marginTop: 0,
    marginLeft: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  detailsButtonTextCompact: {
    fontSize: 11,
  },

  expandedDetailsCardCompact: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
  },

  expandedTitleCompact: {
    fontSize: 13,
  },

  expandedCopyCompact: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },

  expandedChipCompact: {
    marginRight: 6,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  expandedChipTextCompact: {
    fontSize: 10,
  },
});
