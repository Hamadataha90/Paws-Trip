'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Card, Alert, ListGroup, Badge } from 'react-bootstrap';

// Force dynamic rendering to prevent prerendering at build time
export const dynamic = 'force-dynamic';

function TrackingContent({ trackingNumber, orderId }) {
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingNumber || !orderId) {
      setError('Tracking number and order ID are required.');
      setLoading(false);
      return;
    }

    async function fetchTrackingData() {
      try {
        const response = await fetch(
          `${process.env.SHOPIFY_API_BASE}/orders/${orderId}/fulfillment_orders.json`,
          {
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tracking data from Shopify.');
        }

        const data = await response.json();
        const fulfillmentOrder = data.fulfillment_orders[0];

        if (!fulfillmentOrder) {
          throw new Error('No fulfillment data available.');
        }

        const trackingInfo = fulfillmentOrder.fulfillments?.[0]?.tracking_info || {};
        const trackingEvents = fulfillmentOrder.tracking_events || [];

        const formattedEvents = trackingEvents.map((event) => ({
          status: event.status || 'unknown',
          date: event.created_at,
          location: event.location || null,
        }));

        setTrackingData({
          tracking_number: trackingInfo.tracking_number || trackingNumber,
          carrier: trackingInfo.company || null,
          tracking_url: trackingInfo.url || null,
          events: formattedEvents,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrackingData();
  }, [trackingNumber, orderId]);

  if (loading) {
    return (
      <Container className="my-5">
        <Card>
          <Card.Body>
            <Card.Text>Loading tracking information...</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!trackingData) {
    return (
      <Container className="my-5">
        <Alert variant="warning">No tracking information available.</Alert>
      </Container>
    );
  }

  const { tracking_number, carrier, tracking_url, events } = trackingData;

  return (
    <Container className="my-5">
      <Card>
        <Card.Header as="h5">Track Your Shipment</Card.Header>
        <Card.Body>
          <Card.Title>Tracking Number: {tracking_number}</Card.Title>
          {carrier && <Card.Text>Shipping Carrier: {carrier}</Card.Text>}
          {tracking_url && (
            <Card.Text>
              <a href={tracking_url} target="_blank" rel="noopener noreferrer">
                Track on {carrier || 'Carrier'} Website
              </a>
            </Card.Text>
          )}
          <h6>Shipment Status</h6>
          <ListGroup variant="flush">
            {events && events.length > 0 ? (
              events.map((event, index) => (
                <ListGroup.Item key={index} className="d-flex align-items-start">
                  <Badge
                    className="me-3 mt-1"
                    bg={
                      event.status === 'delivered'
                        ? 'success'
                        : event.status === 'in_transit'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                     
                  </Badge>
                  <div>
                    <h6 className="mb-1">
                      {event.status
                        .replace('_', ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </h6>
                    <small className="text-muted">
                      {new Date(event.date).toLocaleString()}
                    </small>
                    {event.location && <p className="mb-0">{event.location}</p>}
                  </div>
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No tracking events available.</ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default function TrackPage() {
  const searchParams = useSearchParams();
  const trackingNumber = searchParams.get('number');
  const orderId = searchParams.get('order_id');

  return (
    <Suspense
      fallback={
        <Container className="my-5">
          <Card>
            <Card.Body>
              <Card.Text>Loading tracking information...</Card.Text>
            </Card.Body>
          </Card>
        </Container>
      }
    >
      <TrackingContent trackingNumber={trackingNumber} orderId={orderId} />
    </Suspense>
  );
}