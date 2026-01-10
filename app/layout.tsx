import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Escape the Rain - Find Dry Places Nearby",
  description: "Discover nearby destinations where it's not raining. Get real-time weather-based recommendations for cities, towns, and villages across the UK.",
  keywords: "weather, rain, dry places, UK weather, destination finder, escape rain, find dry location, weather app, UK destinations",
  authors: [{ name: "Escape the Rain" }],
  creator: "Escape the Rain",
  publisher: "Escape the Rain",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://escapetherain.com"),
  openGraph: {
    title: "Escape the Rain - Find Dry Places Nearby",
    description: "Discover nearby destinations where it's not raining. Get real-time weather-based recommendations for cities, towns, and villages across the UK.",
    type: "website",
    locale: "en_GB",
    siteName: "Escape the Rain",
    url: "/",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Escape the Rain - Find Dry Places Nearby",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Escape the Rain - Find Dry Places Nearby",
    description: "Discover nearby destinations where it's not raining",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

