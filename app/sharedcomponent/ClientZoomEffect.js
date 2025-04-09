// app/sharedcomponent/ClientZoomEffect.js
"use client"; // This is a client-side component

import { useEffect } from "react";

const ClientZoomEffect = () => {
  useEffect(() => {
    let zoomLevel = "70%";
    document.body.style.zoom = zoomLevel;

    // Firefox fix: use transform scale instead
    if (navigator.userAgent.toLowerCase().includes("firefox")) {
      document.body.style.transform = "scale(0.70)";
      document.body.style.transformOrigin = "top";
      document.body.style.width = "133.33%"; // Compensate for scaling
    }
  }, []);

  return null; // This component does not render anything itself
};

export default ClientZoomEffect;
