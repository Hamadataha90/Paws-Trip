'use client';

import { format } from 'date-fns';
import { Container, Card, Table, Button, Badge, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Link from 'next/link';

export default function OrderDetailsClient({ order, items }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <Badge bg="success">Completed</Badge>;
      case 'Pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'Cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h3 text-primary">Order Details</h1>
            <Link href="/orders" passHref>
              <Button variant="outline-primary" size="sm">
                <i className="bi bi-arrow-left me-2"></i>Back to Orders
              </Button>
            </Link>
          </div>
          <h2 className="h5 mt-3">Order #{order.txn_id}</h2>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <h3 className="h6 mb-3">Order Information</h3>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>ID:</strong> <span>{order.id}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Order Date:</strong> <span>{format(new Date(order.order_date), 'yyyy-MM-dd HH:mm:ss')}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Status:</strong> <span>{getStatusBadge(order.status)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>TXN ID:</strong> <span>{order.txn_id}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Currency:</strong> <span>{order.currency || '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Total:</strong> <span>${parseFloat(order.total_price).toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Fulfillment Status:</strong> <span>{order.fulfillment_status || '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Tracking Number:</strong>
                  <Link
                      href={`/track?number=${order.tracking_number}&order_id=${order.shopify_order_id}`}
                         >
                           <span>{order.tracking_number || '-'}</span>
                  </Link>
                </ListGroup.Item>
              </ListGroup>
            </div>
            <div className="col-md-6">
              <h3 className="h6 mb-3">Customer Information</h3>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Name:</strong> <span>{order.customer_name}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Email:</strong> <span>{order.customer_email}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Phone:</strong> <span>{order.customer_phone ? `+${order.customer_phone}` : '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Address:</strong> <span>{order.customer_address || '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>City:</strong> <span>{order.customer_city || '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>State:</strong> <span>{order.customer_state || '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Postal Code:</strong> <span>{order.customer_postal_code || '-'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Country:</strong> <span>{order.customer_country || '-'}</span>
                </ListGroup.Item>
              </ListGroup>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5">Order Items <Badge bg="primary">{items.length}</Badge></h2>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped hover className="table-responsive">
              <thead className="table-primary">
                <tr>
                  <th style={{ width: '100px' }}>Order ID</th>
                  <th className="d-none d-lg-table-cell">Variant ID</th>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th className="d-none d-lg-table-cell">Discount</th>
                  <th>Paid</th>
                  <th className="d-none d-lg-table-cell">Color</th>
                  <th>SKU</th>
                  <th className="d-none d-lg-table-cell">Variant Name</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">No items found</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Order ID">{item.order_id}</td>
                      <td data-label="Variant ID" className="d-none d-lg-table-cell">{item.variant_id}</td>
                      <td data-label="Product Name" style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{item.product_name || '-'}</Tooltip>}
                        >
                          <span>{item.product_name || '-'}</span>
                        </OverlayTrigger>
                      </td>
                      <td data-label="Price">${parseFloat(item.price).toFixed(2)}</td>
                      <td data-label="Qty">{item.quantity || '-'}</td>
                      <td data-label="Discount" className="d-none d-lg-table-cell">{item.discount_rate ? `${parseFloat(item.discount_rate).toFixed(2)}%` : '-'}</td>
                      <td data-label="Paid">${parseFloat(item.customer_paid).toFixed(2)}</td>
                      <td data-label="Color" className="d-none d-lg-table-cell">{item.color || '-'}</td>
                      <td data-label="SKU" style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{item.sku || '-'}</Tooltip>}
                        >
                          <span>{item.sku || '-'}</span>
                        </OverlayTrigger>
                      </td>
                      <td data-label="Variant Name" className="d-none d-lg-table-cell">{item.varientname || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}