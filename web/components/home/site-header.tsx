"use client";

import { useState } from "react";
import { header_links } from "@/constants/home";
import { Button } from "../ui/button";
import Link from "next/link";
import { Menu, User2, X } from "lucide-react";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="fixed z-30 w-full bg-transparent py-6 backdrop-blur-lg">
      <div className="app-container relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-8">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              Proof Pay
            </h2>
            {/* Links*/}
            <div className="hidden items-center text-sm lg:flex">
              {header_links.map((link, index) => (
                <Link
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
            <Button>
              <User2 />
              Signup as vendor/buyer
            </Button>
            <Button variant="outline">Login</Button>
          </div>

          <Button
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
          className={`overflow-hidden transition-all duration-300 ease-out lg:hidden ${
            isMenuOpen ? "max-h-128 pt-4 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-4 border-t border-border/60 pt-4">
            <div className="flex flex-col gap-2 text-sm">
              {header_links.map((link, index) => (
                <Link
                  href={link.link}
                  key={index}
                  onClick={closeMenu}
                  className="rounded-2xl px-4 py-3 hover:bg-white/20"
                >
                  {link.text}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:flex-1">
                <User2 />
                Signup as vendor/buyer
              </Button>
              <Button variant="outline" className="w-full sm:flex-1">
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
