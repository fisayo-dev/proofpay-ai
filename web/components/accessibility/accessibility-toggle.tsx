"use client";

import { useEffect } from "react";
import { Accessibility } from "lucide-react";
import { useAccessibility } from "@/context/accessibility-context";

export function AccessibilityToggle() {
  const { isPanelOpen, setPanelOpen } = useAccessibility();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        setPanelOpen(!isPanelOpen);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, setPanelOpen]);

  return (
    <button
      type="button"
      data-a11y-toggle
      onClick={() => setPanelOpen(!isPanelOpen)}
      className="fixed bottom-6 right-6 z-30 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={
        isPanelOpen ? "Close accessibility menu" : "Open accessibility menu"
      }
      aria-expanded={isPanelOpen}
      aria-haspopup="dialog"
    >
      <Accessibility className="size-5" />
    </button>
  );
}
