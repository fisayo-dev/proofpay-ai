"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type FontSize = "normal" | "large" | "xl";
export type ColorBlindMode =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia";
export type LineSpacing = "normal" | "wide" | "extra-wide";

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: FontSize;
  dyslexicFont: boolean;
  reduceMotion: boolean;
  colorBlindMode: ColorBlindMode;
  lineSpacing: LineSpacing;
  keyboardMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => void;
  resetSettings: () => void;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: "normal",
  dyslexicFont: false,
  reduceMotion: false,
  colorBlindMode: "none",
  lineSpacing: "normal",
  keyboardMode: false,
};

const STORAGE_KEY = "a11y-settings";

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null,
);

function getStoredSettings(): AccessibilitySettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {}
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) {
    return { ...defaultSettings, reduceMotion: true };
  }
  return defaultSettings;
}

function applySettingsToDOM(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.setAttribute("data-a11y-high-contrast", String(settings.highContrast));
  root.setAttribute("data-a11y-font-size", settings.fontSize);
  root.setAttribute("data-a11y-dyslexic-font", String(settings.dyslexicFont));
  root.setAttribute("data-a11y-reduce-motion", String(settings.reduceMotion));
  root.setAttribute("data-a11y-color-blind", settings.colorBlindMode);
  root.setAttribute("data-a11y-line-spacing", settings.lineSpacing);
  root.setAttribute("data-a11y-keyboard-mode", String(settings.keyboardMode));
}

const A11Y_STYLES = `
html[data-a11y-high-contrast="true"] {
  --background: oklch(1 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0 0 0);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.85 0 0);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.85 0 0);
  --muted-foreground: oklch(0.2 0 0);
  --accent: oklch(0.8 0 0);
  --accent-foreground: oklch(0 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0.7 0 0);
  --ring: oklch(0 0 0);
  --success: oklch(0.3 0.18 150);
  --success-foreground: oklch(1 0 0);
  --warning: oklch(0.5 0.16 70);
  --warning-foreground: oklch(1 0 0);
  --destructive: oklch(0.4 0.24 25);
  --destructive-foreground: oklch(1 0 0);
}
html[data-a11y-font-size="large"] { font-size: 120%; }
html[data-a11y-font-size="xl"] { font-size: 140%; }
html[data-a11y-dyslexic-font="true"] { --font-sans: var(--font-lexend); }
html[data-a11y-reduce-motion="true"] *,
html[data-a11y-reduce-motion="true"] *::before,
html[data-a11y-reduce-motion="true"] *::after {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}
html[data-a11y-color-blind="protanopia"] main { filter: url(#a11y-protanopia); }
html[data-a11y-color-blind="deuteranopia"] main { filter: url(#a11y-deuteranopia); }
html[data-a11y-color-blind="tritanopia"] main { filter: url(#a11y-tritanopia); }
html:not([data-a11y-line-spacing="normal"]) p,
html:not([data-a11y-line-spacing="normal"]) li,
html:not([data-a11y-line-spacing="normal"]) h1,
html:not([data-a11y-line-spacing="normal"]) h2,
html:not([data-a11y-line-spacing="normal"]) h3,
html:not([data-a11y-line-spacing="normal"]) h4,
html:not([data-a11y-line-spacing="normal"]) h5,
html:not([data-a11y-line-spacing="normal"]) h6 {
  line-height: var(--a11y-ls);
}
html[data-a11y-line-spacing="wide"] { --a11y-ls: 2; }
html[data-a11y-line-spacing="extra-wide"] { --a11y-ls: 2.5; }
html[data-a11y-keyboard-mode="true"] *:focus-visible {
  outline: 3px solid var(--foreground) !important;
  outline-offset: 3px !important;
  box-shadow: 0 0 0 6px var(--background) !important;
}
`;

function ColorBlindFilters() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <filter id="a11y-protanopia">
        <feColorMatrix
          type="matrix"
          values="0.567,0.433,0,0,0  0.558,0.442,0,0,0  0,0.242,0.758,0,0  0,0,0,1,0"
        />
      </filter>
      <filter id="a11y-deuteranopia">
        <feColorMatrix
          type="matrix"
          values="0.625,0.375,0,0,0  0.7,0.3,0,0,0  0,0.3,0.7,0,0  0,0,0,1,0"
        />
      </filter>
      <filter id="a11y-tritanopia">
        <feColorMatrix
          type="matrix"
          values="0.95,0.05,0,0,0  0,0.433,0.567,0,0  0,0.475,0.525,0,0  0,0,0,1,0"
        />
      </filter>
    </svg>
  );
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = getStoredSettings();
    setSettings(stored);
    applySettingsToDOM(stored);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    applySettingsToDOM(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        isPanelOpen,
        setPanelOpen,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: A11Y_STYLES }} />
      {children}
      <ColorBlindFilters />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx)
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  return ctx;
}
