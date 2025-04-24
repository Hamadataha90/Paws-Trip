"use client";

import { useState, useMemo } from "react";
import ProductCard from "../sharedcomponent/productCard";
import { Row, Col, Form, Card } from "react-bootstrap";

export default function ProductFilter({ products }) {
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [enablePriceFilter, setEnablePriceFilter] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const nameMatch = product.title.toLowerCase().includes(search.toLowerCase());
      const inStock = !inStockOnly || product.inventory?.startsWith("In Stock");
      const price = parseFloat(product.variants?.[0]?.price || 0);

      const withinRange = !enablePriceFilter ||
        (
          (!priceMin || price >= parseFloat(priceMin)) &&
          (!priceMax || price <= parseFloat(priceMax))
        );

      return nameMatch && inStock && withinRange;
    });
  }, [products, search, inStockOnly, priceMin, priceMax, enablePriceFilter]);

  return (
    <>
      <Card className="p-4 mb-5 shadow-sm border-0 rounded-4">
        <Row className="gy-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold">🔍 Search</Form.Label>
              <Form.Control
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Pet Travel Bag"
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label="✔️ Enable Price Filter"
                checked={enablePriceFilter}
                onChange={(e) => setEnablePriceFilter(e.target.checked)}
              />
              <div className="d-flex mt-2 gap-2">
                <Form.Control
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  disabled={!enablePriceFilter}
                />
                <Form.Control
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  disabled={!enablePriceFilter}
                />
              </div>
            </Form.Group>
          </Col>

          <Col md={4} className="d-flex align-items-center mt-2 mt-md-4">
            <Form.Check
              type="checkbox"
              label="📦 In Stock Only"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
          </Col>
        </Row>
      </Card>

      <Row className="g-4">
        {filteredProducts.map((product) => (
          <Col key={product.id} xs={12} sm={6} md={4} lg={4} className="fade-in">
            <ProductCard product={product} />
          </Col>
        ))}

        {!filteredProducts.length && (
          <div className="text-muted text-center fw-bold w-100 mt-4">
            😿 No products match your filters.
          </div>
        )}
      </Row>
    </>
  );
}
