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

function getInitialSettings(): AccessibilitySettings {
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

  useEffect(() => {
    const initial = getInitialSettings();
    setSettings(initial);
    applySettingsToDOM(initial);
    setHydrated(true);
  }, []);

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
