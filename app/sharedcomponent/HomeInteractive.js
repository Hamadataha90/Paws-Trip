"use client";

import { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Badge } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, Plane, Headphones, Star, Mail, CheckCircle } from "lucide-react";

export default function HomeInteractive() {
  // FAQ state
  const [activeFaq, setActiveFaq] = useState(null);

  // Newsletter state
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => {
        setIsSubscribed(false);
      }, 5000);
    }
  };

  const faqs = [
    {
      q: "Are Paws-Trip travel bags airline approved?",
      a: "Yes, indeed! All Paws-Trip carriers are designed to comply with standard major airline dimensions for under-seat cabin placement. However, we always recommend verifying dimensions with your specific airline before departure."
    },
    {
      q: "How do I choose the correct size for my pet?",
      a: "Please measure your pet's length (from collar to base of tail) and height (from floor to top of shoulder). Our product description pages contain detailed size guides with maximum weight and dimension specifications for each gear model."
    },
    {
      q: "Is the travel gear easy to clean and maintain?",
      a: "Absolutely! We build our carriers using water-resistant, durable Oxford fabric. The internal cushions are removable and machine-washable on a gentle cycle, while the external shell can be easily wiped clean with a damp cloth."
    },
    {
      q: "Do you offer international shipping?",
      a: "Yes, we ship to major locations globally, including the US, Canada, UK, Australia, Germany, UAE, and Japan. Detailed shipping locations and estimated delivery times are dynamically shown on each product details page."
    }
  ];

  const testimonials = [
    {
      name: "Sarah & Cooper (Golden Retriever)",
      role: "Frequent Flyer",
      quote: "The Paws-Trip carrier made our flight from New York to London absolute bliss. Cooper was calm, perfectly ventilated, and slept all the way. Beautiful craftsmanship!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&h=150&fit=crop"
    },
    {
      name: "David & Luna (Siamese Cat)",
      role: "Road Tripper",
      quote: "Luna used to cry during car journeys. The ergonomic soft padding in this backpack completely changed her travel anxiety. Now she looks forward to trips!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop"
    },
    {
      name: "Marcus & Bella (French Bulldog)",
      role: "Weekend Explorer",
      quote: "Excellent build quality. Highly durable zippers, strong mesh panels, and very lightweight. It matches our travel gear perfectly. Fully recommended!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&h=150&fit=crop"
    }
  ];

  const features = [
    {
      icon: <Shield size={32} />,
      title: "Premium Safety Standards",
      desc: "Reinforced structures, escape-proof locks, and non-toxic pet-safe eco materials ensure maximum protection."
    },
    {
      icon: <Heart size={32} />,
      title: "Ergonomic Comfort",
      desc: "Orthopedic padding, high-ventilation mesh, and expandable spaces to reduce anxiety and motion sickness."
    },
    {
      icon: <Plane size={32} />,
      title: "Airline Certified",
      desc: "Expertly dimensioned to fit comfortably underneath cabin seats on major national and international airlines."
    },
    {
      icon: <Headphones size={32} />,
      title: "24/7 Expert Support",
      desc: "Our passionate pet-loving experts are always online to help you choose size and plan pet adventures."
    }
  ];

  return (
    <div className="w-100 my-5">
      {/* 🚀 Feature Grid Section */}
      <Container className="my-5 py-4">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-2 rounded-pill mb-3" style={{ fontSize: "0.85rem" }}>
            The Paws-Trip Difference
          </Badge>
          <h2 className="display-6 fw-bold">Why Pet Parents Trust Us 🐾</h2>
          <p className="text-muted max-w-xl mx-auto fs-5">
            We combine high-performance engineering with premium comfort to give your pet the ultimate first-class ride.
          </p>
        </div>

        <Row className="g-4">
          {features.map((feat, index) => (
            <Col key={index} xs={12} md={6} lg={3}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-100"
              >
                <div className="feature-card text-center p-4">
                  <div className="feature-icon-wrapper">
                    {feat.icon}
                  </div>
                  <h4 className="fw-bold mb-3 fs-5">{feat.title}</h4>
                  <p className="text-muted small mb-0">{feat.desc}</p>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>

      <hr className="my-5 border-top border-2 opacity-25" />

      {/* ⭐ Testimonial Reviews Section */}
      <Container className="my-5">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-2 rounded-pill mb-3" style={{ fontSize: "0.85rem" }}>
            Happy Tails
          </Badge>
          <h2 className="display-6 fw-bold">Loved by Thousands of Pet Travelers</h2>
          <p className="text-muted fs-5">
            Discover real experiences from adventuring dog and cat parents.
          </p>
        </div>

        <Row className="g-4 justify-content-center">
          {testimonials.map((test, index) => (
            <Col key={index} xs={12} md={6} lg={4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                className="h-100"
              >
                <div className="testimonial-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="testimonial-stars">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" className="me-1" />
                      ))}
                    </div>
                    <p className="testimonial-quote">"{test.quote}"</p>
                  </div>
                  <div className="d-flex align-items-center mt-3 pt-3 border-top border-light">
                    <img
                      src={test.avatar}
                      alt={test.name}
                      className="testimonial-avatar me-3"
                    />
                    <div>
                      <h6 className="fw-bold mb-0 text-primary">{test.name}</h6>
                      <span className="text-muted small">{test.role}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>

      <hr className="my-5 border-top border-2 opacity-25" />

      {/* ❓ Accordion FAQ Section */}
      <Container className="my-5" style={{ maxWidth: "800px" }}>
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-2 rounded-pill mb-3" style={{ fontSize: "0.85rem" }}>
            Got Questions?
          </Badge>
          <h2 className="display-6 fw-bold">Frequently Asked Questions</h2>
          <p className="text-muted fs-5">
            Everything you need to know about setting off on stress-free flights and road trips.
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => {
            const isActive = activeFaq === index;
            return (
              <div
                key={index}
                className={`faq-item ${isActive ? "active" : ""}`}
                style={{
                  boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-sm)",
                  borderColor: isActive ? "var(--primary-color)" : "rgba(0, 0, 0, 0.05)"
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="faq-trigger"
                >
                  <span className="fs-6 fw-semibold">{faq.q}</span>
                </button>
                <div
                  className="faq-content"
                  style={{
                    maxHeight: isActive ? "500px" : "0px"
                  }}
                >
                  <div className="faq-inner">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      <hr className="my-5 border-top border-2 opacity-25" />

      {/* 📧 Newsletter Form Section */}
      <Container className="my-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="newsletter-card shadow-lg mx-auto" style={{ maxWidth: "900px" }}>
            <div className="position-relative z-1 py-4">
              <Mail size={48} className="text-primary mb-3" />
              <h3 className="fw-bold mb-2">Join the Paws-Trip Pack 🐾</h3>
              <p className="text-muted mb-4 fs-5 mx-auto" style={{ maxWidth: "600px" }}>
                Subscribe to our newsletter for exclusive travel guides, pet packing lists, and <span className="text-primary fw-semibold">10% OFF</span> your first order!
              </p>

              <AnimatePresence mode="wait">
                {!isSubscribed ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubscribe}
                    className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      className="newsletter-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      className="btn-premium-primary px-4 py-2 rounded-pill"
                    >
                      Subscribe Now
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    className="text-success d-flex align-items-center justify-content-center gap-2 fs-5 fw-bold"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle size={24} />
                    <span>Welcome to the pack! Check your inbox for your 10% coupon 🐶</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
