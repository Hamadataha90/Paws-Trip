"use client"; // This is a client-side component

import { useEffect, useState } from "react";

const ClientZoomEffect = ({ zoomLevel = 70 }) => {
  useEffect(() => {
    // تطبق الزوم الجديد بناءً على القيمة التي تم تمريرها
    document.body.style.zoom = `${zoomLevel}%`;

    // Firefox fix: use transform scale instead
    if (navigator.userAgent.toLowerCase().includes("firefox")) {
      document.body.style.transform = `scale(${zoomLevel / 100})`;  // تحويل القيمة إلى scale
      document.body.style.transformOrigin = "top";
      document.body.style.width = `${100 / (zoomLevel / 100)}%`; // تعويض الزوم
    }
  }, [zoomLevel]); // يتغير كلما تغيرت قيمة الزوم

  return null; // This component does not render anything itself
};

export default ClientZoomEffect;
