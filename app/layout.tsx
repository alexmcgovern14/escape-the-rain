import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rain Escape - Find Dry Places Nearby",
  description: "Discover the closest dry destinations when it's raining at your location",
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

