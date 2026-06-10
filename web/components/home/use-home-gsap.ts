"use client";

import { type DependencyList, type RefObject, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type HomeGsap = typeof gsap;
type HomeScrollTrigger = typeof ScrollTrigger;

export function useHomeGsap(
  scope: RefObject<HTMLElement | null>,
  setup: (
    gsapInstance: HomeGsap,
    scrollTrigger: HomeScrollTrigger,
    prefersReducedMotion: boolean,
  ) => void | (() => void),
  dependencies: DependencyList = [],
) {
  useLayoutEffect(() => {
    const scopeElement = scope.current;

    if (!scopeElement) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let setupCleanup: void | (() => void);
    const context = gsap.context(() => {
      setupCleanup = setup(gsap, ScrollTrigger, mediaQuery.matches);
    }, scopeElement);

    return () => {
      setupCleanup?.();
      context.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
