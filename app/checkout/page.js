"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { createCoinPaymentTransaction } from "../actions/coinpayments";
import { FaBitcoin } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import Discounts from "./Discounts"; // استيراد الكومبوننت

const isValidCSSColor = (color) => {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
};

const normalizeColor = (color) => {
  const colorMap = { kaki: "khaki", grey: "gray" };
  return colorMap[color.toLowerCase()] || color.toLowerCase();
};

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    email: "",
    phone: "",
  });
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("LTCT");
  const [finalPrice, setFinalPrice] = useState(null); // السعر النهائي بعد الخصم
  const [discountRate, setDiscountRate] = useState(0); // نسبة الخصم
  const paypalRendered = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    if (storedCart.length > 0) {
      const formattedCart = storedCart.map((item) => ({
        ...item,
        id: item.id || item.productId,
        title: item.title || item.productName,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity, 10) || 1,
        color: normalizeColor(item.color || "unknown"),
      })).filter((item) => item.price > 0);
      setCartItems(formattedCart);
      if (formattedCart.length === 0) {
        setMessage({ type: "warning", text: "No valid items in cart! Redirecting to products..." });
        setTimeout(() => router.push("/products"), 2000);
      }
    } else {
      setMessage({ type: "warning", text: "Your cart is empty! Redirecting to products..." });
      setTimeout(() => router.push("/products"), 2000);
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const totalPrice = cartItems
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  // دالة لتحديث السعر بعد الخصم
  const handleDiscountApplied = (newPrice, rate) => {
    setFinalPrice(newPrice);
    setDiscountRate(rate);
  };

  
  const handleOrderConfirmation = async (e) => {
    e.preventDefault();
    let { name, address, city, postalCode, country, phone, email } = shippingInfo;

    if (!name || !address || !city || !postalCode || !country || !phone || !email) {
      setMessage({ type: "warning", text: "Please fill in all required shipping fields." });
      return;
    }

    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(email)) {
      setMessage({ type: "warning", text: "Please enter a valid email address." });
      return;
    }

    if (!phone.startsWith("+")) phone = "+" + phone;
    if (!isValidPhoneNumber(phone)) {
      setMessage({ type: "warning", text: "Please enter a valid phone number." });
      return;
    }

    const priceToUse = finalPrice !== null ? finalPrice : totalPrice; // السعر النهائي أو الأصلي
    if (parseFloat(priceToUse) <= 0 && discountRate < 1) {
      setMessage({ type: "warning", text: "Total amount must be greater than $0.00 unless 100% discount is applied." });
      return;
    }

    setLoading(true);

    try {
      let txn_id = null;
      let checkout_url = null;

      // لو السعر 0 بسبب خصم 100%
      if (parseFloat(priceToUse) === 0) {
        txn_id = "FREE_ORDER_" + Date.now();
      } else {
        const formData = new FormData();
        formData.append("amount", priceToUse);
        formData.append("email", email);
        formData.append("currency2", selectedCurrency);

        const paymentRes = await createCoinPaymentTransaction(formData);

        if (!paymentRes.success) {
          setMessage({ type: "danger", text: paymentRes.error || "Payment failed." });
          return;
        }

        ({ txn_id, checkout_url } = paymentRes);
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          shippingInfo,
          totalPrice: priceToUse,
          txn_id,
          selectedCurrency,
          status: parseFloat(priceToUse) === 0 ? "Completed" : "Pending",
          discountRate,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        setMessage({ type: "danger", text: orderData.message || "Failed to save order." });
        return;
      }

      setMessage({
        type: "success",
        text: parseFloat(priceToUse) === 0 ? "Order completed for free!" : "Redirecting to CoinPayments...",
      });

      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          cartItems,
          shippingInfo,
          totalPrice: priceToUse,
          txn_id,
        })
      );
      localStorage.removeItem("cart");

      if (parseFloat(priceToUse) > 0) {
        setTimeout(() => { window.location.href = checkout_url; }, 1500);
      } else {
        setTimeout(() => { router.push("/thank-you"); }, 1500);
      }
    } catch (error) {
      console.error("handleOrderConfirmation error:", error);
      setMessage({ type: "danger", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems.length && !message) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Loading...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5">
      <h1 className="text-center mb-4" style={{ color: "#1a3c34", fontWeight: "bold" }}>
        Checkout
      </h1>
      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <Row className="checkout">
        <Col md={6} xs={12}>
        <Card className="shadow-sm mb-4 h-100 d-flex flex-column" style={{ border: "1px solid #ecf0f1", position: "relative" }}>
  <Card.Body style={{ flex: "1 1 auto", overflowY: "auto", maxHeight: "400px", paddingRight: "10px" }}>
    <h4 className="mb-4" style={{ color: "#1a3c34" }}>Order Summary</h4>
    {cartItems.length > 0 ? (
      <Row>
        {cartItems.map((item) => (
          <Col
            md={4}
            xs={6}
            key={item.id}
            className="mb-3 d-flex"
          >
            <Card className="p-2 w-100 d-flex flex-column justify-content-between" style={{ minHeight: "280px" }}>
              <Card.Img
                src={item.image}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div className="mt-2 text-center">
                <h5 style={{ color: "#1a3c34", fontSize: "1rem", marginBottom: "0.5rem" }}>
                  {item.title.length > 25 ? item.title.slice(0, 25) + "..." : item.title}
                </h5>
                <p style={{ margin: "0", color: "#7f8c8d" }}>
                  <strong>Price:</strong> ${item.price.toFixed(2)}
                </p>
                <p style={{ margin: "0", color: "#7f8c8d" }}>
                  <strong>Qty:</strong> {item.quantity}
                </p>
                <p style={{ margin: "0", color: "#e74c3c" }}>
                  <strong>Total:</strong> ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    ) : (
      <p className="text-center" style={{ color: "#7f8c8d" }}>
        No items in your cart.
      </p>
    )}
  </Card.Body>

  {/* Grand total footer */}
  <div
    style={{
      padding: "15px",
      borderTop: "1px solid #ecf0f1",
      background: "#f8f9fa",
      textAlign: "center",
      boxShadow: "0px -4px 10px rgba(0, 0, 0, 0.1)",
      position: "absolute",
      bottom: "0",
      width: "100%",
    }}
  >
    <h4 style={{ color: "#e74c3c", marginBottom: "0" }}>
      Grand Total: ${finalPrice !== null ? finalPrice : totalPrice}
      {discountRate > 0 && ` (after ${discountRate * 100}% off)`}
    </h4>
  </div>
</Card>

        </Col>

        <Col md={6} xs={12} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card
            className="shadow-sm"
            style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #dfe6e9", borderRadius: "12px" }}
          >
            <Card.Body style={{ flex: "1 1 auto", overflowY: "auto", maxHeight: "400px", paddingRight: "10px" }}>
              <h4 className="mb-4" style={{ color: "#2c3e50" }}>Shipping Information</h4>
              <Form>
                {["name", "address", "city", "postalCode", "country", "email"].map((field) => (
                  <Form.Group key={field} className="mb-3" controlId={field}>
                    <Form.Label style={{ color: "#2c3e50" }}>{field.replace(/([A-Z])/g, " $1")}</Form.Label>
                    <Form.Control
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={shippingInfo[field]}
                      onChange={handleInputChange}
                      required
                      style={{
                        borderColor: "#ced6e0",
                        borderRadius: "8px",
                        transition: "border-color 0.3s ease",
                      }}
                    />
                  </Form.Group>
                ))}

                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label style={{ color: "#2c3e50" }}>Phone Number</Form.Label>
                  <PhoneInput
                    country={"eg"}
                    value={shippingInfo.phone}
                    onChange={(phone) => setShippingInfo({ ...shippingInfo, phone })}
                    inputStyle={{
                      width: "100%",
                      borderColor: "#ced6e0",
                      borderRadius: "8px",
                    }}
                    inputProps={{ name: "phone", required: true }}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card
            className="shadow-sm"
            style={{ flexShrink: "0", border: "1px solid #dfe6e9", borderRadius: "12px", backgroundColor: "#f8f9fa" }}
          >
            <Card.Body>
              <div className="mb-4">
                <h4 className="d-flex align-items-center" style={{ color: "#2c3e50", fontWeight: "600" }}>
                  <FaBitcoin style={{ marginRight: "10px", color: "#f39c12" }} />
                  Pay with Crypto – Fast & Secure ⚡️
                </h4>
                <p style={{ fontSize: "0.9rem", color: "#636e72", marginTop: "5px" }}>
                  Choose your preferred cryptocurrency and enjoy smooth, secure blockchain payments.
                </p>
              </div>

              <Form.Group className="mb-3" controlId="currencySelect">
                <Form.Label style={{ color: "#2c3e50" }}>Select Currency</Form.Label>
                <Form.Select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  style={{ borderColor: "#ced6e0", borderRadius: "8px", transition: "border-color 0.3s ease" }}
                >
                  <option value="TRX">TRON TRX</option>
                  
                  <option value="USDC.TRC20">USD Coin (Tron)</option>
                  <option value="USDC.BEP20">USD Coin (BSC)</option>
                  <option value="USDC.SOL">USD Coin (Solana)</option>
                  <option value="DAI.BEP20">Dai Token (BSC)</option>
                  <option value="USDT.TRC20">Tether USD (Tron)</option>
                  <option value="USDT.BEP20">Tether USD (BSC)</option>
                  <option value="LTCT">Litecoin Testnet (LTCT)</option>                 
                                 
                </Form.Select>
              </Form.Group>

              {/* إضافة كومبوننت Discounts هنا */}
              <Discounts totalPrice={totalPrice} onDiscountApplied={handleDiscountApplied} />

              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={handleOrderConfirmation}
                disabled={loading}
                style={{ borderRadius: "8px" }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : "Confirm & Pay with Crypto"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
