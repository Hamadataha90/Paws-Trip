'use client';

import { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

export default function ClientSearch({ initialEmail, initialTxnId, initialSort, onSearch }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [txnId, setTxnId] = useState(initialTxnId || '');
  const [sort, setSort] = useState(initialSort || 'desc');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onSearch(email, txnId, sort);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="g-3 align-items-end">
        <Col md={4}>
          <Form.Group controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter customer email"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="txnId">
            <Form.Label>Order ID (Optional)</Form.Label>
            <Form.Control
              type="text"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="Enter order ID"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="sort">
            <Form.Label>Sort</Form.Label>
            <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Button type="submit" variant="primary" disabled={!email}>
            Search
          </Button>
        </Col>
      </Row>
    </Form>
  );
}