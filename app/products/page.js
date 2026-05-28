import { fetchProducts } from "../actions/productsActions";
import { Container } from "react-bootstrap";
import { FaBoxOpen } from "react-icons/fa";
import ProductFilter from "./ProductFilter";
import RetryButton from "./RetryButton";

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
      <h1 className="title text-center display-5 fw-bold mb-4">
        🛍️ Browse Our Collection
      </h1>
      <hr className="my-5" />

      {error ? (
        <div className="text-center text-danger fw-bold fs-5 mt-4">
          {error}
          <RetryButton />
        </div>
      ) : products.length > 0 ? (
        <ProductFilter products={products} />
      ) : (
        <div className="text-center mt-5">
          <FaBoxOpen size={40} className="text-muted mb-3" />
          <p className="fw-bold fs-5 text-muted">No products found. Please check back soon!</p>
          <RetryButton />
        </div>
      )}
    </Container>
  );
}
