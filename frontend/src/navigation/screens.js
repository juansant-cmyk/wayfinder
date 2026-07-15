import * as dashboardApi from "../api/dashboard";

export const APP_SCREENS = {
  home: { hash: "#home" },
  login: { hash: "#login" },
  signup: { hash: "#signup" },
  forgotPassword: { hash: "#forgot-password" },
  itinerary: { hash: "#itinerary", title: "Itinerary" },
  hotels: { hash: "#hotels", title: "Hotels" },
  flights: { hash: "#flights", title: "Flights" },
  favorites: { hash: "#favorites", title: "Favorites" },
  safety: { hash: "#safety", title: "Safety" },
  weather: { hash: "#weather", title: "Weather" },
  chat: { hash: "#chat", title: "AI Chat" },
  maps: { hash: "#maps", title: "Maps" },
  travelCheck: { hash: "#travel-check", title: "Travel Check" },
  profile: { hash: "#profile", title: "Profile" },
  notifications: { hash: "#notifications", title: "Notifications" },
  destination: { hash: "#destination", title: "Destination" },
  recommended: { hash: "#recommended", title: "Recommended" },
};

export function getHashForScreen(screen) {
  return APP_SCREENS[screen]?.hash || APP_SCREENS.login.hash;
}

export function getScreenFromHash(hash) {
  const match = Object.entries(APP_SCREENS).find(([, config]) => config.hash === hash);
  return match?.[0] || "login";
}

export async function loadScreenData(screen, token, params = {}, location = null) {
  const destination = params.destination || dashboardApi.DEFAULT_DESTINATION;

  switch (screen) {
    case "itinerary":
      return dashboardApi.fetchPlans(token);
    case "hotels":
      return dashboardApi.searchHotels(token, destination, "price", location);
    case "flights":
      return dashboardApi.searchFlights(token, destination);
    case "favorites":
      return dashboardApi.fetchFavorites(token);
    case "safety":
      return dashboardApi.fetchSafetySummary(token, destination);
    case "weather":
      return dashboardApi.fetchWeather(token, destination);
    case "maps":
      return dashboardApi.fetchPopularPlaces(
        token,
        location?.source === "gps" ? location.lat : dashboardApi.DEFAULT_LAT,
        location?.source === "gps" ? location.lng : dashboardApi.DEFAULT_LNG
      );
    case "travelCheck":
      return dashboardApi.fetchTravelCheck(token, destination);
    case "notifications":
      return dashboardApi.fetchNotifications(token);
    case "profile":
      return dashboardApi.fetchProfile(token);
    case "destination":
      return dashboardApi.fetchDestination(token, params.slug);
    case "recommended":
      return dashboardApi.fetchRecommendedDestinations(token);
    default:
      return null;
  }
}
