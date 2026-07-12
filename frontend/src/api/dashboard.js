import { apiRequest } from "./client";
import { DEFAULT_LAT, DEFAULT_LNG, milesBetween } from "../location/geo";

const DEFAULT_DESTINATION = "Bali";

function withDestination(destination) {
  const value = destination || DEFAULT_DESTINATION;
  return `destination=${encodeURIComponent(value)}`;
}

function withCoordinates(params, coords = null) {
  if (coords?.source === "gps" && coords.lat != null && coords.lng != null) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
  }
}

function sortHotelsByDistance(hotels, origin = null) {
  return [...hotels].sort((a, b) => {
    const left =
      a.distance_miles ??
      milesBetween(origin, { lat: a.lat, lng: a.lng }) ??
      Number.POSITIVE_INFINITY;
    const right =
      b.distance_miles ??
      milesBetween(origin, { lat: b.lat, lng: b.lng }) ??
      Number.POSITIVE_INFINITY;
    return left - right;
  });
}

async function requestHotels(token, destination, sort, coords) {
  const params = new URLSearchParams({ destination, sort });
  withCoordinates(params, coords);
  return apiRequest(`/hotels/search?${params}`, { token });
}

export function fetchPlans(token) {
  return apiRequest("/plans", { token });
}

export async function searchHotels(token, destination = DEFAULT_DESTINATION, sort = "price", coords = null) {
  try {
    return await requestHotels(token, destination, sort, coords);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isDistanceUnsupported =
      sort === "distance" &&
      (message.includes("pattern") || message.includes("sort=distance"));

    if (!isDistanceUnsupported) {
      throw error;
    }

    const results = await requestHotels(token, destination, "price", coords);
    return sortHotelsByDistance(results, coords);
  }
}

export function fetchHotel(token, hotelId) {
  return apiRequest(`/hotels/${hotelId}`, { token });
}

export function searchFlights(token, destination = DEFAULT_DESTINATION) {
  return apiRequest(`/flights/search?${withDestination(destination)}`, { token });
}

export function fetchFavorites(token) {
  return apiRequest("/favorites", { token });
}

export function fetchSafetySummary(token, destination = DEFAULT_DESTINATION) {
  return apiRequest(`/safety/summary?${withDestination(destination)}`, { token });
}

export function fetchWeather(token, destination = DEFAULT_DESTINATION) {
  return apiRequest(`/weather/current?${withDestination(destination)}`, { token });
}

export function sendChatMessage(token, message) {
  return apiRequest("/chat/messages", {
    method: "POST",
    token,
    body: { message },
  });
}

export function fetchPopularPlaces(token, lat = DEFAULT_LAT, lng = DEFAULT_LNG, radiusKm = 5, limit = 5) {
  return apiRequest(
    `/places/popular?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&limit=${limit}`,
    { token }
  );
}

export function fetchTravelCheck(token, destination = DEFAULT_DESTINATION) {
  return apiRequest(`/travel-check?${withDestination(destination)}`, { token });
}

export function fetchRecommendedDestinations(token) {
  return apiRequest("/destinations/recommended", { token });
}

export function fetchDestination(token, slug) {
  return apiRequest(`/destinations/${encodeURIComponent(slug)}`, { token });
}

export function fetchNotifications(token) {
  return apiRequest("/notifications", { token });
}

export function fetchProfile(token) {
  return apiRequest("/auth/me", { token });
}

export { DEFAULT_DESTINATION, DEFAULT_LAT, DEFAULT_LNG };
