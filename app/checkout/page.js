"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { createPaypalPayment } from "../actions/paypal"; // Adjust the import path as necessary

// Function to validate CSS color
const isValidCSSColor = (color) => {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
};

// Function to normalize color names (e.g., "kaki" to "khaki")
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
  });
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const paypalRendered = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    if (storedCart.length > 0) {
      // Format the cart items
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

  const handleOrderConfirmation = () => {
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city) {
      setMessage({ type: "warning", text: "Please fill in all required shipping fields." });
      return;
    }
    if (parseFloat(totalPrice) <= 0) {
      setMessage({ type: "warning", text: "Cannot confirm order: Total amount must be greater than $0.00." });
      return;
    }
    setLoading(true);
    const orderDetails = { cartItems, shippingInfo, totalPrice, orderDate: new Date().toISOString() };
    localStorage.setItem("lastOrder", JSON.stringify(orderDetails));
    localStorage.removeItem("cart");
    setMessage({ type: "success", text: "Order confirmed! Redirecting..." });
    setTimeout(() => router.push("/order-confirmation"), 2000);
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
      <h1 className="text-center mb-4" style={{ color: "#1a3c34", fontWeight: "bold" }}>Checkout</h1>
      {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
      
      <Row className=" checkout" >
        {/* Order Summary Column */}
        <Col md={6} xs={12} >
          <Card className="shadow-sm mb-4 h-100 d-flex flex-column" style={{ border: "1px solid #ecf0f1" }}>
            {/* Order Items Content */}
            <Card.Body style={{ flex: "1 1 auto", overflowY: "auto", maxHeight: "400px", paddingRight: "10px" }}>
              <h4 className="mb-4" style={{ color: "#1a3c34" }}>Order Summary</h4>
              {cartItems.length > 0 ? (
                <Row>
                  {cartItems.map((item) => (
                    <Col md={3} xs={3} key={item.id} className="mb-3 text-center d-flex flex-column align-items-center">
                      <Card className="p-2">
                        <Card.Img src={item.image} alt={item.title} style={{ width: "100%", borderRadius: "8px" }} />
                        <h5 className="mt-2" style={{ color: "#1a3c34", fontSize: "1.1rem" }}>{item.title}</h5>
                        <p style={{ margin: "0", color: "#7f8c8d" }}><strong>Price:</strong> ${item.price.toFixed(2)}</p>
                        <p style={{ margin: "0", color: "#7f8c8d" }}><strong>Qty:</strong> {item.quantity}</p>
                        <p style={{ margin: "0", color: "#e74c3c" }}><strong>Total:</strong> ${(item.price * item.quantity).toFixed(2)}</p>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p className="text-center" style={{ color: "#7f8c8d" }}>No items in your cart.</p>
              )}
            </Card.Body>

            {/* Grand Total Section at the Bottom */}
            <div style={{
              padding: "15px",
              borderTop: "1px solid #ecf0f1",
              background: "#f8f9fa",
              textAlign: "center",
              boxShadow: "0px -4px 10px rgba(0, 0, 0, 0.1)", // Shadow for the total section
              position: "absolute", 
              bottom: "0", // Fixing it at the bottom of the card
              width: "100%",
            }}>
              <h4 style={{ color: "#e74c3c", marginBottom: "0" }}>Grand Total: ${totalPrice}</h4>
            </div>
          </Card>
        </Col>

        {/* Shipping Info & Payment Column */}
        <Col md={6} xs={12} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card className="shadow-sm" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Card.Body style={{ flex: "1 1 auto", overflowY: "auto", maxHeight: "400px", paddingRight: "10px" }}>
              <h4 className="mb-4" style={{ color: "#1a3c34" }}>Shipping Information</h4>
              <Form>
                {["name", "address", "city", "postalCode", "country"].map((field) => (
                  <Form.Group key={field} className="mb-3" controlId={field}>
                    <Form.Label style={{ color: "#1a3c34" }}>{field.replace(/([A-Z])/g, " $1")}</Form.Label>
                    <Form.Control
                      type="text"
                      name={field}
                      value={shippingInfo[field]}
                      onChange={handleInputChange}
                      required
                      style={{ borderColor: "#bdc3c7", transition: "border-color 0.3s ease" }}
                    />
                  </Form.Group>
                ))}
              </Form>
            </Card.Body>
          </Card>

          <Card className="shadow-sm" style={{ flexShrink: 0 }}>
            <Card.Body>
              <h4 className="mb-4" style={{ color: "#1a3c34" }}>Payment</h4>
              <div id="paypal-button-container"></div>
              <Button
                variant="outline-primary"
                className="w-100 mt-3"
                onClick={handleOrderConfirmation}
                disabled={loading || parseFloat(totalPrice) <= 0}
              >
                Confirm Order 
              </Button>
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </Container>
  );
};

export default CheckoutPage;
