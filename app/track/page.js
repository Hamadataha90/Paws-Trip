import { Suspense } from 'react';
import TrackClient from './TrackClient';
import { Container, Card } from 'react-bootstrap';

// Force dynamic rendering to prevent prerendering
export const dynamic = 'force-dynamic';

export default async function TrackPage({ searchParams }) {
  const trackingNumber = searchParams?.number;
  const orderId = searchParams?.order_id;

  let trackingData = null;
  let error = null;

  if (!trackingNumber || !orderId) {
    error = 'Tracking number and order ID are required.';
  } else {
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

      trackingData = {
        tracking_number: trackingInfo.tracking_number || trackingNumber,
        carrier: trackingInfo.company || null,
        tracking_url: trackingInfo.url || null,
        events: formattedEvents,
      };
    } catch (err) {
      error = err.message;
    }
  }

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
      <TrackClient trackingData={trackingData} error={error} />
    </Suspense>
  );
}