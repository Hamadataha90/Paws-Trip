"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Container,
  Card,
  Table,
  Form,
  Button,
  Pagination,
  Spinner,
  Modal,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import ClientSearch from "./client-search";
import { FaBoxOpen } from "react-icons/fa";

export default function OrdersPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [limit] = useState(10);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [txnId, setTxnId] = useState(searchParams.get("txn_id") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  useEffect(() => {
    setPage(parseInt(searchParams.get("page")) || 1);
    setEmail(searchParams.get("email") || "");
    setTxnId(searchParams.get("txn_id") || "");
    setSort(searchParams.get("sort") || "desc");
  }, [searchParams]);

  useEffect(() => {
    if (email) {
      fetchOrders();
    } else {
      setOrders([]);
      setTotal(0);
    }
  }, [email, txnId, sort, page]);

  const fetchOrders = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        email,
        txn_id: txnId,
        sort,
        page: page.toString(),
      }).toString();
      const response = await fetch(`/api/orders-data?${query}`);
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
        setTotal(data.total);
      } else {
        console.error(data.error);
        setOrders([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newEmail, newTxnId, newSort) => {
    const query = new URLSearchParams({
      email: newEmail,
      txn_id: newTxnId,
      sort: newSort,
      page: "1",
    });
    router.push(`?${query}`);
  };

  const handlePageChange = (newPage) => {
    const query = new URLSearchParams({
      email,
      txn_id: txnId,
      sort,
      page: newPage.toString(),
    });
    router.push(`?${query}`);
  };

  const handleCancel = async () => {
    try {
      const response = await fetch("/api/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: cancelOrderId }),
      });
      if (response.ok) {
        fetchOrders();
      } else {
        console.error("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setShowCancelModal(false);
      setCancelOrderId(null);
    }
  };

  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return <Badge bg="success">Completed</Badge>;
      case "Pending":
        return <Badge bg="warning">Pending</Badge>;
      case "Cancelled":
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Container className="py-4 px-3">
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="h3 text-primary">Orders</h1>
            {orders.length > 0 && (
              <div
                className="d-inline-flex align-items-center gap-3 px-4 py-2 rounded-4 order-badge"
                style={{
                  backdropFilter: "blur(10px)",
                  background: "rgba(0, 0, 0, 0.1)",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                  color: "black",
                  fontWeight: "500",
                  fontSize: "1rem",
                }}
              >
                <FaBoxOpen size={20} />
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.7)",
                    padding: "6px 14px",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    color: "black",
                    boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {total}
                </span>
                Orders
              </div>
            )}
          </div>
          <ClientSearch
            initialEmail={email}
            initialTxnId={txnId}
            initialSort={sort}
            onSearch={handleSearch}
          />
        </Card.Body>
      </Card>

      {loading ? (
        <Card className="text-center my-4 shadow-sm">
          <Card.Body>
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading orders...</p>
          </Card.Body>
        </Card>
      ) : !email ? (
        <Card className="text-center shadow-sm">
          <Card.Body>
            <p className="text-danger">
              Please enter an email to search for orders
            </p>
          </Card.Body>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="text-center shadow-sm">
          <Card.Body>
            <p className="text-muted">No orders found for this email.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-primary">
                  <tr>
                    <th>ID</th>
                    <th>Order Date</th>
                    <th>Status</th>
                    <th>TXN_ID</th>
                    <th>Currency</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>Postal Code</th>
                    <th>Country</th>
                    <th>State</th>
                    <th>Phone</th>
                    <th>Fulfillment</th>
                    <th>Order_Id</th>
                    <th>Tracking Number</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{format(new Date(order.order_date), "yyyy-MM-dd HH:mm:ss")}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{order.txn_id || "-"}</td>
                      <td>{order.currency || "-"}</td>
                      <td>{order.customer_name || "-"}</td>
                      <td>{order.customer_email}</td>
                      <td>{order.customer_address || "-"}</td>
                      <td>{order.customer_city || "-"}</td>
                      <td>{order.customer_postal_code || "-"}</td>
                      <td>{order.customer_country || "-"}</td>
                      <td>{order.customer_state || "-"}</td>
                      <td>{order.customer_phone ? `+${order.customer_phone}` : "-"}</td>
                      <td>{order.fulfillment_status || "-"}</td>
                      <td>
                        {order.shopify_order_id ? (
                          <Link href={`/track?number=${order.tracking_number}&order_id=${order.shopify_order_id}`}>
                            {order.shopify_order_id}
                          </Link>
                        ) : "-"}
                      </td>
                      <td>
                        {order.tracking_number ? (
                          <Link href={`/track?number=${order.tracking_number}&order_id=${order.shopify_order_id}`}>
                            {order.tracking_number}
                          </Link>
                        ) : "-"}
                      </td>
                      <td>${parseFloat(order.total_price).toFixed(2)}</td>
                      <td>{order.item_count} item{order.item_count !== 1 ? "s" : ""}</td>
                      <td>
                        <Link href={`/orders/details/${order.id}`} className="text-primary">Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <Pagination className="mb-0">
              <Pagination.Prev
                onClick={() => handlePageChange(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
              />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === page}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() =>
                  handlePageChange(page < totalPages ? page + 1 : page)
                }
                disabled={page >= totalPages}
              />
            </Pagination>
            <Form action="/api/export-orders" method="POST">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="txn_id" value={txnId} />
              <Button type="submit" variant="outline-primary" size="sm">
                <i className="bi bi-download me-2"></i>Export CSV
              </Button>
            </Form>
          </Card.Footer>
        </Card>
      )}

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to cancel this order?</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
