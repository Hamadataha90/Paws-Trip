import Image from "next/image";
import { fetchFeaturedProducts } from "@/app/actions/productsActions";
import { Button, Container, Badge } from "react-bootstrap";
import Slider from "./sharedcomponent/slider";
import HomeInteractive from "./sharedcomponent/HomeInteractive";

export default async function HomePage() {
  let products = [];
  let featuredError = null;

  try {
    products = await fetchFeaturedProducts();
  } catch (error) {
    console.error("Home page featured products error:", error);
    featuredError = "Featured products are currently unavailable. Please check back soon.";
  }

  return (
    <main className="container-fluid mt-5 px-4 hero-glow" style={{ maxWidth: "1200px" }}>
      {/* 🌟 Elegant Header Block */}
      <div className="text-center mb-5">
        <Badge 
          bg="success" 
          className="px-3 py-2 rounded-pill mb-3" 
          style={{ 
            fontSize: "0.85rem", 
            backgroundColor: "rgba(74, 139, 125, 0.15)", 
            color: "var(--primary-color)" 
          }}
        >
          🐾 Premium Pet Travel Comfort
        </Badge>
        <h1 className="display-4 fw-bold mb-3" style={{ color: "var(--title-color)", letterSpacing: "-1px" }}>
          Where Pet Journeys Begin — <span className="text-primary">Paws-Trip</span>
        </h1>
        <p className="fs-5 text-secondary max-w-2xl mx-auto mb-2">
          Your trusted companion for stylish, safe, and stress-free pet travel adventures.
        </p>
        <p className="fs-6 text-muted">
          Because every pet deserves a first-class journey.
        </p>
      </div>

      {/* 🐶 Premium Hero Banner */}
      <div 
        className="hero-banner-modern d-flex flex-column flex-md-row align-items-center justify-content-between rounded-5 p-4 p-md-5 shadow-lg mb-5"
        style={{ 
          background: "linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)", 
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.3)",
          transition: "all 0.4s ease"
        }}
      >
        <div className="text-center text-md-start mb-4 mb-md-0 pe-md-4 z-1" style={{ flex: 1.2 }}>
          <h2 className="fw-bold mb-3 display-5" style={{ color: "var(--title-color)", letterSpacing: "-1px" }}>
            Travel in Style, <br />
            <span className="text-primary">Wagging All the Way!</span>
          </h2>
          <p className="text-muted fs-5 mb-5" style={{ lineHeight: "1.8", maxWidth: "600px" }}>
            Discover premium airline-approved carriers, ergonomic travel gear, and adorable travel accessories to make every journey comfy and joyful.
            <span className="fw-semibold d-block mt-3 text-primary">The adventure starts here 🐾</span>
          </p>

          <Button 
            variant="primary" 
            size="lg" 
            href="/products" 
            className="btn-premium-primary px-5 py-3 rounded-pill fs-5"
          >
            Discover Our Products 🛍️
          </Button>
        </div>

        <div className="text-center position-relative z-1" style={{ flex: 1 }}>
          {/* Soft decorative background glow */}
          <div 
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "120%",
              height: "120%",
              background: "var(--gradient-main)",
              filter: "blur(60px)",
              opacity: 0.25,
              zIndex: -1,
              borderRadius: "50%"
            }}
          />
          <Image
            src="/pet-travel-cute.png"
            alt="Cute pet in travel gear"
            className="img-fluid floating-animation drop-shadow-2xl"
            style={{ 
              zIndex: 1, 
              filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.15))" 
            }}
            width={550}
            height={450}
            priority
          />
        </div>
      </div>

      <hr className="my-5 border-top border-2 opacity-25" />

      {/* 🛍️ Top Slider Section */}
      <Container fluid className="my-5 px-0">
        {featuredError ? (
          <div className="text-center py-5">
            <p className="fs-5 text-muted mb-3">{featuredError}</p>
          </div>
        ) : (
          <Slider products={products} title="🔥 Top Picks for Your Pet" />
        )}
      </Container>

      {/* 🚀 New Dynamic & Premium landing sections */}
      <HomeInteractive />
    </main>
  );
}

export const revalidate = 300;