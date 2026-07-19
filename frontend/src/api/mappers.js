import { milesBetween } from "../location/geo";

const HOTEL_IMAGES = [
  require("../../assets/images/hotels/hotel-card-sunset-inn.png"),
  require("../../assets/images/hotels/hotel-card-city-view.png"),
];

const NOTE_STYLES = [
  { noteBackground: "#EFF5FF", noteIconColor: "#2563EB" },
  { noteBackground: "#EDF8F3", noteIconColor: "#0F9F5B" },
];

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

function readableCategory(value) {
  return String(value || "Place")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function distanceLabel(distanceKm) {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) {
    return "Nearby";
  }
  const distance = Number(distanceKm);
  return distance < 1 ? `${Math.max(1, Math.round(distance * 1000))} m` : `${distance.toFixed(1)} km`;
}

export function placeFavoriteKey(provider, providerPlaceId) {
  return `${provider}::${providerPlaceId}`;
}

export function mapPlaceForMaps(place, fallbackImage = null) {
  const metadata = place?.metadata_json || {};
  return {
    id: String(place.id),
    provider: place.provider,
    providerPlaceId: place.provider_place_id,
    title: place.name || "Nearby place",
    meta: metadata.primary_type_label || readableCategory(place.category),
    category: place.category || "place",
    address: place.address || "Address unavailable",
    distance: distanceLabel(place.distance_km),
    distanceKm: place.distance_km ?? null,
    rating: place.rating ?? null,
    ratingCount: Number(metadata.rating_count) || 0,
    openNow: metadata.open_now ?? null,
    lat: Number(place.lat),
    lng: Number(place.lng),
    image: metadata.image_url ? { uri: metadata.image_url } : fallbackImage,
    raw: place,
  };
}

export function placeFavoritePayload(place) {
  return {
    item_type: "place",
    provider: place.provider,
    provider_item_id: place.providerPlaceId,
    entity_id: place.id,
    snapshot: {
      name: place.title,
      subtitle: place.meta,
      address: place.address,
      rating: place.rating,
      lat: place.lat,
      lng: place.lng,
    },
  };
}

export function mapFavoriteForMaps(item, fallbackImage = null) {
  return {
    id: String(item.entity_id || item.id),
    favoriteId: String(item.id),
    provider: item.provider,
    providerPlaceId: item.provider_item_id,
    title: item.title || "Saved place",
    meta: item.subtitle || "Saved place",
    address: item.address || "Address unavailable",
    distance: "Saved",
    rating: item.rating ?? null,
    lat: item.lat != null ? Number(item.lat) : null,
    lng: item.lng != null ? Number(item.lng) : null,
    image: item.image_url ? { uri: item.image_url } : fallbackImage,
  };
}

export function mapSafetyAlertsForScreen(payload) {
  return (Array.isArray(payload) ? payload : []).map((alert) => {
    const severity = String(alert.severity || "low").toLowerCase();
    const isElevated = severity === "high" || severity === "extreme";
    return {
      id: String(alert.id),
      tone: isElevated ? "danger" : "advisory",
      severity,
      label: alert.alert_type === "weather" ? "Weather Alert" : "Safety Advisory",
      title: alert.headline || alert.title || alert.event || "Safety alert",
      location: alert.areas || alert.destination || "Selected destination",
      timestamp: formatAlertTimestamp(alert.effective || alert.starts_at || alert.created_at),
      description: alert.desc || alert.description || "Monitor official local guidance.",
      details: alert.instruction || alert.description || alert.desc || "",
      expiresAt: alert.expires || alert.ends_at || null,
      raw: alert,
    };
  });
}

export function deriveSafetyOverview(alerts, destination) {
  const severities = alerts.map((alert) => alert.severity);
  const level = severities.some((severity) => severity === "extreme" || severity === "high")
    ? "high"
    : severities.includes("moderate")
      ? "moderate"
      : "low";
  const labels = { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk" };
  const indicator = { low: "11%", moderate: "43%", high: "84%" };
  const city = String(destination || "This destination").split(",")[0];
  const descriptions = {
    low: `${city} currently has no elevated active alerts.\nExercise normal precautions and follow local guidance.`,
    moderate: `${city} currently has active advisories.\nMonitor changing conditions and follow official guidance.`,
    high: `${city} currently has a high-severity active alert.\nAvoid affected areas and follow official instructions closely.`,
  };
  return {
    level,
    label: labels[level],
    indicatorLeft: indicator[level],
    description: descriptions[level],
  };
}

function formatTemp(value, unit = "°") {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Math.round(Number(value))}${unit}`;
}

function uvIndexLabel(uv) {
  if (uv == null) {
    return "—";
  }
  const score = Number(uv);
  if (score >= 11) {
    return `${score} Extreme`;
  }
  if (score >= 8) {
    return `${score} Very High`;
  }
  if (score >= 6) {
    return `${score} High`;
  }
  if (score >= 3) {
    return `${score} Moderate`;
  }
  return `${score} Low`;
}

function airQualityLabel(airQuality) {
  if (!airQuality) {
    return "—";
  }
  const index = airQuality.us_epa_index;
  const labels = {
    1: "Good",
    2: "Moderate",
    3: "Unhealthy (Sensitive)",
    4: "Unhealthy",
    5: "Very Unhealthy",
    6: "Hazardous",
  };
  const label = index != null && labels[index] ? labels[index] : null;
  const score =
    airQuality.pm2_5 != null
      ? Math.round(airQuality.pm2_5)
      : index != null
        ? index
        : null;
  if (label && score != null) {
    return `${label} (${score})`;
  }
  if (label) {
    return label;
  }
  if (score != null) {
    return `AQI (${score})`;
  }
  return "Available";
}

function alertColors(severity) {
  const key = String(severity || "").toLowerCase();
  if (key.includes("extreme") || key.includes("severe")) {
    return {
      border: "#E0CCFF",
      background: "#FBF7FF",
      iconBackground: "#F1E8FF",
      iconColor: "#8B5CF6",
      badgeBackground: "#EEE1FF",
      badgeColor: "#7C3AED",
      buttonBorder: "#D6BDFF",
      buttonText: "#7C3AED",
    };
  }
  if (key.includes("moderate") || key.includes("advisory")) {
    return {
      border: "#C9DCFF",
      background: "#F6FAFF",
      iconBackground: "#E7F0FF",
      iconColor: "#2F86FF",
      badgeBackground: "#E3EEFF",
      badgeColor: "#2C6AE6",
      buttonBorder: "#B4CEFF",
      buttonText: "#2C6AE6",
    };
  }
  return {
    border: "#F9C7B1",
    background: "#FFF8F3",
    iconBackground: "#FFF1E7",
    iconColor: "#F97316",
    badgeBackground: "#FFE4D3",
    badgeColor: "#E8632F",
    buttonBorder: "#F7B794",
    buttonText: "#E8632F",
  };
}

function forecastDayLabel(dateValue) {
  if (!dateValue) {
    return "Day";
  }
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHourAmPm(timeValue, index) {
  if (index === 0) {
    return "Now";
  }
  const raw = String(timeValue || "");
  const clock = raw.includes(" ") ? raw.split(" ").pop() : raw;
  const match = /^(\d{1,2}):(\d{2})/.exec(clock || "");
  if (!match) {
    return clock || `+${index}`;
  }
  let hour = Number(match[1]);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour} ${period}`;
}

function formatLocalTimestamp(localtime) {
  if (!localtime) {
    return "Updated just now";
  }
  const normalized = String(localtime).includes("T")
    ? String(localtime)
    : String(localtime).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return String(localtime);
  }
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

function formatAlertTimestamp(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

/** Map GET /weather/current into WeatherScreen view-model props. */
export function mapWeatherForScreen(payload) {
  const windParts = [];
  if (payload?.wind_kph != null) {
    windParts.push(`${Math.round(payload.wind_kph)} km/h`);
  } else if (payload?.wind_mph != null) {
    windParts.push(`${Math.round(payload.wind_mph)} mph`);
  }
  if (payload?.wind_dir) {
    windParts.push(payload.wind_dir);
  }

  const chanceOfRain = payload?.forecast_days?.[0]?.chance_of_rain;
  const current = {
    temperature: payload?.temp_c != null ? String(Math.round(payload.temp_c)) : "—",
    unit: "°C",
    condition: payload?.condition || "Unknown",
    feelsLike:
      payload?.feelslike_c != null
        ? `Feels like ${Math.round(payload.feelslike_c)}°`
        : "Feels like —",
    timestamp: formatLocalTimestamp(payload?.localtime),
    iconUrl: payload?.icon_url || null,
    details: [
      {
        id: "humidity",
        label: "Humidity",
        value: payload?.humidity != null ? `${payload.humidity}%` : "—",
        iconFamily: "ion",
        iconName: "water-outline",
      },
      {
        id: "wind",
        label: "Wind",
        value: windParts.join(" ") || "—",
        iconFamily: "material",
        iconName: "weather-windy",
      },
      {
        id: "uv",
        label: "UV Index",
        value: uvIndexLabel(payload?.uv),
        iconFamily: "material",
        iconName: "white-balance-sunny",
      },
      {
        id: "visibility",
        label: "Visibility",
        value:
          payload?.visibility_miles != null
            ? `${Math.round(payload.visibility_miles * 1.60934)} km`
            : "—",
        iconFamily: "ion",
        iconName: "eye-outline",
      },
      {
        id: "pressure",
        label: "Pressure",
        value: payload?.pressure_mb != null ? `${Math.round(payload.pressure_mb)} hPa` : "—",
        iconFamily: "material",
        iconName: "gauge",
      },
    ],
  };

  const hourlyFromApi = (payload?.forecast_hours || []).map((hour, index) => ({
    id: `hour-${index}-${hour.time || index}`,
    label: formatHourAmPm(hour.time, index),
    condition: hour.condition || "—",
    temperature: formatTemp(hour.temp_c),
    wind: hour.wind_kph != null ? `${Math.round(hour.wind_kph)} km/h` : "—",
    iconUrl: hour.icon_url || null,
  }));

  const hourly =
    hourlyFromApi.length > 0
      ? hourlyFromApi
      : [
          {
            id: "now",
            label: "Now",
            condition: current.condition,
            temperature: formatTemp(payload?.temp_c),
            wind: windParts[0] || "—",
            iconUrl: payload?.icon_url || null,
          },
        ];

  const daily = (payload?.forecast_days || []).map((day, index) => ({
    id: day.date || `day-${index}`,
    day: forecastDayLabel(day.date),
    condition: day.condition || "—",
    low: formatTemp(day.min_temp_c),
    high: formatTemp(day.max_temp_c),
    precipitation:
      day.chance_of_rain != null
        ? `${day.chance_of_rain}%`
        : day.chance_of_snow != null
          ? `${day.chance_of_snow}%`
          : "—",
    detail:
      [
        day.condition,
        day.chance_of_rain != null ? `${day.chance_of_rain}% chance of rain` : null,
        day.uv != null ? `UV ${day.uv}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "No extra details for this day.",
    iconUrl: day.icon_url || null,
  }));

  const alerts = (payload?.warnings || []).map((warning, index) => {
    const severity = warning.severity || warning.urgency || "Alert";
    return {
      id: `${warning.source || "alert"}-${index}-${warning.title || "warning"}`,
      title: warning.title || warning.event || warning.headline || "Weather alert",
      badge: String(severity).replace(/^\w/, (c) => c.toUpperCase()),
      description:
        warning.description || warning.desc || warning.headline || "Check local conditions.",
      detail: warning.instruction || warning.areas || warning.description || warning.desc || "",
      timestamp: formatAlertTimestamp(
        warning.effective || warning.starts_at || warning.expires || ""
      ),
      iconFamily: "ion",
      iconName: severity.toLowerCase().includes("rain")
        ? "rainy"
        : severity.toLowerCase().includes("thunder") || severity.toLowerCase().includes("storm")
          ? "flash"
          : "warning",
      colors: alertColors(severity),
    };
  });

  const summary = [
    {
      id: "sunrise",
      label: "Sunrise",
      value: payload?.sunrise || "—",
      iconFamily: "material",
      iconName: "weather-sunset-up",
    },
    {
      id: "sunset",
      label: "Sunset",
      value: payload?.sunset || "—",
      iconFamily: "material",
      iconName: "weather-sunset-down",
    },
    {
      id: "precipitation",
      label: "Precipitation",
      value:
        chanceOfRain != null
          ? `${chanceOfRain}%`
          : payload?.precip_mm != null
            ? `${payload.precip_mm} mm`
            : "—",
      iconFamily: "ion",
      iconName: "water",
    },
    {
      id: "air-quality",
      label: "Air Quality",
      value: airQualityLabel(payload?.air_quality),
      iconFamily: "ion",
      iconName: "leaf",
    },
  ];

  return {
    destination: payload?.destination || "Selected location",
    forecastSummary: payload?.forecast_summary || "",
    current,
    hourly,
    daily,
    alerts,
    summary,
  };
}
