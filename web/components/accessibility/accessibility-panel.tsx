"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAccessibility } from "@/context/accessibility-context";
import { X, RotateCcw } from "lucide-react";
import type {
  FontSize,
  ColorBlindMode,
  LineSpacing,
} from "@/context/accessibility-context";
import Link from "next/link";

function Toggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
          enabled ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-sm mb-2">{label}</p>
      <div className="flex gap-1 rounded-xl bg-muted p-1" role="radiogroup">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const fontOptions: { value: FontSize; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "xl", label: "XL" },
];

const colorBlindOptions: { value: ColorBlindMode; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "protanopia", label: "Protan" },
  { value: "deuteranopia", label: "Deutan" },
  { value: "tritanopia", label: "Tritan" },
];

const lineSpacingOptions: { value: LineSpacing; label: string }[] = [
  { value: "normal", label: "1.5" },
  { value: "wide", label: "2.0" },
  { value: "extra-wide", label: "2.5" },
];

export function AccessibilityPanel() {
  const { settings, updateSetting, resetSettings, isPanelOpen, setPanelOpen } =
    useAccessibility();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    },
    [setPanelOpen],
  );

  useEffect(() => {
    if (!isPanelOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, handleKeyDown]);

  useEffect(() => {
    if (!isPanelOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-a11y-toggle]")
      ) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen, setPanelOpen]);

  return (
    <>
      {isPanelOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Accessibility settings"
        aria-hidden={!isPanelOpen}
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-background border-l border-border shadow-xl transition-transform duration-300 ease-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Accessibility</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Reset accessibility settings"
              title="Reset accessibility settings"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close accessibility panel"
              title="Close accessibility panel"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-53px)] py-2">
          <div className="space-y-0.5">
            <Toggle
              label="High contrast"
              enabled={settings.highContrast}
              onChange={(v) => updateSetting("highContrast", v)}
            />
            <Toggle
              label="Dyslexia-friendly font"
              enabled={settings.dyslexicFont}
              onChange={(v) => updateSetting("dyslexicFont", v)}
            />
            <Toggle
              label="Reduce motion"
              enabled={settings.reduceMotion}
              onChange={(v) => updateSetting("reduceMotion", v)}
            />
            <Toggle
              label="Keyboard navigation"
              enabled={settings.keyboardMode}
              onChange={(v) => updateSetting("keyboardMode", v)}
            />
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <SegmentedControl
              label="Font size"
              options={fontOptions}
              value={settings.fontSize}
              onChange={(v) => updateSetting("fontSize", v)}
            />
            <SegmentedControl
              label="Line spacing"
              options={lineSpacingOptions}
              value={settings.lineSpacing}
              onChange={(v) => updateSetting("lineSpacing", v)}
            />
            <SegmentedControl
              label="Color blind mode"
              options={colorBlindOptions}
              value={settings.colorBlindMode}
              onChange={(v) => updateSetting("colorBlindMode", v)}
            />
            <section className="p-2 text-center text-sm">View <Link href="https://wave.webaim.org/report#/https://proofpay-ai.vercel.app/" target="_blank" className="font-bold hover:underline">WAVE</Link> web accessibility result.</section>
          </div>
        </div>
      </div>
    </>
  );
}
