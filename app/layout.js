// app/layout.js
import React from "react";
import { Cairo } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./sharedcomponent/nav-bar";
import Footer from "./sharedcomponent/footer";
import FreeShippingBanner from "./sharedcomponent/FreeShippingBanner";
import DarkMode from "./utils/dark-mode";
import ClientZoomEffect from "./sharedcomponent/ClientZoomEffect"; // Import the client-side zoom component
import { Analytics } from "@vercel/analytics/react"

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata = {
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

function getInitialTheme() {
  return "light"; // Default theme
}

export default function RootLayout({ children }) {
  const initialTheme = getInitialTheme();

  return (
    <html lang="en" data-theme={initialTheme} style={{ colorScheme: initialTheme }}>
      <body className={cairo.variable}>
        <DarkMode initialTheme={initialTheme}>
          <ClientZoomEffect zoomLevel={60} / > 
          <NavBar />
          <FreeShippingBanner
            title="Free Shipping on all Orders"
            className="free-shipping-banner "
          />
          {children}
          <Analytics />{/* Add Vercel Analytics */}
          <Footer />
        </DarkMode>
      </body>
    </html>
  );
}
