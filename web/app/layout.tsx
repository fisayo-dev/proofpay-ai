import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import HomeLayout from "@/layout/home_layout";
import { AccessibilityProvider } from "@/context/accessibility-context";
import { AccessibilityToggle } from "@/components/accessibility/accessibility-toggle";
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel";

// Geist font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProofPay AI",
  description:
    "Verify before you pay with AI trust scoring and Kora-powered payment requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AccessibilityProvider>
          <HomeLayout>{children}</HomeLayout>
          <AccessibilityToggle />
          <AccessibilityPanel />
        </AccessibilityProvider>
        <Toaster style={{ fontFamily: geistSans.variable }} />
      </body>
    </html>
  );
}
