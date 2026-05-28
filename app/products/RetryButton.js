"use client";

import React from "react";

export default function RetryButton({ className = "mt-3" }) {
  return (
    <div className={className}>
      <button
        className="btn btn-outline-primary px-4 py-2"
        onClick={() => window.location.reload()}
        aria-label="Retry loading products"
      >
        Retry
      </button>
    </div>
  );
}
