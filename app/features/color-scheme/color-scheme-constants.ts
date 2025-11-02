export const THEME_TOGGLE_INTENT = "themeToggle";
export const COLOR_SCHEME_FORM_KEY = "colorScheme";

export const colorSchemes = {
  dark: "dark",
  light: "light",
  system: "system",
} as const;

export type ColorScheme = (typeof colorSchemes)[keyof typeof colorSchemes];
