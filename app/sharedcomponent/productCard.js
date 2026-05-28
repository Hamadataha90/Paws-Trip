"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";

const ProductCard = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const PRICE_MULTIPLIER = 1;
  const COMPARE_PRICE_MULTIPLIER = 2.0;

  const originalPrice = parseFloat(product.variants?.[0]?.price || 0);
  const adjustedPrice = originalPrice * PRICE_MULTIPLIER;
  const adjustedComparePrice = adjustedPrice * COMPARE_PRICE_MULTIPLIER;

  const images = product.images || [];

  // Check if the first variant is out of stock
  const isOutOfStock = product.variants?.[0]?.inventory?.includes("Out of Stock");

  const isValidCSSColor = (color) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== "";
  };

  const normalizeColor = (color) => {
    const colorMap = {
      kaki: "khaki",
      grey: "gray",
      beige: "beige",
      navy: "navy",
    };
    const lowerColor = color.toLowerCase();
    return isValidCSSColor(lowerColor)
      ? lowerColor
      : colorMap[lowerColor] || "#f5f5f5";
  };

  const showNotification = (message, bgColor) => {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 80px; right: 160px; background: ${bgColor}; color: white; z-index: 1000;
      padding: 10px 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    try {
      if (isOutOfStock) {
        throw new Error("This product is out of stock.");
      }

      const currentCart = JSON.parse(localStorage.getItem("cart")) || [];

      if (!product.variants?.[0]?.id || !adjustedPrice || !images[0]?.src) {
        throw new Error("Missing product information.");
      }

      const color = normalizeColor(product.variants[0].title.split(" ")[0]);

      const newItem = {
        id: product.variants[0].id,
        quantity: 1,
        title: product.title,
        varientName: product.variants[0].title,
        price: parseFloat(adjustedPrice),
        image: images[0].src,
        color: color,
        sku: product.variants[0].sku,
      };

      const itemIndex = currentCart.findIndex((item) => item.id === newItem.id);
      if (itemIndex > -1) {
        currentCart[itemIndex].quantity += newItem.quantity;
      } else {
        currentCart.push(newItem);
      }

      localStorage.setItem("cart", JSON.stringify(currentCart));
      showNotification("Added to Cart!", "#16a085");
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error("Error in handleAddToCart:", error.message);
      showNotification(error.message, "#e74c3c");
    }
  };

  const loadingMessages = [
    "Getting your product ready...",
    "Hold on, magic is happening!",
    "Fetching the good stuff...",
    "Just a sec, loading awesomeness!",
    "Preparing your product adventure...",
    "Almost there, hang tight!",
    "Loading your product experience...",
    "Just a moment, we’re on it!",
    "Loading your product...",
  ];

  const getRandomMessage = () => {
    return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  };

  const handleViewProduct = () => {
    setLoadingView(true);
    setLoadingMessage(getRandomMessage());
    setTimeout(() => {
      window.location.href = `/products/${product.id}`;
    }, 1500);
  };

  return (
    <Link href={`/products/${product.id}`} passHref className="text-decoration-none">
      <Card
        className="product-card-modern h-100 border-0 bg-transparent"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="product-image-wrapper position-relative rounded-4 overflow-hidden mb-3 shadow-sm">
          <Card.Img
            variant="top"
            src={images[0]?.src || "https://via.placeholder.com/300"}
            alt={product.title}
            className="product-img"
            style={{
              height: "280px",
              objectFit: "cover",
              transition: "transform 0.5s ease",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          />

          {/* Stock Indicator Badge */}
          <div 
            className="position-absolute top-0 start-0 m-3 px-2 py-1 rounded-pill d-flex align-items-center gap-2"
            style={{ 
              background: "rgba(255,255,255,0.9)", 
              backdropFilter: "blur(4px)",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "var(--title-color)"
            }}
          >
            <span className={`stock-dot ${isOutOfStock ? 'bg-danger' : 'bg-success'}`}></span>
            {isOutOfStock ? "Out of Stock" : "In Stock"}
          </div>

          {/* Action Buttons Overlay */}
          <div
            className="product-actions-overlay position-absolute bottom-0 w-100 p-3 d-flex justify-content-center"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.3s ease"
            }}
          >
            <Button
              variant="light"
              className="rounded-pill fw-bold px-4 shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                handleViewProduct();
              }}
              disabled={loadingView}
            >
              {loadingView ? (
                <><Spinner animation="border" size="sm" className="me-2"/> Loading...</>
              ) : "View Details"}
            </Button>
          </div>
        </div>

        <Card.Body className="p-0 text-center">
          <p className="text-muted small mb-1">{product.vendor}</p>
          <Card.Title className="fs-6 fw-bold mb-2 text-truncate" style={{ color: "var(--title-color)" }}>
            {product.title}
          </Card.Title>
          <div className="d-flex justify-content-center align-items-center gap-2">
            {adjustedComparePrice > adjustedPrice && (
              <del className="text-muted small">${adjustedComparePrice.toFixed(2)}</del>
            )}
            <span className="fw-bold fs-5 text-primary">${adjustedPrice.toFixed(2)}</span>
          </div>
        </Card.Body>
      </Card>
    </Link>
  );
};

export default ProductCard;