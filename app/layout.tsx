import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escape the rain",
  description: "Can't go outside? Find the nearest places where it's not raining",
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

