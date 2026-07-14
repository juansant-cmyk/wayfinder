import { apiRequest } from "./client";
import { DEFAULT_LAT, DEFAULT_LNG, milesBetween } from "../location/geo";

const DEFAULT_DESTINATION = "Bali";

/** Common region → currency fallbacks when Intl can't resolve a currency. */
const REGION_CURRENCY = {
  US: "USD",
  JP: "JPY",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  EU: "EUR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  ID: "IDR",
  SG: "SGD",
  KR: "KRW",
  IN: "INR",
  MX: "MXN",
  BR: "BRL",
};

/**
 * Infer guest nationality + display currency from the device locale.
 * Example: ja-JP → { guestNationality: "JP", currency: "JPY" }
 */
export function inferGuestMarket(localeOverride = null) {
  const locale =
    localeOverride ||
    (typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : null) ||
    (typeof navigator !== "undefined" ? navigator.language : null) ||
    "en-US";

  const normalized = String(locale).replace("_", "-");
  const parts = normalized.split("-");
  const regionCandidate = [...parts].reverse().find((part) => /^[A-Za-z]{2}$/.test(part));
  const guestNationality = (regionCandidate || "US").toUpperCase();
  const currency = REGION_CURRENCY[guestNationality] || "USD";

  return { guestNationality, currency, locale: normalized };
}

function withDestination(destination) {
  const value = destination || DEFAULT_DESTINATION;
  return `destination=${encodeURIComponent(value)}`;
}

function withCoordinates(params, coords = null) {
  if (coords?.lat != null && coords?.lng != null) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
  }
}

function withMarket(params, market = null) {
  const resolved = market || inferGuestMarket();
  if (resolved.guestNationality) {
    params.set("guest_nationality", String(resolved.guestNationality).toUpperCase());
  }
  if (resolved.currency) {
    params.set("currency", String(resolved.currency).toUpperCase());
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

async function requestHotels(token, destination, sort, coords, market = null) {
  const params = new URLSearchParams({ destination, sort });
  withCoordinates(params, coords);
  withMarket(params, market);
  return apiRequest(`/hotels/search?${params}`, { token });
}

export function fetchPlans(token) {
  return apiRequest("/plans", { token });
}

export function fetchPlan(token, planId) {
  return apiRequest(`/plans/${planId}`, { token });
}

export function createPlan(token, body) {
  return apiRequest("/plans", { method: "POST", token, body });
}

export function updatePlan(token, planId, body) {
  return apiRequest(`/plans/${planId}`, { method: "PATCH", token, body });
}

export function deletePlan(token, planId) {
  return apiRequest(`/plans/${planId}`, { method: "DELETE", token });
}

export function createPlanActivity(token, planId, dayId, body) {
  return apiRequest(`/plans/${planId}/days/${dayId}/activities`, {
    method: "POST",
    token,
    body,
  });
}

export function deletePlanActivity(token, planId, activityId) {
  return apiRequest(`/plans/${planId}/activities/${activityId}`, {
    method: "DELETE",
    token,
  });
}

export async function searchHotels(
  token,
  destination = DEFAULT_DESTINATION,
  sort = "price",
  coords = null,
  market = null
) {
  const resolvedMarket = market || inferGuestMarket();
  try {
    return await requestHotels(token, destination, sort, coords, resolvedMarket);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isDistanceUnsupported =
      sort === "distance" &&
      (message.includes("pattern") || message.includes("sort=distance"));

    if (!isDistanceUnsupported) {
      throw error;
    }

    const results = await requestHotels(token, destination, "price", coords, resolvedMarket);
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

export function addFavorite(token, body) {
  return apiRequest("/favorites", { method: "POST", token, body });
}

export function removeFavorite(token, { itemType, provider, providerItemId }) {
  const params = new URLSearchParams({
    item_type: itemType,
    provider,
    provider_item_id: providerItemId,
  });
  return apiRequest(`/favorites?${params}`, { method: "DELETE", token });
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
