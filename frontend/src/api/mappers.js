import { milesBetween } from "../location/geo";

const HOTEL_IMAGES = [
  require("../../assets/images/hotels/hotel-card-sunset-inn.png"),
  require("../../assets/images/hotels/hotel-card-city-view.png"),
];

const NOTE_STYLES = [
  { noteBackground: "#EFF5FF", noteIconColor: "#2563EB" },
  { noteBackground: "#EDF8F3", noteIconColor: "#0F9F5B" },
];

function amenityIconName(label) {
  const key = label.trim().toLowerCase();
  if (key.includes("wifi") || key.includes("wi-fi")) return "wifi";
  if (key.includes("pool")) return "water-outline";
  if (key.includes("breakfast") || key.includes("board")) return "cafe-outline";
  if (key.includes("gym") || key.includes("fitness")) return "barbell-outline";
  if (key.includes("parking") || key.includes("garage")) return "car-outline";
  if (key.includes("free cancellation") || key === "refundable") {
    return "shield-checkmark-outline";
  }
  if (key.includes("non-refundable") || key.includes("non refundable")) {
    return "close-circle-outline";
  }
  return "checkmark-circle-outline";
}

export function mapSafetyLevel(level) {
  const labels = {
    low: "Safe",
    moderate: "Moderate",
    high: "Elevated",
  };
  return labels[level] || level;
}

export function mapHotelForAlly(hotel, index = 0, origin = null) {
  const style = NOTE_STYLES[index % NOTE_STYLES.length];
  const amenities = (hotel.amenities || []).slice(0, 6);
  const address = hotel.address || "Destination area";
  const remoteImage = hotel.metadata_json?.image_url;

  // Prefer live GPS → hotel coords. Ignore API 0.0 when hotels were stored on the user pin.
  const computedMiles = milesBetween(origin, { lat: hotel.lat, lng: hotel.lng });
  const apiMiles = hotel.distance_miles;
  const distanceMiles =
    computedMiles != null
      ? computedMiles
      : apiMiles != null && Number(apiMiles) > 0
        ? Number(apiMiles)
        : null;
  const distanceValue =
    distanceMiles == null || Number.isNaN(Number(distanceMiles))
      ? null
      : Number(Number(distanceMiles).toFixed(1));

  return {
    id: String(hotel.id),
    provider: hotel.provider,
    providerHotelId: hotel.provider_hotel_id,
    rank: index + 1,
    name: hotel.name,
    location: address,
    neighborhood: address.split(",")[0] || address,
    distanceMiles: distanceValue,
    lat: hotel.lat,
    lng: hotel.lng,
    rating: hotel.rating ?? 4.0,
    reviewCount: Number(hotel.metadata_json?.review_count) || 0,
    price: Math.round(hotel.nightly_rate),
    currency: hotel.currency || "USD",
    amenities,
    image: remoteImage ? { uri: remoteImage } : HOTEL_IMAGES[index % HOTEL_IMAGES.length],
    imageUrl: remoteImage || null,
    searchTerms: [hotel.name, address, hotel.provider_hotel_id].filter(Boolean),
    recommendation: `Total estimate ${hotel.currency} ${Math.round(hotel.total_estimate)} for your stay.`,
    details:
      amenities.length > 0
        ? `Amenities include ${amenities.join(", ")}.`
        : "Compare rates and amenities before you book.",
    detailChips: amenities.slice(0, 3),
    noteBackground: style.noteBackground,
    noteIconColor: style.noteIconColor,
    raw: hotel,
  };
}

/** Stable heart key matching API identity B (provider + provider_item_id). */
export function hotelFavoriteKey(provider, providerHotelId) {
  return `${provider}::${providerHotelId}`;
}

export const PLAN_FAVORITE_PROVIDER = "wayfinder";
export const PLAN_FAVORITE_ITEM_TYPE = "plan";

export function planFavoriteKey(planId) {
  if (!planId) {
    return null;
  }
  return hotelFavoriteKey(PLAN_FAVORITE_PROVIDER, String(planId));
}

export function favoriteKeyFromItem(item) {
  if (!item?.provider || !item?.provider_item_id) {
    return null;
  }
  return hotelFavoriteKey(item.provider, item.provider_item_id);
}

/** Build POST /favorites body for a saved travel plan. */
export function planFavoritePayload(planId, trip) {
  const dates = trip?.dates || "";
  const nights = trip?.nights || "";
  const subtitle = [dates, nights].filter(Boolean).join(" • ") || null;
  return {
    item_type: PLAN_FAVORITE_ITEM_TYPE,
    provider: PLAN_FAVORITE_PROVIDER,
    provider_item_id: String(planId),
    entity_id: planId,
    snapshot: {
      name: trip?.title || "Trip",
      subtitle,
      address: trip?.destination || null,
      image_url: trip?.coverImageUrl || null,
    },
  };
}

/** Map a plan favorite API item into FavoritesScreen card props. */
export function mapPlanFavoriteToCard(item, fallbackImage) {
  const subtitle = item?.subtitle || "";
  const [datesPart, nightsPart] = subtitle.split(" • ").map((part) => part.trim());
  const dates = datesPart || subtitle;
  const monthMatch = dates.match(/^([A-Za-z]{3})\s+(\d{1,2})/);
  const yearMatch = dates.match(/(\d{4})/);
  return {
    id: item.provider_item_id,
    planId: String(item.entity_id || item.provider_item_id),
    title: item.title || "Trip",
    accentIconName: "sparkles",
    accentIconFamily: "ion",
    accentIconColor: "#F59E0B",
    month: monthMatch?.[1]?.toUpperCase() || "—",
    day: monthMatch?.[2] || "—",
    year: yearMatch?.[1] || "",
    dates: dates || "Dates TBD",
    nights: nightsPart || "",
    tags: ["Itinerary"],
    image: item.image_url ? { uri: item.image_url } : fallbackImage,
    destination: item.address || "",
  };
}

export function sortKeyToApi(sortKey) {
  if (sortKey === "highestRated") {
    return "rating";
  }
  if (sortKey === "lowestPrice") {
    return "price";
  }
  if (sortKey === "closest") {
    return "distance";
  }
  return "price";
}

export function mapPlaceForDashboard(place) {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    address: place.address,
    rating: place.rating,
    distanceKm: place.distance_km ?? null,
  };
}
