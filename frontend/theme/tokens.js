import { Platform } from "react-native";

// Wayfinder design system — an editorial, sophisticated take on the brand.
// Warm paper background, ink text, a single gold accent, hairline dividers.

export const colors = {
  paper: "#F4F1EA", // app background (warm paper)
  surface: "#FCFAF6", // cards
  surfaceSunken: "#EEEAE0", // chips / insets
  ink: "#1C1B19", // primary text + headings
  muted: "#6E6659", // secondary text
  faint: "#A79E90", // tertiary text / micro-labels
  line: "rgba(28,27,25,0.12)", // hairline borders
  gold: "#B0813A", // warm accent (labels, links, secondary actions)
  navy: "#2E5C8C", // refined steel blue — hero cards & active states
  cta: "#C4693B", // muted clay orange — primary action buttons
  terracotta: "#C25E3A", // sparing warm pop (ratings, alerts)
  onDark: "#F1ECE2", // text on navy
  onDarkMuted: "rgba(241,236,226,0.70)",
  onDarkLine: "rgba(241,236,226,0.22)",
  danger: "#B23B36",
  star: "#C8912F",
};

// Harmonized jewel tones — muted enough to sit on warm paper, vibrant enough
// to give the icon grids life. Use `tint(color)` for their soft badge backgrounds.
export const accents = {
  blue: "#3A6EA5",
  teal: "#2E8B7F",
  terracotta: "#C25E3A",
  amber: "#C0902F",
  plum: "#7A5A9E",
  green: "#4E8A4E",
  rose: "#C25E7A",
  indigo: "#4A5BA6",
};

// ~12% alpha wash of a 6-digit hex, for badge backgrounds.
export function tint(hex) {
  return `${hex}1F`;
}

export const fonts = {
  // Native gets a single family; web gets a full editorial stack.
  serif: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif",
  }),
  sans: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
  }),
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

// A restrained shadow — barely there, warm-toned.
export const softShadow = Platform.select({
  ios: {
    shadowColor: "#3A3428",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 2 },
  default: {
    shadowColor: "#3A3428",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
});
