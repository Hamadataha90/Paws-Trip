import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Container, Table, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;

  // Fetch order details
  const orderQuery = `
    SELECT o.*, COALESCE(SUM(oi.total_price) * 2, 0) as total_price
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = $1
    GROUP BY o.id
  `;
  const { rows: [order] } = await sql.query(orderQuery, [id]);

  // Fetch order items
  const itemsQuery = `
    SELECT * FROM order_items WHERE order_id = $1
  `;
  const { rows: items } = await sql.query(itemsQuery, [id]);

  if (!order) {
    notFound();
  }

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
      <h1 className="h3 mb-4 text-primary">Order Details</h1>
      <Link href="/orders" className="btn btn-secondary mb-4">
        Back to Orders
      </Link>
      <h2 className="h5 mb-3">Order #{order.txn_id}</h2>
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>ID:</strong> {order.id}</p>
              <p><strong>Order Date:</strong> {format(new Date(order.order_date), 'yyyy-MM-dd HH:mm:ss')}</p>
              <p><strong>Status:</strong> {getStatusBadge(order.status)}</p>
              <p><strong>Order ID:</strong> {order.txn_id}</p>
              <p><strong>Currency:</strong> {order.currency || '-'}</p>
              <p><strong>Total:</strong> ${parseFloat(order.total_price).toFixed(2)}</p>
              <p><strong>Fulfillment Status:</strong> {order.fulfillment_status || '-'}</p>
              <p><strong>Tracking Number:</strong> {order.tracking_number || '-'}</p>
              {/* <p><strong>Shopify Synced:</strong> {order.shopify_synced ? 'Yes' : 'No'}</p>
              <p><strong>Shopify Order ID:</strong> {order.shopify_order_id || '-'}</p> */}
            </div>
            <div className="col-md-6">
              <h3 className="h6">Customer Information</h3>
              <p><strong>Name:</strong> {order.customer_name}</p>
              <p><strong>Email:</strong> {order.customer_email}</p>
              <p><strong>Phone:</strong> {order.customer_phone ? `+${order.customer_phone}` : '-'}</p>
              <p><strong>Address:</strong> {order.customer_address || '-'}</p>
              <p><strong>City:</strong> {order.customer_city || '-'}</p>
              <p><strong>Postal Code:</strong> {order.customer_postal_code || '-'}</p>
              <p><strong>Country:</strong> {order.customer_country || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      <h2 className="h5 mb-3">Order Items</h2>
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead className="table-primary">
            <tr>
              <th>Order ID</th>
              <th>Variant ID</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Discount Rate</th>
              <th>Total Price</th>
              <th>Customer Paid</th>
              <th>Color</th>
              <th>SKU</th>
              <th>Variant Name</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center">No items found</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.order_id}</td>
                  <td>{item.variant_id}</td>
                  <td>{item.product_name || '-'}</td>
                  <td>${parseFloat(item.price).toFixed(2)}</td>
                  <td>{item.quantity || '-'}</td>
                  <td>{item.discount_rate ? `${parseFloat(item.discount_rate).toFixed(2)}%` : '-'}</td>
                  <td>${parseFloat(order.total_price).toFixed(2)}</td>
                  <td>${parseFloat(item.customer_paid).toFixed(2)}</td>
                  <td>{item.color || '-'}</td>
                  <td>{item.sku || '-'}</td>
                  <td>{item.varientname || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}