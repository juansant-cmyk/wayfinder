import { apiRequest } from "./client";

const DEFAULT_DESTINATION = "Bali";
const DEFAULT_LAT = -8.3405;
const DEFAULT_LNG = 115.092;

function withDestination(destination) {
  const value = destination || DEFAULT_DESTINATION;
  return `destination=${encodeURIComponent(value)}`;
}

export function fetchPlans(token) {
  return apiRequest("/plans", { token });
}

export function searchHotels(token, destination = DEFAULT_DESTINATION) {
  return apiRequest(`/hotels/search?${withDestination(destination)}`, { token });
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

export function fetchPopularPlaces(token, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  return apiRequest(
    `/places/popular?lat=${lat}&lng=${lng}&radius_km=5&limit=5`,
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

export { DEFAULT_DESTINATION };
