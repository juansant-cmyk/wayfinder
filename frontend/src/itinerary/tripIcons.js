/** Curated destination icons for the trip switcher list. */

const ICON_RULES = [
  {
    test: /(beach|hawaii|bali|malibu|miami|cancun|island)/i,
    iconLibrary: "ionicons",
    iconName: "sunny-outline",
    background: "#FFF4DA",
    color: "#C88100",
  },
  {
    test: /(japan|tokyo|kyoto|osaka|seoul|asia)/i,
    iconLibrary: "material",
    iconName: "flower-tulip-outline",
    background: "#FFE7F0",
    color: "#E1457D",
  },
  {
    test: /(york|nyc|london|paris|rome|berlin|city|downtown)/i,
    iconLibrary: "ionicons",
    iconName: "business-outline",
    background: "#EAF2FF",
    color: "#2463EB",
  },
  {
    test: /(mountain|park|nature|hike|forest|national)/i,
    iconLibrary: "ionicons",
    iconName: "leaf-outline",
    background: "#EAF9F1",
    color: "#12804C",
  },
  {
    test: /(los angeles|la\b|california|sf|san francisco)/i,
    iconLibrary: "ionicons",
    iconName: "airplane-outline",
    background: "#FFF1E4",
    color: "#E87424",
  },
];

const DEFAULT_ICON = {
  iconLibrary: "ionicons",
  iconName: "map-outline",
  background: "#EEF3FB",
  color: "#3B5BDB",
};

export function tripDestinationIcon(destination = "", title = "") {
  const haystack = `${destination} ${title}`.trim();
  for (const rule of ICON_RULES) {
    if (rule.test.test(haystack)) {
      return {
        iconLibrary: rule.iconLibrary,
        iconName: rule.iconName,
        background: rule.background,
        color: rule.color,
      };
    }
  }
  return { ...DEFAULT_ICON };
}
