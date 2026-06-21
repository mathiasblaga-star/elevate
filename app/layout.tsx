import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Elevate — Live at full capacity",
  description:
    "Track every dimension of your life — habits, goals, mood, and growth — in one place.",
};

// Strict nonce CSP (middleware) requires per-request rendering so Next can inject the
// nonce into its <script> tags — static prerendered pages can't carry a per-request nonce.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark theme-oled">
      <body
        className={`${inter.variable} ${instrument.variable} ${jetbrains.variable} bg-navy text-ink`}
      >
        {children}
      </body>
    </html>
  );
}
