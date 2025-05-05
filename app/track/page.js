'use client';  

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Card, Alert } from 'react-bootstrap';

const TrackingInfo = ({ trackingNumber }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trackingNumber) {
      setError('No tracking number provided.');
      return;
    }

    async function fetchTrackingData() {
      try {
        const response = await fetch(`/api/ipn?number=${trackingNumber}`);
        
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('The server returned an unexpected response.');
        }

        const data = await response.json();

        if (!response.ok) {
          if (data.error && data.error.includes('No tracking found')) {
            throw new Error('The tracking number is incorrect or not found.');
          }
          throw new Error(data.error || 'Failed to fetch tracking data.');
        }

        setTrackingData(data);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
      }
    }

    fetchTrackingData();
  }, [trackingNumber]);

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!trackingData) {
    return <Alert variant="warning">No tracking information available.</Alert>;
  }

  const { tracking_number, carrier, tracking_url, events } = trackingData;

  return (
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
        <ul className="timeline">
          {events && events.length > 0 ? (
            events.map((event, index) => (
              <li key={index} className="timeline-item">
                <div
                  className={`timeline-badge ${
                    event.status === 'delivered'
                      ? 'bg-success'
                      : event.status === 'in_transit'
                      ? 'bg-warning'
                      : 'bg-secondary'
                  }`}
                ></div>
                <div className="timeline-panel">
                  <div className="timeline-heading">
                    <h6 className="timeline-title">
                      {event.status
                        .replace('_', ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </h6>
                    <small className="text-muted">
                      {new Date(event.date).toLocaleString()}
                    </small>
                  </div>
                  {event.location && (
                    <div className="timeline-body">
                      <p>{event.location}</p>
                    </div>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li>No tracking events available.</li>
          )}
        </ul>
      </Card.Body>
    </Card>
  );
};

export default function TrackPage() {
  const searchParams = useSearchParams();
  const trackingNumber = searchParams.get('number');

  if (!trackingNumber) {
    return (
      <Container className="my-5" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Alert variant="danger">No tracking number provided.</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Suspense fallback={<Card><Card.Body><Card.Text>Loading tracking information...</Card.Text></Card.Body></Card>}>
        <TrackingInfo trackingNumber={trackingNumber} />
      </Suspense>
    </Container>
  );
}
