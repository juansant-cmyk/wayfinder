import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { APP_SCREENS, loadScreenData } from "../src/navigation/screens";
import { getToken } from "../src/auth/tokenStorage";
import { useUserLocation } from "../src/location/UserLocationContext";
import ScreenLayout from "./shared/ScreenLayout";
import { getBottomNavActiveLabel } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";
import { cardStyles } from "./shared/screenStyles";

function EmptyState({ message }) {
  return <Text style={cardStyles.emptyText}>{message}</Text>;
}

function renderItinerary(plans, onNavigate) {
  if (!plans.length) {
    return <EmptyState message="No travel plans yet. Create one from your next trip." />;
  }

  return plans.map((plan) => (
    <DimPressable
      key={plan.id}
      accessibilityRole="button"
      accessibilityLabel={`Open itinerary for ${plan.title}`}
      onPress={() => onNavigate?.("itinerary", { planId: plan.id })}
      style={cardStyles.card}
    >
      <Text style={cardStyles.cardTitle}>{plan.title}</Text>
      <Text style={cardStyles.cardSubtitle}>{plan.destination_name}</Text>
    </DimPressable>
  ));
}

function renderHotels(hotels) {
  return hotels.map((hotel) => (
    <View key={hotel.id} style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>{hotel.name}</Text>
      <Text style={cardStyles.cardSubtitle}>
        ${hotel.nightly_rate}/night · {hotel.amenities.slice(0, 3).join(" · ")}
      </Text>
      {hotel.rating ? <Text style={cardStyles.metaText}>Rating {hotel.rating}</Text> : null}
    </View>
  ));
}

function renderFlights(flights) {
  return flights.map((flight) => (
    <View key={flight.id} style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>{flight.airline}</Text>
      <Text style={cardStyles.cardSubtitle}>
        {flight.origin} → {flight.destination}
      </Text>
      <Text style={cardStyles.metaText}>
        ${flight.price} · {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
      </Text>
    </View>
  ));
}

function renderFavorites(favorites) {
  if (!favorites.length) {
    return <EmptyState message="No saved favorites yet. Heart a hotel to save it here." />;
  }

  return favorites.map((item) => (
    <View key={item.id} style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>{item.title}</Text>
      {item.subtitle ? <Text style={cardStyles.cardSubtitle}>{item.subtitle}</Text> : null}
      {item.price != null ? (
        <Text style={cardStyles.metaText}>
          {item.currency || "USD"} {Math.round(item.price)}
          {item.rating != null ? ` · ★ ${Number(item.rating).toFixed(1)}` : ""}
        </Text>
      ) : item.rating != null ? (
        <Text style={cardStyles.metaText}>★ {Number(item.rating).toFixed(1)}</Text>
      ) : null}
    </View>
  ));
}

function renderSafety(safety) {
  return (
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>{safety.destination}</Text>
        <Text style={cardStyles.metaText}>Overall: {safety.overall_level}</Text>
      </View>
      {safety.alerts.map((alert, index) => (
        <View key={`${alert.title}-${index}`} style={cardStyles.card}>
          <Text style={cardStyles.cardTitle}>{alert.title}</Text>
          <Text style={cardStyles.cardSubtitle}>{alert.summary}</Text>
          <Text style={cardStyles.metaText}>{alert.severity}</Text>
        </View>
      ))}
    </>
  );
}

function renderWeather(weather) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>{weather.destination}</Text>
      <Text style={cardStyles.cardSubtitle}>{weather.condition}</Text>
      <Text style={cardStyles.metaText}>
        {weather.temp_f.toFixed(1)}°F · {weather.temp_c.toFixed(1)}°C · {weather.humidity}% humidity
      </Text>
      <Text style={[cardStyles.cardSubtitle, { marginTop: 10 }]}>{weather.forecast_summary}</Text>
    </View>
  );
}

function renderMaps(places) {
  return places.map((place) => (
    <View key={place.id} style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>{place.name}</Text>
      <Text style={cardStyles.cardSubtitle}>{place.category}</Text>
      <Text style={cardStyles.metaText}>
        {place.distance_km != null ? `${place.distance_km.toFixed(1)} km away` : "Nearby"}
        {place.rating ? ` · ★ ${place.rating}` : ""}
      </Text>
    </View>
  ));
}

function renderTravelCheck(check) {
  return (
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>{check.destination}</Text>
        <Text style={cardStyles.cardSubtitle}>{check.summary}</Text>
      </View>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Safety</Text>
        <Text style={cardStyles.cardSubtitle}>{check.safety.overall_level}</Text>
      </View>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Weather</Text>
        <Text style={cardStyles.cardSubtitle}>
          {check.weather.condition} · {check.weather.temp_f.toFixed(0)}°F
        </Text>
      </View>
    </>
  );
}

function renderNotifications(notifications) {
  if (!notifications.length) {
    return <EmptyState message="No notifications yet." />;
  }

  return notifications.map((item) => (
    <View key={item.id} style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>
        {item.title}
        {!item.read ? " · New" : ""}
      </Text>
      <Text style={cardStyles.cardSubtitle}>{item.body}</Text>
    </View>
  ));
}

function renderProfile(profile, onLogout) {
  return (
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>{profile.full_name}</Text>
        <Text style={cardStyles.cardSubtitle}>@{profile.username}</Text>
        <Text style={[cardStyles.cardSubtitle, { marginTop: 8 }]}>{profile.email}</Text>
        <Text style={cardStyles.metaText}>
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </Text>
      </View>
      {onLogout ? (
        <DimPressable style={[cardStyles.card, { alignItems: "center" }]} onPress={onLogout}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#B42318" }}>Log out</Text>
        </DimPressable>
      ) : null}
    </>
  );
}

function renderDestination(detail, onNavigate) {
  return (
    <>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>{detail.name}</Text>
        <Text style={cardStyles.cardSubtitle}>{detail.subtitle}</Text>
        <Text style={cardStyles.metaText}>Rating {detail.rating}</Text>
      </View>
      <DimPressable
        style={cardStyles.card}
        onPress={() => onNavigate("hotels", { destination: detail.name })}
      >
        <Text style={cardStyles.cardTitle}>Search hotels in {detail.name}</Text>
      </DimPressable>
      <DimPressable
        style={cardStyles.card}
        onPress={() => onNavigate("flights", { destination: detail.name })}
      >
        <Text style={cardStyles.cardTitle}>Search flights to {detail.name}</Text>
      </DimPressable>
      <DimPressable
        style={cardStyles.card}
        onPress={() => onNavigate("safety", { destination: detail.name })}
      >
        <Text style={cardStyles.cardTitle}>Safety summary</Text>
      </DimPressable>
    </>
  );
}

function renderRecommended(destinations, onNavigate) {
  return destinations.map((destination) => (
    <DimPressable
      key={destination.slug || destination.name}
      style={cardStyles.card}
      onPress={() =>
        onNavigate("destination", { slug: destination.slug || destination.name.toLowerCase() })
      }
    >
      <Text style={cardStyles.cardTitle}>{destination.name}</Text>
      <Text style={cardStyles.cardSubtitle}>{destination.subtitle}</Text>
      <Text style={cardStyles.metaText}>Rating {destination.rating}</Text>
    </DimPressable>
  ));
}

function renderContent(screen, data, onNavigate, onLogout) {
  switch (screen) {
    case "itinerary":
      return renderItinerary(data, onNavigate);
    case "trips":
      return renderItinerary(data, onNavigate);
    case "hotels":
      return renderHotels(data);
    case "flights":
      return renderFlights(data);
    case "favorites":
      return renderFavorites(data);
    case "safety":
      return renderSafety(data);
    case "weather":
      return renderWeather(data);
    case "maps":
      return renderMaps(data);
    case "travelCheck":
      return renderTravelCheck(data);
    case "notifications":
      return renderNotifications(data);
    case "profile":
      return renderProfile(data, onLogout);
    case "destination":
      return renderDestination(data, onNavigate);
    case "recommended":
      return renderRecommended(data, onNavigate);
    default:
      return <EmptyState message="Nothing to show yet." />;
  }
}

export default function DashboardFeatureScreen({
  screen,
  params = {},
  onBack,
  onNavigate,
  onLogout,
}) {
  const { location } = useUserLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const title =
    screen === "destination" && data?.name
      ? data.name
      : APP_SCREENS[screen]?.title || "Wayfinder";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        setError("Sign in to load live data from the backend.");
        setData(null);
        return;
      }

      const result = await loadScreenData(screen, token, params, location);
      setData(result);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Request failed.";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [screen, params.destination, params.slug, location]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenLayout
      title={title}
      onBack={onBack}
      loading={loading}
      error={error}
      onNavigate={onNavigate}
      activeLabel={getBottomNavActiveLabel(screen)}
    >
      {!loading && !error ? renderContent(screen, data, onNavigate, onLogout) : null}
    </ScreenLayout>
  );
}
