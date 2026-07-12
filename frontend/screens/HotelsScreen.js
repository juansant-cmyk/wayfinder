import { useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { WayfinderBrand } from "./AuthShared";

const hotelHeroImage = require("../assets/images/hotels/hotel-hero-reference.png");

const mockHotels = [
  {
    id: "sunset-inn",
    rank: 1,
    name: "Sunset Inn",
    location: "Los Angeles, CA",
    neighborhood: "West Hollywood",
    distanceMiles: 2.1,
    rating: 4.6,
    reviewCount: 532,
    price: 149,
    amenities: ["WiFi", "Pool", "Parking"],
    image: require("../assets/images/hotels/hotel-card-sunset-inn.png"),
    searchTerms: ["los angeles", "la", "west hollywood", "hollywood", "sunset"],
    recommendation:
      "Great value with excellent amenities and an easy ride to major attractions.",
    details:
      "A bright, modern stay with a courtyard pool, valet parking, and quick access to restaurants, nightlife, and rideshare pickup points.",
    noteBackground: "#EFF5FF",
    noteIconColor: "#2563EB",
    detailChips: ["Free cancellation", "Late checkout", "Pool view rooms"],
  },
  {
    id: "city-view-hotel",
    rank: 2,
    name: "City View Hotel",
    location: "Downtown LA",
    neighborhood: "City Center",
    distanceMiles: 1.4,
    rating: 4.4,
    reviewCount: 318,
    price: 119,
    amenities: ["WiFi", "Breakfast", "Gym"],
    image: require("../assets/images/hotels/hotel-card-city-view.png"),
    searchTerms: ["downtown", "downtown la", "los angeles", "la", "city center"],
    recommendation:
      "Affordable and close to popular spots, with the fastest access to downtown plans.",
    details:
      "An upbeat hotel near museums, transit, and coffee shops, with free breakfast, a compact fitness room, and reliable WiFi for work or trip planning.",
    noteBackground: "#EDF8F3",
    noteIconColor: "#0F9F5B",
    detailChips: ["Breakfast included", "Walkable area", "Gym access"],
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

const bottomNavItems = [
  { label: "Home", icon: "home", active: true },
  { label: "Itinerary", icon: "calendar-clear", active: false },
  { label: "Saved", icon: "bookmark-outline", active: false },
  { label: "Trips", icon: "briefcase-outline", active: false },
  { label: "Profile", icon: "person-outline", active: false },
];

function normalizeText(value = "") {
  return value.trim().toLowerCase();
}

function getMatchScore(hotel, query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 1;
  }

  const searchableFields = [
    hotel.name,
    hotel.location,
    hotel.neighborhood,
    ...(hotel.searchTerms || []),
  ];

  return searchableFields.reduce((bestScore, field) => {
    const normalizedField = normalizeText(field);

    if (!normalizedField) {
      return bestScore;
    }

    if (normalizedField === normalizedQuery) {
      return Math.max(bestScore, 5);
    }

    if (normalizedField.startsWith(normalizedQuery)) {
      return Math.max(bestScore, 4);
    }

    if (normalizedField.includes(normalizedQuery)) {
      return Math.max(bestScore, 3);
    }

    return bestScore;
  }, 0);
}

function getSortedHotels(hotels, selectedSort, appliedDestination) {
  const hotelsToSort = [...hotels];

  hotelsToSort.sort((firstHotel, secondHotel) => {
    if (selectedSort === "lowestPrice") {
      return firstHotel.price - secondHotel.price || secondHotel.rating - firstHotel.rating;
    }

    if (selectedSort === "highestRated") {
      return secondHotel.rating - firstHotel.rating || firstHotel.price - secondHotel.price;
    }

    if (selectedSort === "closest") {
      return (
        firstHotel.distanceMiles - secondHotel.distanceMiles ||
        secondHotel.rating - firstHotel.rating
      );
    }

    const secondScore = getMatchScore(secondHotel, appliedDestination);
    const firstScore = getMatchScore(firstHotel, appliedDestination);

    return secondScore - firstScore || firstHotel.rank - secondHotel.rank;
  });

  return hotelsToSort;
}

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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.sortPill, isSelected && styles.sortPillSelected]}
    >
      {renderSortIcon(option, isSelected)}
      <Text style={[styles.sortPillLabel, isSelected && styles.sortPillLabelSelected]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

export default function HotelsScreen({ onGoBack, onNavigateHome }) {
  const [destination, setDestination] = useState("");
  const [appliedDestination, setAppliedDestination] = useState("");
  const [selectedSort, setSelectedSort] = useState("bestMatch");
  const [savedHotels, setSavedHotels] = useState([]);
  const [expandedHotelId, setExpandedHotelId] = useState(null);

  const filteredHotels = mockHotels.filter((hotel) => getMatchScore(hotel, appliedDestination) > 0);
  const visibleHotels = getSortedHotels(filteredHotels, selectedSort, appliedDestination);
  const resultsLabel = `${visibleHotels.length} result${visibleHotels.length === 1 ? "" : "s"}`;

  const handleFindHotels = () => {
    setAppliedDestination(destination.trim());
    setExpandedHotelId(null);
  };

  const handleToggleSaved = (hotelId) => {
    setSavedHotels((currentSavedHotels) =>
      currentSavedHotels.includes(hotelId)
        ? currentSavedHotels.filter((savedHotelId) => savedHotelId !== hotelId)
        : [...currentSavedHotels, hotelId]
    );
  };

  const handleBottomNavPress = (label) => {
    if (label === "Home" && onNavigateHome) {
      onNavigateHome();
      return;
    }

    Alert.alert(label, "Coming soon");
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onGoBack || onNavigateHome}
                style={styles.roundHeaderButton}
              >
                <Ionicons name="arrow-back" size={28} color="#14253E" />
              </Pressable>

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
                  onPress={() => Alert.alert("Notifications", "Coming soon")}
                  style={styles.headerActionButton}
                >
                  <Ionicons name="notifications-outline" size={28} color="#111827" />
                  <View style={styles.notificationDot} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => Alert.alert("Profile", "Coming soon")}
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

            {visibleHotels.length > 0 ? (
              visibleHotels.map((hotel) => {
                const isSaved = savedHotels.includes(hotel.id);
                const isExpanded = expandedHotelId === hotel.id;

                return (
                  <View key={hotel.id} style={styles.hotelCard}>
                    <Pressable
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
                    </Pressable>

                    <View style={styles.hotelCardRow}>
                      <Image source={hotel.image} style={styles.hotelImage} resizeMode="cover" />

                      <View style={styles.hotelContent}>
                        <View style={styles.hotelHeadingRow}>
                          <View style={styles.hotelHeadingCopy}>
                            <Text style={styles.hotelName}>{hotel.name}</Text>

                            <View style={styles.locationRow}>
                              <Ionicons name="location" size={16} color="#1F78FF" />
                              <Text style={styles.locationText}>{hotel.location}</Text>
                              <Text style={styles.inlineSeparator}>|</Text>
                              <Text style={styles.locationText}>
                                {hotel.distanceMiles.toFixed(1)} mi from center
                              </Text>
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
                            <Text style={styles.ratingValue}>{hotel.rating.toFixed(1)}</Text>
                          </View>

                          <Text style={styles.inlineSeparator}>|</Text>
                          <Text style={styles.reviewText}>({hotel.reviewCount} reviews)</Text>
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

                          <Pressable
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
                          </Pressable>
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
            ) : (
              <View style={styles.emptyStateCard}>
                <MaterialCommunityIcons name="bed-outline" size={32} color="#1F78FF" />
                <Text style={styles.emptyStateTitle}>No stays match that destination yet.</Text>
                <Text style={styles.emptyStateCopy}>
                  Try a broader search like Los Angeles, LA, or Downtown.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDestination("");
                    setAppliedDestination("");
                  }}
                  style={styles.clearSearchButton}
                >
                  <Text style={styles.clearSearchButtonText}>Show all hotels</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          {bottomNavItems.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => handleBottomNavPress(item.label)}
              style={styles.bottomNavItem}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={item.active ? "#1F78FF" : "#334155"}
              />
              <Text style={[styles.bottomNavLabel, item.active && styles.bottomNavLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
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
    paddingBottom: 146,
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

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -5 },
    elevation: 12,
  },

  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomNavLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },

  bottomNavLabelActive: {
    color: "#1F78FF",
  },
});
