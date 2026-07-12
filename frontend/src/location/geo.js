const EARTH_RADIUS_KM = 6371;
const KM_PER_MILE = 0.621371;

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
