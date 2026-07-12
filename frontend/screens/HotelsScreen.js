import { useCallback, useEffect, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as dashboardApi from "../src/api/dashboard";
import { mapHotelForAlly, sortKeyToApi } from "../src/api/mappers";
import { getToken } from "../src/auth/tokenStorage";
import { useUserLocation } from "../src/location/UserLocationContext";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import { WayfinderBrand } from "./AuthShared";

const hotelHeroImage = require("../assets/images/hotels/hotel-hero-reference.png");

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

function renderSortIcon(option, isSelected) {
  const iconColor = isSelected ? "#FFFFFF" : "#1F78FF";

  if (option.library === "material") {
    return <MaterialCommunityIcons name={option.icon} size={22} color={iconColor} />;
  }

  return <Ionicons name={option.icon} size={21} color={iconColor} />;
}

function renderAmenityIcon(amenity) {
  if (amenity === "Pool") {
    return <MaterialCommunityIcons name="pool" size={20} color="#14253E" />;
  }

  if (amenity === "Parking") {
    return <Ionicons name="car-outline" size={20} color="#14253E" />;
  }

  if (amenity === "Breakfast") {
    return <Ionicons name="cafe-outline" size={20} color="#14253E" />;
  }

  if (amenity === "Gym") {
    return <Ionicons name="barbell-outline" size={20} color="#14253E" />;
  }

  return <Ionicons name="wifi-outline" size={20} color="#14253E" />;
}

function SortPill({ option, isSelected, onPress }) {
  const Button = isSelected ? Pressable : DimPressable;

  return (
    <Button
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.sortPill, isSelected && styles.sortPillSelected]}
    >
      {renderSortIcon(option, isSelected)}
      <Text style={[styles.sortPillLabel, isSelected && styles.sortPillLabelSelected]}>
        {option.label}
      </Text>
    </Button>
  );
}

export default function HotelsScreen({ onGoBack, onNavigateHome, onNavigate, params = {} }) {
  const { location, status, isUsingDeviceLocation, refreshLocation } = useUserLocation();
  const [destination, setDestination] = useState(params.destination || dashboardApi.DEFAULT_DESTINATION);
  const [appliedDestination, setAppliedDestination] = useState(params.destination || dashboardApi.DEFAULT_DESTINATION);
  const [selectedSort, setSelectedSort] = useState("bestMatch");
  const [savedHotels, setSavedHotels] = useState([]);
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async () => {
    if (status === "loading") {
      return;
    }

    const query = (appliedDestination || dashboardApi.DEFAULT_DESTINATION).trim();
    const apiSort = sortKeyToApi(selectedSort);

    if (apiSort === "distance" && !isUsingDeviceLocation) {
      setError("Enable location access to sort by closest.");
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

      const results = await dashboardApi.searchHotels(
        token,
        query,
        apiSort,
        location
      );
      setHotels(results.map((hotel, index) => mapHotelForAlly(hotel, index, location)));
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : "Search failed.";
      setError(message);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [appliedDestination, selectedSort, location, status, isUsingDeviceLocation]);

  const locationLabel =
    status === "loading"
      ? "Locating you..."
      : isUsingDeviceLocation
        ? `Using your GPS (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})`
        : "Location access needed — allow GPS for real distances";

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const visibleHotels = hotels;
  const resultsLabel = loading
    ? "Searching..."
    : `${visibleHotels.length} result${visibleHotels.length === 1 ? "" : "s"}`;

  const handleFindHotels = () => {
    setAppliedDestination(destination.trim() || dashboardApi.DEFAULT_DESTINATION);
    setExpandedHotelId(null);
  };

  const handleToggleSaved = (hotelId) => {
    setSavedHotels((currentSavedHotels) =>
      currentSavedHotels.includes(hotelId)
        ? currentSavedHotels.filter((savedHotelId) => savedHotelId !== hotelId)
        : [...currentSavedHotels, hotelId]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentInner}>
            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onGoBack || onNavigateHome}
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

            <View style={styles.heroSection}>
              <View style={styles.heroTextColumn}>
                <Text style={styles.heading}>Hotels</Text>
                <Text style={styles.subtitle}>
                  Wayfinder finds great places{"\n"}
                  so you can focus on <Text style={styles.subtitleAccent}>your trip.</Text>
                </Text>
              </View>

              <View style={styles.heroArtworkWrap}>
                <View style={styles.heroArtworkGlow} />
                <Image
                  source={hotelHeroImage}
                  style={styles.heroArtworkImage}
                  resizeMode="contain"
                />
                <View style={styles.heroArtworkFade} />
              </View>
            </View>

            <View style={styles.searchCard}>
              <View style={styles.searchDecorCircle} />
              <View style={styles.searchDecorRoute} />
              <Ionicons
                name="location"
                size={34}
                color="rgba(255, 255, 255, 0.85)"
                style={styles.searchDecorLocation}
              />
              <MaterialCommunityIcons
                name="city-variant-outline"
                size={46}
                color="rgba(255, 255, 255, 0.12)"
                style={styles.searchDecorCity}
              />

              <View style={styles.searchHeaderRow}>
                <View style={styles.searchIconBadge}>
                  <MaterialCommunityIcons name="bed" size={28} color="#1F5EE9" />
                </View>

                <View style={styles.searchCopy}>
                  <View style={styles.searchTitleRow}>
                    <Text style={styles.searchTitle}>Find your stay</Text>
                    <Ionicons name="sparkles" size={22} color="#FFD54A" style={styles.searchSparkles} />
                  </View>
                  <Text style={styles.searchSubtitle}>
                    Search hotels by destination and compare options.
                  </Text>
                </View>
              </View>

              <View style={styles.destinationInputWrap}>
                <Ionicons name="search-outline" size={30} color="#7D8AA5" />
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Where are you going?"
                  placeholderTextColor="#8F9AAF"
                  selectionColor="#1F78FF"
                  style={styles.destinationInput}
                  returnKeyType="search"
                  onSubmitEditing={handleFindHotels}
                />
              </View>

              <Pressable accessibilityRole="button" onPress={handleFindHotels} style={styles.findHotelsButton}>
                <Text style={styles.findHotelsButtonText}>Find Hotels</Text>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" style={styles.findHotelsButtonSparkles} />
              </Pressable>
            </View>

            <Text style={styles.sortHeading}>Sort by</Text>
            <View style={styles.locationStatusRow}>
              <Ionicons
                name={isUsingDeviceLocation ? "navigate" : "location-outline"}
                size={16}
                color="#1F78FF"
              />
              <Text style={styles.locationStatusText}>{locationLabel}</Text>
              {status !== "loading" ? (
                <Pressable onPress={refreshLocation} hitSlop={8}>
                  <Text style={styles.locationRefreshText}>Refresh</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.sortRow}>
              {sortOptions.map((option) => (
                <SortPill
                  key={option.key}
                  option={option}
                  isSelected={selectedSort === option.key}
                  onPress={() => setSelectedSort(option.key)}
                />
              ))}
            </View>

            <View style={styles.picksSectionHeader}>
              <View style={styles.picksTitleWrap}>
                <View style={styles.picksIconBadge}>
                  <Ionicons name="checkmark-done" size={24} color="#1F5EE9" />
                </View>

                <View style={styles.picksCopy}>
                  <Text style={styles.picksTitle}>Wayfinder Picks</Text>
                  <Text style={styles.picksSubtitle}>Handpicked recommendations just for you.</Text>
                </View>
              </View>

              <Text style={styles.resultsCount}>{resultsLabel}</Text>
            </View>

            {appliedDestination ? (
              <View style={styles.activeSearchPill}>
                <Ionicons name="search-outline" size={16} color="#1F78FF" />
                <Text style={styles.activeSearchText}>{appliedDestination.trim()}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.emptyStateCard}>
                <MaterialCommunityIcons name="bed-outline" size={32} color="#1F78FF" />
                <Text style={styles.emptyStateTitle}>Could not load hotels</Text>
                <Text style={styles.emptyStateCopy}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={runSearch} style={styles.clearSearchButton}>
                  <Text style={styles.clearSearchButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {!error && loading ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Finding hotels...</Text>
              </View>
            ) : null}

            {!error && !loading && visibleHotels.length > 0 ? (
              visibleHotels.map((hotel) => {
                const isSaved = savedHotels.includes(hotel.id);
                const isExpanded = expandedHotelId === hotel.id;

                return (
                  <View key={hotel.id} style={styles.hotelCard}>
                    <DimPressable
                      accessibilityRole="button"
                      accessibilityLabel={isSaved ? "Remove hotel from saved" : "Save hotel"}
                      onPress={() => handleToggleSaved(hotel.id)}
                      style={styles.favoriteButton}
                    >
                      <Ionicons
                        name={isSaved ? "heart" : "heart-outline"}
                        size={28}
                        color={isSaved ? "#FF5A4E" : "#14253E"}
                      />
                    </DimPressable>

                    <View style={styles.hotelCardRow}>
                      <Image source={hotel.image} style={styles.hotelImage} resizeMode="cover" />

                      <View style={styles.hotelContent}>
                        <View style={styles.hotelHeadingRow}>
                          <View style={styles.hotelHeadingCopy}>
                            <Text style={styles.hotelName}>{hotel.name}</Text>

                            <View style={styles.locationRow}>
                              <Ionicons name="location" size={16} color="#1F78FF" />
                              <Text style={styles.locationText}>{hotel.location}</Text>
                              {hotel.distanceMiles != null ? (
                                <>
                                  <Text style={styles.inlineSeparator}>|</Text>
                                  <Text style={styles.locationText}>
                                    {hotel.distanceMiles.toFixed(1)} mi from you
                                  </Text>
                                </>
                              ) : null}
                            </View>
                          </View>

                          <View style={styles.priceBlock}>
                            <Text style={styles.priceValue}>${hotel.price}</Text>
                            <Text style={styles.priceUnit}>/ night</Text>
                          </View>
                        </View>

                        <View style={styles.ratingRow}>
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={16} color="#F5B402" />
                            <Text style={styles.ratingValue}>{Number(hotel.rating).toFixed(1)}</Text>
                          </View>

                          <Text style={styles.inlineSeparator}>|</Text>
                          <Text style={styles.reviewText}>
                            {hotel.reviewCount > 0
                              ? `(${hotel.reviewCount} reviews)`
                              : "(via Wayfinder)"}
                          </Text>
                        </View>

                        <View style={styles.amenitiesRow}>
                          {hotel.amenities.map((amenity) => (
                            <View key={amenity} style={styles.amenityItem}>
                              {renderAmenityIcon(amenity)}
                              <Text style={styles.amenityText}>{amenity}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.noteRow}>
                          <View style={[styles.noteCard, { backgroundColor: hotel.noteBackground }]}>
                            <View style={styles.noteIconShell}>
                              <MaterialCommunityIcons
                                name="robot-happy-outline"
                                size={24}
                                color={hotel.noteIconColor}
                              />
                            </View>

                            <Text style={styles.noteText}>
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
                            style={styles.detailsButton}
                          >
                            <Text style={styles.detailsButtonText}>
                              {isExpanded ? "Hide Details" : "View Details"}
                            </Text>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-forward"}
                              size={18}
                              color="#1F5EE9"
                              style={styles.detailsButtonIcon}
                            />
                          </DimPressable>
                        </View>

                        {isExpanded ? (
                          <View style={styles.expandedDetailsCard}>
                            <Text style={styles.expandedTitle}>Why it stands out</Text>
                            <Text style={styles.expandedCopy}>{hotel.details}</Text>

                            <View style={styles.expandedChipRow}>
                              {hotel.detailChips.map((chip) => (
                                <View key={chip} style={styles.expandedChip}>
                                  <Text style={styles.expandedChipText}>{chip}</Text>
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
                <Text style={styles.emptyStateTitle}>No stays match that destination yet.</Text>
                <Text style={styles.emptyStateCopy}>
                  Try another destination such as Bali or Japan.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDestination(dashboardApi.DEFAULT_DESTINATION);
                    setAppliedDestination(dashboardApi.DEFAULT_DESTINATION);
                  }}
                  style={styles.clearSearchButton}
                >
                  <Text style={styles.clearSearchButtonText}>Search {dashboardApi.DEFAULT_DESTINATION}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <BottomNav activeLabel="Home" onNavigate={onNavigate} />
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
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: BOTTOM_NAV_CONTENT_PADDING,
    alignItems: "center",
  },

  contentInner: {
    width: "100%",
    maxWidth: 1040,
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
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  heroTextColumn: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 230,
    maxWidth: 410,
    paddingTop: 8,
    paddingRight: 14,
  },

  heading: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "800",
    letterSpacing: -2,
    color: "#10213B",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 30,
    color: "#51607D",
  },

  subtitleAccent: {
    color: "#1F78FF",
    fontWeight: "700",
  },

  heroArtworkWrap: {
    flexGrow: 1,
    minWidth: 220,
    maxWidth: 430,
    height: 212,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },

  heroArtworkGlow: {
    position: "absolute",
    right: 22,
    bottom: 10,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(111, 170, 255, 0.15)",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  heroArtworkFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 8,
    backgroundColor: "#EAF2FC",
  },

  searchCard: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 32,
    backgroundColor: "#156EF6",
    overflow: "hidden",
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
    top: 28,
    right: 26,
  },

  searchDecorCity: {
    position: "absolute",
    right: 92,
    bottom: 18,
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
    paddingRight: 40,
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
    backgroundColor: "#E7F0FF",
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
});
