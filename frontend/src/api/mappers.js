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
  if (key.includes("breakfast")) return "cafe-outline";
  if (key.includes("gym")) return "barbell-outline";
  if (key.includes("parking")) return "car-outline";
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
  const amenities = (hotel.amenities || []).slice(0, 3);
  const address = hotel.address || "Destination area";

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
    rank: index + 1,
    name: hotel.name,
    location: address,
    neighborhood: address.split(",")[0] || address,
    distanceMiles: distanceValue,
    lat: hotel.lat,
    lng: hotel.lng,
    rating: hotel.rating ?? 4.0,
    reviewCount: 0,
    price: Math.round(hotel.nightly_rate),
    amenities,
    image: HOTEL_IMAGES[index % HOTEL_IMAGES.length],
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
