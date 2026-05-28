"use client";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="footer-section py-4 mt-5 shadow-sm">
      <Container>
        <Row className="text-center text-md-start">
          {/* About Section */}
          <Col md={4} className="mb-3">
            <h5 className="fw-bold mb-2">🐾 Paws-Trip</h5>
            <p className="footer-subtext mb-2">Your Pet-Friendly Travel Companion</p>
            <hr />
            <div className="footer-subtext">
              <p className="mb-1">🧳 Premium Travel Gear</p>
              <p className="mb-1">🐶 Comfort for Your Pets</p>
              <p className="mb-1">✈️ Stress-Free Adventures</p>
            </div>
          </Col>

          {/* Quick Links */}
          <Col md={4} className="mb-3">
            <h5 className="fw-bold mb-3 text-primary">🔗 Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link href="/" passHref legacyBehavior>
                  <a className="footer-link hover-underline d-inline-block py-1">🏠 Home</a>
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/products" passHref legacyBehavior>
                  <a className="footer-link hover-underline d-inline-block py-1">🛍️ Products</a>
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/orders" passHref legacyBehavior>
                  <a className="footer-link hover-underline d-inline-block py-1">📦 Orders</a>
                </Link>
              </li>
            </ul>
          </Col>

          {/* Contact Section */}
          <Col md={4} className="mb-3">
            <h5 className="fw-bold mb-3 text-primary">📞 Contact Us</h5>
            <p className="mb-2">
              📧 <a href="mailto:support@paws-trip.com" className="footer-link hover-underline">support@paws-trip.com</a>
            </p>
            <p className="mb-2">
              📱 <a href="tel:+1234567890" className="footer-link hover-underline">+1 234 567 890</a>
            </p>
            <p className="mb-0 footer-subtext">📍 123 Fashion St, New York, USA</p>
          </Col>
        </Row>

        {/* Copyright */}
        <Row className="text-center mt-4">
          <Col>
            <p className="mb-0 footer-subtext">
              &copy; {new Date().getFullYear()} <strong>Paws-Trip</strong> 🐾 — All Rights Reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
