import { milesBetween } from "../location/geo";

const categoryByKey = {
  cafe: {
    key: "cafe",
    markerColor: "#1F66FF",
    iconLibrary: "ionicons",
    iconName: "cafe-outline",
    iconBackground: "#1F66FF",
    tagBackgroundColor: "#EAF2FF",
    tagTextColor: "#2357E7",
  },
  photo: {
    key: "photo",
    markerColor: "#FF6A1C",
    iconLibrary: "ionicons",
    iconName: "camera-outline",
    iconBackground: "#FF6A1C",
    tagBackgroundColor: "#FFF0E3",
    tagTextColor: "#E76E1E",
  },
  food: {
    key: "food",
    markerColor: "#29B15D",
    iconLibrary: "ionicons",
    iconName: "restaurant-outline",
    iconBackground: "#29B15D",
    tagBackgroundColor: "#EAF9F1",
    tagTextColor: "#12804C",
  },
  culture: {
    key: "culture",
    markerColor: "#7D58F2",
    iconLibrary: "material",
    iconName: "bank-outline",
    iconBackground: "#7D58F2",
    tagBackgroundColor: "#F0EBFF",
    tagTextColor: "#6946DB",
  },
  sunset: {
    key: "sunset",
    markerColor: "#F05390",
    iconLibrary: "ionicons",
    iconName: "sunny-outline",
    iconBackground: "#F05390",
    tagBackgroundColor: "#FFE7F0",
    tagTextColor: "#E1457D",
  },
  travel: {
    key: "travel",
    markerColor: "#F59E0B",
    iconLibrary: "ionicons",
    iconName: "airplane-outline",
    iconBackground: "#F59E0B",
    tagBackgroundColor: "#FFF4DA",
    tagTextColor: "#C88100",
  },
};

const DEFAULT_WEATHER = {
  icon: "partly-sunny",
  label: "Forecast soon",
  temperature: "—",
};

function buildTag(label, backgroundColor, textColor) {
  if (!label) {
    return null;
  }
  return {
    label,
    iconName: "sparkles",
    backgroundColor,
    textColor,
  };
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return "";
  }
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} - ${endLabel}`;
}

function formatNights(nights) {
  if (nights == null) {
    return "";
  }
  return nights === 1 ? "1 Night" : `${nights} Nights`;
}

export function formatActivityDistance(activity, userLocation) {
  const miles = milesBetween(userLocation, { lat: activity.lat, lng: activity.lng });
  if (miles == null || !Number.isFinite(miles)) {
    return "—";
  }
  return `${miles.toFixed(1)} mi`;
}

export function mapPlanActivity(activity, userLocation) {
  const category = categoryByKey[activity.category] || categoryByKey.travel;
  return {
    id: activity.id,
    kind: activity.kind || "custom",
    time: activity.time_label,
    title: activity.title,
    location: activity.location || "",
    lat: activity.lat,
    lng: activity.lng,
    distance: formatActivityDistance(activity, userLocation),
    markerColor: category.markerColor,
    iconLibrary: category.iconLibrary,
    iconName: category.iconName,
    iconBackground: category.iconBackground,
    tag: buildTag(activity.tag_label, category.tagBackgroundColor, category.tagTextColor),
  };
}

export function mapPlanDay(day, userLocation) {
  return {
    id: day.id,
    dayDate: day.day_date,
    label: day.label,
    shortDate: day.short_date,
    fullDate: day.full_date,
    weather: DEFAULT_WEATHER,
    activities: (day.activities || []).map((activity) => mapPlanActivity(activity, userLocation)),
  };
}

export function mapPlanToTrip(plan) {
  return {
    id: plan.id,
    title: plan.title,
    destination: plan.destination_name,
    dates: formatDateRange(plan.start_date, plan.end_date),
    nights: formatNights(plan.nights),
    startDate: plan.start_date,
    endDate: plan.end_date,
    hotelName: plan.hotel_name || "",
    hotelProvider: plan.hotel_provider || "",
    hotelProviderId: plan.hotel_provider_id || "",
    nightsCount: plan.nights,
    dayCount: plan.day_count,
  };
}

export function mapPlanDetail(plan, userLocation) {
  return {
    trip: mapPlanToTrip(plan),
    days: (plan.days || []).map((day) => mapPlanDay(day, userLocation)),
  };
}

export { categoryByKey, DEFAULT_WEATHER, formatDateRange, formatNights };
