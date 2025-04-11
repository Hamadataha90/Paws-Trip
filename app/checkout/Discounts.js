"use client";

import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";

const Discounts = ({ totalPrice, onDiscountApplied }) => {
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState(null);

  const applyCoupon = async () => {
    try {
      const res = await fetch("/api/apply-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, totalPrice }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        onDiscountApplied(data.discountedPrice, data.discountRate);
      } else {
        setMessage({ type: "warning", text: "Invalid or expired coupon code" });
        onDiscountApplied(totalPrice, 0);
      }
    } catch (error) {
      setMessage({ type: "danger", text: "Error applying coupon" });
      onDiscountApplied(totalPrice, 0);
    }
  };

  return (
    <div className="mt-3">
      <Form.Group controlId="couponCode">
        <Form.Label style={{ color: "#2c3e50" }}>Apply Coupon</Form.Label>
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code"
            style={{ borderColor: "#ced6e0", borderRadius: "8px" }}
          />
          <Button variant="outline-primary" onClick={applyCoupon}>
            Apply
          </Button>
        </div>
      </Form.Group>
      {message && (
        <Alert variant={message.type} className="mt-2" onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}
    </div>
  );
};

export default Discounts;