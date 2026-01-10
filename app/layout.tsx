import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
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
  metadataBase: new URL(env.baseUrl),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
    <html lang="en" style={{ fontSize: '12.8px' }}>
      <body style={{ fontSize: '12.8px', margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}

