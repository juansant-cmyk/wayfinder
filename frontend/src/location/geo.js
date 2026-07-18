import * as Location from "expo-location";

import { getApiUrl, notifySessionExpired } from "../api/client";
import { getToken } from "../auth/tokenStorage";

const EARTH_RADIUS_KM = 6371;
const KM_PER_MILE = 0.621371;

/** Returned when /geo/* responds 401 — callers must not fall back to Expo geocoding. */
const GEO_AUTH_REQUIRED = Symbol("GEO_AUTH_REQUIRED");

/** Legacy Bali pin — only for maps fallbacks that still need a default center. */
export const DEFAULT_LAT = -8.3405;
export const DEFAULT_LNG = 115.092;

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function haversineMiles(lat1, lng1, lat2, lng2) {
  return haversineKm(lat1, lng1, lat2, lng2) * KM_PER_MILE;
}

export function milesBetween(origin, point) {
  if (!origin || point?.lat == null || point?.lng == null) {
    return null;
  }

  return haversineMiles(origin.lat, origin.lng, point.lat, point.lng);
}

export function titleCasePlace(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatExpoPlace(place, fallback = null) {
  if (!place) {
    return fallback;
  }
  const city = place.city || place.subregion || place.district || place.name;
  const region = place.region;
  if (city && region && city !== region) {
    return `${city}, ${region}`;
  }
  return city || region || place.country || fallback;
}

async function backendGeo(path) {
  const base = getApiUrl();
  if (!base) {
    return null;
  }

  const token = await getToken();
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${base}${path}`, { headers });
    if (response.status === 401) {
      await notifySessionExpired();
      return GEO_AUTH_REQUIRED;
    }
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    // Network / API unreachable — callers may use Expo fallback.
    return null;
  }
}

/** GPS → closest city / area label. */
export async function reverseGeocodeLabel(lat, lng) {
  const fromApi = await backendGeo(
    `/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
  );
  if (fromApi === GEO_AUTH_REQUIRED) {
    return null;
  }
  if (fromApi?.label) {
    return fromApi.label;
  }

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    return formatExpoPlace(results?.[0], null);
  } catch {
    return null;
  }
}

/**
 * Keyword / address → coordinates + display label.
 * Returns null when the place cannot be resolved.
 */
export async function geocodeQuery(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    return null;
  }

  const prettyQuery = titleCasePlace(trimmed);
  const fromApi = await backendGeo(`/geo/search?q=${encodeURIComponent(trimmed)}`);
  if (fromApi === GEO_AUTH_REQUIRED) {
    return null;
  }
  if (fromApi?.lat != null && fromApi?.lng != null) {
    return {
      lat: Number(fromApi.lat),
      lng: Number(fromApi.lng),
      label: fromApi.label || fromApi.city || prettyQuery,
      city: fromApi.city || null,
      region: fromApi.region || null,
      country: fromApi.country || null,
      source: "search",
      query: trimmed,
    };
  }

  try {
    const results = await Location.geocodeAsync(trimmed);
    const hit = results?.[0];
    if (!hit || hit.latitude == null || hit.longitude == null) {
      return null;
    }

    const label = (await reverseGeocodeLabel(hit.latitude, hit.longitude)) || prettyQuery;

    return {
      lat: hit.latitude,
      lng: hit.longitude,
      label,
      source: "search",
      query: trimmed,
    };
  } catch {
    return null;
  }
}

/** Top destination suggestions for typeahead (city / country). */
export async function suggestGeocodeQuery(query, limit = 5) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 2) {
    return [];
  }

  const fromApi = await backendGeo(
    `/geo/suggest?q=${encodeURIComponent(trimmed)}&limit=${encodeURIComponent(limit)}`
  );
  if (fromApi === GEO_AUTH_REQUIRED) {
    return [];
  }
  if (!Array.isArray(fromApi)) {
    return [];
  }

  return fromApi
    .filter((item) => item?.lat != null && item?.lng != null && item?.label)
    .slice(0, limit)
    .map((item) => ({
      lat: Number(item.lat),
      lng: Number(item.lng),
      label: item.label,
      city: item.city || null,
      region: item.region || null,
      country: item.country || null,
      provider: item.provider || null,
      source: "suggest",
    }));
}
