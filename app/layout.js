// app/layout.js
import React from "react";
import { Cairo } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import NavBar from "./sharedcomponent/nav-bar";
import Footer from "./sharedcomponent/footer";
import FreeShippingBanner from "./sharedcomponent/FreeShippingBanner";
import { Analytics } from "@vercel/analytics/react"

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://paws-trip.vercel.app"),
  title: "Paws Trip",
  description: "Paws Trip - Your Pet's Travel Companion",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png", // خلي دي png لأجهزة أبل
    
  },
  openGraph: {
    title: "Paws Trip",
    description: "Paws Trip - Your Pet's Travel Companion",
    url: "https://paws-trip.vercel.app",
    siteName: "Paws Trip",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Paws Trip Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },  
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cairo.variable}>
        <ThemeProvider attribute="data-theme" enableSystem defaultTheme="dark">
          <NavBar />
          <FreeShippingBanner
            title="Free Shipping on all Orders"
            className="free-shipping-banner"
          />
          {children}
          <Analytics />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

