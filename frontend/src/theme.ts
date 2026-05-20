// Gig-Guard design tokens.
export const colors = {
  bg: "#0A0E11",
  surface: "#1A1F25",
  surfaceAlt: "#13181E",
  primary: "#00D87A",
  primaryDim: "#00b766",
  glow: "rgba(0,216,122,0.55)",
  text: "#FFFFFF",
  textDim: "#A0AAB2",
  textMute: "#6B7480",
  danger: "#FF5560",
  warning: "#F0B400",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",
  glass: "rgba(255,255,255,0.05)",
  glassStrong: "rgba(255,255,255,0.08)",
};

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
export const spacing = (n: number) => n * 8;
export const font = {
  // System fallback — Cabinet Grotesk / Manrope are not bundled; system semibold reads premium.
  display: { fontSize: 34, fontWeight: "800" as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.4 },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "500" as const },
  small: { fontSize: 12, fontWeight: "500" as const, letterSpacing: 0.3 },
};
