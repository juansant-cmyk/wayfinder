/**
 * Pure routing checks for bottom nav (no React Native imports).
 * Keep in sync with screens/shared/BottomNav.js NAV_ITEMS.
 */

const NAV_ITEMS = [
  { label: "Home", route: "home" },
  { label: "Itinerary", route: "itinerary" },
  { label: "Favorites", route: "favorites" },
  { label: "Maps", route: "maps" },
  { label: "Profile", route: "profile" },
];

const ACTIVE_BY_SCREEN = {
  home: "Home",
  itinerary: "Itinerary",
  favorites: "Favorites",
  maps: "Maps",
  profile: "Profile",
};

function getBottomNavActiveLabel(screen) {
  return ACTIVE_BY_SCREEN[screen] || null;
}

function getBottomNavRoute(label) {
  return NAV_ITEMS.find((item) => item.label === label)?.route || null;
}

const cases = [
  ["hotels", null, "hotels is not a tab"],
  ["home", "Home", "home highlights Home"],
  ["itinerary", "Itinerary", "itinerary highlights Itinerary"],
  ["favorites", "Favorites", "favorites highlights Favorites"],
  ["maps", "Maps", "maps highlights Maps"],
  ["profile", "Profile", "profile highlights Profile"],
  ["flights", null, "flights is not a tab"],
  ["chat", null, "chat is not a tab"],
];

let failed = 0;
for (const [screen, expected, note] of cases) {
  const actual = getBottomNavActiveLabel(screen);
  if (actual !== expected) {
    console.error(`FAIL ${note}: screen=${screen} expected=${expected} got=${actual}`);
    failed += 1;
  }
}

const routeCases = [
  ["Home", "home"],
  ["Itinerary", "itinerary"],
  ["Favorites", "favorites"],
  ["Maps", "maps"],
  ["Profile", "profile"],
];

for (const [label, expected] of routeCases) {
  const actual = getBottomNavRoute(label);
  if (actual !== expected) {
    console.error(`FAIL route ${label}: expected=${expected} got=${actual}`);
    failed += 1;
  }
}

if (failed === 0) {
  console.log("OK bottom nav routing checks passed");
  process.exit(0);
}

process.exit(1);
