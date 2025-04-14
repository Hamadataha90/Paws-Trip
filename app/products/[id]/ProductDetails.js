"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Badge, Button, Image, Spinner } from "react-bootstrap";
import { GeoAltFill } from "react-bootstrap-icons";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProductDetails({ product: initialProduct }) {
  const [product, setProduct] = useState(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || {});
  const [mainImage, setMainImage] = useState(product?.images?.[0]?.src || "");
  const [quantity, setQuantity] = useState(1);
  const [cleanDescription, setCleanDescription] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [loading, setLoading] = useState(!initialProduct); // لو مفيش initialProduct، اعرض loading
  const [error, setError] = useState(null);

  const router = useRouter();

  const PRICE_MULTIPLIER = 2;
  const COMPARE_PRICE_MULTIPLIER = 2.0;

  const originalPrice = parseFloat(selectedVariant.price || 0);
  const adjustedPrice = originalPrice * PRICE_MULTIPLIER;
  const adjustedComparePrice = adjustedPrice * COMPARE_PRICE_MULTIPLIER;

  // جلب صورة الـ variant المختار
  useEffect(() => {
    if (!product || !product.images) return;
    const matchedImage = product.images.find((img) =>
      img.variant_ids?.includes(Number(selectedVariant.id))
    );
    setMainImage(matchedImage ? matchedImage.src : product.images[0]?.src || "");
  }, [selectedVariant, product?.images]);

  // تنظيف الـ description
  useEffect(() => {
    if (product?.body_html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(product.body_html, "text/html");
      doc.querySelectorAll("style, script").forEach((el) => el.remove());
      doc.querySelectorAll("img").forEach((img) => {
        img.setAttribute("loading", "lazy");
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "10px auto";
      });
      setCleanDescription(doc.body.innerHTML);
    }
  }, [product?.body_html]);

  // Sticky behavior بناءً على حجم الشاشة
  useEffect(() => {
    const handleResize = () => setIsSticky(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleVariantChange = useCallback((e) => {
    const selected = product?.variants?.find((v) => String(v.id) === e.target.value);
    setSelectedVariant(selected || {});
  }, [product?.variants]);

  const handleThumbnailClick = useCallback((img) => {
    setMainImage(img.src);
    if (img.variant_ids?.length) {
      const matchedVariantId = img.variant_ids[0];
      const newVariant = product?.variants?.find((v) => v.id === matchedVariantId);
      setSelectedVariant(newVariant || {});
    }
  }, [product?.variants]);

  const normalizeColor = useCallback((color) => {
    const colorMap = { kaki: "khaki", grey: "gray", beige: "beige", navy: "navy" };
    const lowerColor = color.toLowerCase();
    const s = new Option().style;
    s.color = lowerColor;
    return s.color !== "" ? lowerColor : (colorMap[lowerColor] || "#f5f5f5");
  }, []);

  const showNotification = (message, bgColor) => {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 60px; right: 20px; background: ${bgColor}; color: white;
      padding: 10px 20px; border-radius: 5px; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };





  
  // const handleAddToCart = async () => {
  //   try {
  //     const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
  
  //     if (!selectedVariant?.id || !quantity || !adjustedPrice || !mainImage) {
  //       throw new Error("Missing product information.");
  //     }
  
  //     const color = normalizeColor(selectedVariant.title.split(" ")[0]);
  
  //     const newItem = {
  //       id: selectedVariant.id,
  //       quantity: parseInt(quantity, 10),
  //       title: selectedVariant.title,
  //       price: parseFloat(adjustedPrice),
  //       image: mainImage,
  //       color: color,
  //     };
  
  //     const itemIndex = currentCart.findIndex((item) => item.id === newItem.id);
  //     if (itemIndex > -1) {
  //       currentCart[itemIndex].quantity += newItem.quantity;
  //     } else {
  //       currentCart.push(newItem);
  //     }
  
  //     // إرسال السلة إلى API
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_2}/api/cart`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ cart: currentCart }),
  //     });
  
  //     if (!response.ok) {
  //       throw new Error("Failed to update cart");
  //     }
  
  //     const data = await response.json();
  //     console.log(data.message);  // رسالة نجاح من الـ API
  
  //     localStorage.setItem("cart", JSON.stringify(currentCart));  // تحديث السلة في localStorage
  
  //     const notification = document.createElement("div");
  //     notification.textContent = "Added to Cart!";
  //     notification.style.cssText = `
  //       position: fixed; top: 58px; right: 170px; background: #16a085; color: white;
  //       padding: 10px 20px; border-radius: 5px; z-index: 1000;
  //     `;
  //     document.body.appendChild(notification);
  //     setTimeout(() => notification.remove(), 2000);
  //   } catch (error) {
  //     const errorNotification = document.createElement("div");
  //     errorNotification.textContent = "Error adding to cart. Please try again.";
  //     errorNotification.style.cssText = `
  //       position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white;
  //       padding: 10px 20px; border-radius: 5px; z-index: 1000;
  //     `;
  //     document.body.appendChild(errorNotification);
  //     setTimeout(() => errorNotification.remove(), 2000);
  //     console.error("Error in handleAddToCart:", error.message);
  //   }
  // };




  const handleAddToCart = useCallback(() => {
    try {
      setLoading(true);
      const currentCart = JSON.parse(localStorage.getItem("cart")) || [];

      if (!selectedVariant?.id || !quantity || !adjustedPrice || !mainImage) {
        throw new Error("Missing product information.");
      }

      const color = normalizeColor(selectedVariant.title.split(" ")[0]);
      const newItem = {
        id: selectedVariant.id,
        quantity: parseInt(quantity, 10),
        title: selectedVariant.title,
        price: parseFloat(adjustedPrice),
        image: mainImage,
        color,
      };

      const itemIndex = currentCart.findIndex((item) => item.id === newItem.id);
      if (itemIndex > -1) {
        currentCart[itemIndex].quantity += newItem.quantity;
      } else {
        currentCart.push(newItem);
      }

      localStorage.setItem("cart", JSON.stringify(currentCart));
      showNotification("Added to Cart!", "#16a085");
    } catch (error) {
      showNotification("Error adding to cart. Please try again.", "#e74c3c");
      console.error("Error in handleAddToCart:", error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedVariant, quantity, adjustedPrice, mainImage, normalizeColor]);



  const handleCheck = useCallback(() => {
    try {
      setLoading(true);
      const currentCart = JSON.parse(localStorage.getItem("cart")) || [];

      if (!selectedVariant?.id || !quantity || !adjustedPrice || !mainImage) {
        throw new Error("Missing product information.");
      }

      const color = normalizeColor(selectedVariant.title.split(" ")[0]);
      const newItem = {
        id: selectedVariant.id,
        quantity: parseInt(quantity, 10),
        title: selectedVariant.title,
        price: parseFloat(adjustedPrice),
        image: mainImage,
        color,
      };

      const itemIndex = currentCart.findIndex((item) => item.id === newItem.id);
      if (itemIndex > -1) {
        currentCart[itemIndex].quantity += newItem.quantity;
      } else {
        currentCart.push(newItem);
      }

      localStorage.setItem("cart", JSON.stringify(currentCart));
      router.push("/checkout");
    } catch (error) {
      showNotification("Error proceeding to checkout. Please try again.", "#e74c3c");
      console.error("Error in handleCheck:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedVariant, quantity, adjustedPrice, mainImage, normalizeColor, router]);


  
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Loading product details...</p>
      </Container>
    );
  }

  if (!product || error) {
    return (
      <Container className="mt-5 text-center">
        <h3>{error || "Product not found"}</h3>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-5">
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <Spinner animation="border" variant="light" style={{ width: "3rem", height: "3rem" }} />
        </div>
      )}
      <Row className="align-items-start">
        <Col xs={12} md={4} style={isSticky ? { position: "sticky", top: "0", height: "100vh", overflowY: "overlay" } : {}}>
          <div className="text-center">
            <div style={{ width: "100%", maxHeight: "800px", overflow: "hidden" }}>
              <Image
                src={mainImage}
                alt="Product Image"
                fluid
                style={{ width: "100%", objectFit: "contain", maxHeight: "500px", borderRadius: "50px" }}
              />
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
              {product.images && product.images.length > 0 ? (
                product.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.src}
                    alt="Product Thumbnail"
                    className={`thumbnail ${mainImage === img.src ? "border border-primary" : ""}`}
                    style={{ width: "60px", height: "60px", objectFit: "cover", cursor: "pointer", borderRadius: "8px" }}
                    onClick={() => handleThumbnailClick(img)}
                  />
                ))
              ) : (
                <p>No images available</p>
              )}
            </div>
          </div>
        </Col>

        <Col md={6} xs={12} className="px-4 py-2 col-details">
          <h1 className="mb-2">{product.title}</h1>
          <Badge bg="secondary" className="mb-3">{product.product_type || "General"}</Badge>

          <div className="mb-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <p className="fs-4 fw-bold text-primary m-0">{adjustedPrice.toFixed(2)}</p>
              <p className="fs-5 text-muted text-decoration-line-through m-0">{adjustedComparePrice.toFixed(2)}</p>
              <Badge bg="success">50% OFF</Badge>
            </div>
            {product.shippingLocation && (
              <div className="d-flex align-items-center gap-2 bg-light border rounded px-3 py-1">
                <GeoAltFill size={20} className="text-primary" />
                <p className="fw-semibold text-dark fs-6 m-0">SHIPS FROM: {product.shippingLocation}</p>
              </div>
            )}
          </div>

          <div className="d-flex align-items-baseline gap-5 mb-3">
            {product.inventory && (
              <p className={`fw-semibold ${product.inventory.includes("Out of Stock") ? "text-danger" : "text-success"}`}>
                {product.inventory}
              </p>
            )}
            <select className="form-select" value={selectedVariant.id} onChange={handleVariantChange}>
              {product.variants && product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>{variant.title}</option>
              ))}
            </select>
          </div>

          <div className="d-flex align-items-center gap-3 mt-4">
            <Button variant="outline-danger" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>-</Button>
            <span className="text-success fw-bold">{quantity}</span>
            <Button variant="outline-danger" onClick={() => setQuantity((prev) => prev + 1)}>+</Button>
            <motion.span className="text-primary fw-bold ms-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              Total: ${(adjustedPrice * quantity).toFixed(2)}
            </motion.span>
          </div>

          <div className="d-flex gap-3 mt-4">
            <Button onClick={handleAddToCart} className="flex-grow-1" size="lg" disabled={loading}>
              Add to Cart 🛒
            </Button>
            <Button onClick={handleCheck} variant="warning" className="flex-grow-1" size="lg" disabled={loading}>
              Checkout 🛍️
            </Button>
          </div>

          <div className="mt-5">
            <div className="border p-3 rounded bg-light">
              <h2 style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#ff6600", textTransform: "uppercase", textAlign: "center" }}>
                Loved by Thousands, Trusted by You!
              </h2>
              <br />
              <hr style={{ border: "1px solid #ff6600", margin: "10px 0" }} />
              <br />
              <br />
              <div dangerouslySetInnerHTML={{ __html: cleanDescription }} />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
