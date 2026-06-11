"use client";

import { useState, useSyncExternalStore } from "react";
import { header_links } from "@/constants/home";
import { clearSession, getCachedSession } from "@/lib/session";
import { getVendorAvatarUrl } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";
import { LogOut, Menu, Plus, User2, X } from "lucide-react";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    clearSession();
    window.location.assign("/");
  };
  const avatarUrl = session
    ? getVendorAvatarUrl([
        session.vendor_id || session.user_id || "",
        session.business_name || session.role,
        session.full_name,
      ])
    : null;
  const isVendor = session?.role === "vendor";

  return (
    <header className="fixed z-30 w-full bg-background/95 py-3">
      <div className="app-container relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link
              href="/"
              className="text-2xl font-extrabold text-primary sm:text-3xl"
            >
              Proof Pay
            </Link>
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
            {session ? (
              <>
                {isVendor ? (
                  <Button variant="outline" asChild>
                    <Link href="/vendors/new-product">
                      <Plus />
                      Create Product
                    </Link>
                  </Button>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href="/vendors/profile">
                    {avatarUrl ? (
                      <Avatar size="sm">
                        <AvatarImage
                          src={avatarUrl}
                          alt={`${session.full_name} account avatar`}
                        />
                        <AvatarFallback>
                          {session.full_name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User2 />
                    )}
                    {session.full_name}
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/vendors/signup?mode=login">
                    <User2 />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/vendors/signup">
                    <User2 />
                    Sign up
                  </Link>
                </Button>
              </>
            )}
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
              {session ? (
                <>
                  {isVendor ? (
                    <Button
                      variant="outline"
                      asChild
                      className="w-full sm:flex-1"
                    >
                      <Link href="/vendors/new-product" onClick={closeMenu}>
                        <Plus />
                        Create Product
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    asChild
                    className="w-full sm:flex-1"
                  >
                    <Link href="/vendors/profile" onClick={closeMenu}>
                      {avatarUrl ? (
                        <Avatar size="sm">
                          <AvatarImage
                            src={avatarUrl}
                            alt={`${session.full_name} account avatar`}
                          />
                          <AvatarFallback>
                            {session.full_name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User2 />
                      )}
                      {session.full_name}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1"
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                  >
                    <LogOut />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full sm:flex-1"
                  >
                    <Link href="/vendors/signup?mode=login" onClick={closeMenu}>
                      <User2 />
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="w-full sm:flex-1">
                    <Link href="/vendors/signup" onClick={closeMenu}>
                      <User2 />
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
