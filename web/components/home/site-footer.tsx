import Link from "next/link";
import { header_links } from "@/constants/home";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

      <div className="border-t border-border/20 py-10 sm:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/80">
              Proof Pay
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Safer payments for modern campus commerce.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Minimal friction for buyers, clearer trust signals for vendors,
              and better decisions before money moves.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-3 text-sm text-muted-foreground"
          >
            {header_links.map((link) => (
              <Link
                key={link.text}
                href={link.link}
                className="rounded-full border border-transparent px-3 py-2 transition-colors hover:border-border/70 hover:bg-muted/60 hover:text-foreground"
              >
                {link.text}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {year} Proof Pay. Verify before you pay.</p>
          <p>Built for elegant, trust-aware payments.</p>
        </div>
      </div>
    </footer>
  );
}
