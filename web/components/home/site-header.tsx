"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { header_links } from "@/constants/home";
import { getCachedSession } from "@/lib/session";
import { getVendorAvatarUrl } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";
import { Menu, Plus, User2, X } from "lucide-react";
import { useHomeGsap } from "./use-home-gsap";

export function SiteHeader() {
  const rootRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );

  const closeMenu = () => setIsMenuOpen(false);
  const avatarUrl = session
    ? getVendorAvatarUrl([
        session.vendor_id,
        session.business_name,
        session.full_name,
      ])
    : null;

  useHomeGsap(rootRef, (gsapInstance, _ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsapInstance.set("[data-header-animate]", { clearProps: "all" });
      return;
    }

    gsapInstance
      .timeline({ defaults: { ease: "power3.out" } })
      .from(rootRef.current, {
        y: -28,
        autoAlpha: 0,
        duration: 0.55,
      })
      .from(
        "[data-header-brand]",
        {
          letterSpacing: "0.08em",
          scale: 0.96,
          duration: 0.45,
        },
        "-=0.2",
      )
      .from(
        "[data-header-link]",
        {
          autoAlpha: 0,
          y: -10,
          stagger: 0.045,
          duration: 0.36,
        },
        "-=0.25",
      )
      .from(
        "[data-header-action]",
        {
          autoAlpha: 0,
          x: 16,
          scale: 0.96,
          stagger: 0.06,
          duration: 0.36,
        },
        "-=0.25",
      );
  }, []);

  useEffect(() => {
    const panel = mobileMenuRef.current;

    if (!panel) {
      return;
    }

    if (isMenuOpen) {
      gsap.set(panel, { height: "auto", autoAlpha: 1 });
      const panelHeight = panel.offsetHeight;

      gsap.fromTo(
        panel,
        { height: 0, autoAlpha: 0 },
        {
          height: panelHeight,
          autoAlpha: 1,
          duration: 0.38,
          ease: "power3.out",
          onComplete: () => gsap.set(panel, { height: "auto" }),
        },
      );
      gsap.fromTo(
        panel.querySelectorAll("[data-mobile-item]"),
        { autoAlpha: 0, x: -18, rotate: -1 },
        {
          autoAlpha: 1,
          x: 0,
          rotate: 0,
          duration: 0.32,
          stagger: 0.045,
          ease: "power2.out",
        },
      );
      return;
    }

    gsap.to(panel, {
      height: 0,
      autoAlpha: 0,
      duration: 0.25,
      ease: "power2.inOut",
    });
  }, [isMenuOpen]);

  return (
    <header ref={rootRef} className="fixed z-30 w-full bg-background/95 py-3">
      <div className="app-container relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link
              data-header-animate
              data-header-brand
              href="/"
              className="text-2xl font-extrabold text-primary sm:text-3xl"
            >
              Proof Pay
            </Link>
            {/* Links*/}
            <div className="hidden items-center text-sm lg:flex">
              {header_links.map((link, index) => (
                <Link
                  data-header-animate
                  data-header-link
                  href={link.link}
                  key={index}
                  className="cursor-pointer rounded-full px-3 py-2 hover:bg-gray-100"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden items-center space-x-4 lg:flex">
            {session ?
              <>
                <Button data-header-animate data-header-action variant="outline" asChild>
                  <Link href="/vendors/new-product">
                    <Plus />
                    Create Product
                  </Link>
                </Button>
                <Button data-header-animate data-header-action variant="outline" asChild>
                  <Link href="/vendors/profile">
                    {avatarUrl ?
                      <Avatar size="sm">
                        <AvatarImage
                          src={avatarUrl}
                          alt={`${session.business_name} vendor avatar`}
                        />
                        <AvatarFallback>
                          {session.full_name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    : <User2 />}
                    {session.full_name}
                  </Link>
                </Button>
              </>
            : <Button data-header-animate data-header-action asChild>
                <Link href="/vendors/signup">
                  <User2 />
                  Signup as vendor
                </Link>
              </Button>
            }
          </div>

          <Button
            data-header-animate
            data-header-action
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        <div
          ref={mobileMenuRef}
          className="h-0 overflow-hidden opacity-0 lg:hidden"
        >
          <div className="space-y-4 border-t border-border/60 pt-4">
            <div className="flex flex-col gap-2 text-sm">
              {header_links.map((link, index) => (
                <Link
                  href={link.link}
                  key={index}
                  onClick={closeMenu}
                  data-mobile-item
                  className="rounded-2xl px-4 py-3 hover:bg-white/20"
                >
                  {link.text}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {session ?
                <Button variant="outline" asChild className="w-full sm:flex-1">
                  <Link href="/vendors/profile" onClick={closeMenu} data-mobile-item>
                    {avatarUrl ?
                      <Avatar size="sm">
                        <AvatarImage
                          src={avatarUrl}
                          alt={`${session.business_name} vendor avatar`}
                        />
                        <AvatarFallback>
                          {session.full_name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    : <User2 />}
                    {session.full_name}
                  </Link>
                </Button>
              : <Button asChild className="w-full sm:flex-1">
                  <Link href="/vendors/signup" onClick={closeMenu} data-mobile-item>
                    <User2 />
                    Signup as vendor
                  </Link>
                </Button>
              }
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
