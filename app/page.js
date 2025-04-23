import { fetchFeaturedProducts } from "@/app/actions/mainActions"; // استورد من ملف الـ API
import { Button, Container } from "react-bootstrap";
import Slider from "./sharedcomponent/slider";

export default async function HomePage() {
  const products = await fetchFeaturedProducts(); // جلب المنتجات من Shopify
  

  return (
    <main className="container-fluid w-75 mt-5">
      <h1 className="text-center display-4 fw-bold mb-3">
        Where Pet Journeys Begin — <span className="text-primary">Paws-Trip</span>
      </h1>
      <p className="text-center fs-5 text-muted mb-1">
        Your trusted companion for stylish and stress-free pet travel 🐾
      </p>
      <p className="text-center fs-6 text-secondary mb-5">
        Because every pet deserves a first-class journey.
      </p>
  
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-between bg-white rounded-4 p-5 shadow-lg">
        <div className="text-center text-md-start mb-4 mb-md-0">
          <h2 className="fw-bold mb-3 text-primary fs-2">
            🐶 Travel in Style, Wagging All the Way!
          </h2>
          <p className="text-muted fs-5 mb-4">
            Discover premium gear and adorable accessories to make every pet journey comfy and joyful.
            <span className="fw-semibold text-dark"> The adventure starts here!</span>
          </p>
  
          <Button variant="primary" size="lg" href="/products" className="px-4 py-2 rounded-pill">
            Discover Our Products
          </Button>
        </div>
  
        <div className="text-center">
          <img
            src="/pet-travel-cute.png"
            alt="Cute pet in travel gear"
            className="img-fluid rounded-3 shadow"
            style={{ maxWidth: '500px' }}
          />
        </div>
      </div>
  
      <hr className="my-5 border-top border-2" />
  
      <Container fluid className="mt-5">
        <Slider products={products} title="Top Picks for Your Pet" chunkSize={3} />
      </Container>
    </main>
  );
  
}
  
export const revalidate = 300; // ISR: تحديث كل 5 دقايق