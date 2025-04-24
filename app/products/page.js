import { fetchProducts } from "../actions/productsActions";
import Loading from "../Loading";
import ProductCard from "../sharedcomponent/productCard";
import { Container, Row, Col } from "react-bootstrap";
import { FaBoxOpen } from "react-icons/fa";
import ProductFilter from "./ProductFilter";

export default async function ProductsPage() {
  let products = [];
  let error = null;

  try {
    products = await fetchProducts();
  } catch (err) {
    error = "Failed to load products. Please try again later.";
  }

  return (
    <Container fluid className="mt-5 w-75 mx-auto">
      <h1 className="text-center display-5 fw-bold mb-4">
        🛍️ Browse Our Collection
      </h1>
      <hr className="my-5" />

      {!products.length && !error && (
        <div className="text-center">
          <Loading message="Fetching the best travel gear for your pet..." />
        </div>
      )}

      {error && (
        <div className="text-center text-danger fw-bold fs-5 mt-4">
          {error}
        </div>
      )}

{!error && products.length > 0 && <ProductFilter products={products} />}


      {!error && !products.length && (
        <div className="text-center mt-5">
          <FaBoxOpen size={40} className="text-muted mb-3" />
          <p className="fw-bold fs-5 text-muted">No products found. Please check back soon!</p>
        </div>
      )}
    </Container>
  );
}
