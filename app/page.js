import { fetchFeaturedProducts } from "@/app/actions/mainActions"; // استورد من ملف الـ API
import { Button, Container } from "react-bootstrap";
import Slider from "./sharedcomponent/slider";

export default async function HomePage() {
  const products = await fetchFeaturedProducts(); // جلب المنتجات من Shopify
  

  return (
    <main className="container-fluid mt-5 w-75 mx-auto">
      <h1 className="text-center">
        Welcome to <span className="text-primary"> Paws-Trip</span> Store
      </h1>
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-between bg-light rounded p-4 mt-4 shadow-sm">
  <div className="text-center text-md-start mb-4 mb-md-0">
    <h2 className="fw-bold mb-3 text-primary">
      🐶 Travel in Style, Wagging All the Way!
    </h2>
    <p className="text-muted fs-5">
      Discover premium gear and adorable accessories to make every pet journey comfy and joyful.  
      <span className="fw-semibold text-dark">Your adventure starts here!</span>
    </p>
  </div>
  <div>
    <img
      src="/pet-travel-cute.png" // << حط هنا صورة عندك أو لينك خارجي
      alt="Cute pet in travel gear"
      className="img-fluid rounded"
      style={{ maxWidth: '550px',  }}
    />
  </div>
</div>

<hr  />

      {/* <div className="text-center mb-4">
        <Button variant="primary" size="lg" href="/products">
          Explore All Products
        </Button>   
      </div>
       */}

      <Container fluid  className="mt-5">
        <Slider products={products} title="🌟 Featured Products" chunkSize={3} />
      </Container>
    </main>
  );
}

export const revalidate = 300; // ISR: تحديث كل 5 دقايق