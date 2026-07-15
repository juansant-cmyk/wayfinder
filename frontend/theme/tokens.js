import { Platform } from "react-native";

// Wayfinder design system — Ally's blue base (preserved) with Nia's serif
// headings + gold accent as the lighter touch. Cool/blue neutrals throughout.

export const colors = {
  paper: "#EAF2FC", // app background (Ally's light blue)
  surface: "#FFFFFF", // cards (white on blue, like Ally's)
  surfaceSunken: "#E3EDF9", // chips / insets (light blue tint)
  ink: "#14253E", // primary text + headings (Ally's navy)
  muted: "#51617A", // secondary text (cool slate)
  faint: "#8A9AB3", // tertiary text / micro-labels (cool light slate)
  line: "rgba(20,37,62,0.12)", // hairline borders (cool)
  gold: "#B0813A", // warm accent — Nia's touch (labels, links)
  navy: "#2B6CC0", // brand blue (heroes, active states)
  cta: "#D96A45", // coral — Ally's accent (primary action buttons)
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
