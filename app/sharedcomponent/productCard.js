"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";

const ProductCard = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const router = useRouter();

  const PRICE_MULTIPLIER = 2;
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
      router.push(`/products/${product.id}`);
    }, 1500);
  };

  return (
    <Link href={`/products/${product.id}`} passHref>
      <Card
        className="card-hover shadow-sm text-center d-flex flex-column position-relative h-100"
        style={{ cursor: "pointer", overflow: "hidden", height: "25rem" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "relative", width: "100%", height: "25rem" }}>
          <Card.Img
            className="card-img-top"
            variant="top"
            src={images[0]?.src || "https://via.placeholder.com/300"}
            alt={product.title}
            style={{
              height: "100%",
              objectFit: "cover",
              transition: "all 0.3s ease-in-out",
              filter: hovered ? "brightness(0.8)" : "brightness(1)",
            }}
          />

          {loadingView && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "15px 25px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                zIndex: 10,
              }}
            >
              <Spinner animation="border" variant="primary" size="sm" />
              <span className="text-primary fw-bold">{loadingMessage}</span>
            </div>
          )}

          <Card.Body
            className="d-flex flex-column justify-content-center align-items-center"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.4s ease-in-out",
              padding: "7px",
              textAlign: "center",
            }}
          >
            <Card.Title>{product.title}</Card.Title>
            <Card.Text className="text-muted">{product.vendor}</Card.Text>
            <Card.Text className="fw-bold">
              <del className="text-muted me-2">
                ${adjustedComparePrice.toFixed(2)}
              </del>
              <span className="text-primary">${adjustedPrice.toFixed(2)}</span>
            </Card.Text>
          </Card.Body>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "30px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.4s ease-in-out",
            marginTop: "10px",
          }}
        >
          {/* {addedToCart ? (
            <div className="text-success fw-bold">✅ Added to Cart!</div>
          ) : (
            <div className="button-group d-flex justify-content-center gap-2">
              <Button
                variant="primary"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          )} */}
          <Button
            variant="outline-primary"
            onClick={handleViewProduct}
            disabled={loadingView}
          >
            {loadingView ? "Loading..." : "View Product"}
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;