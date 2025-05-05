'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Card, Alert } from 'react-bootstrap';

export default function TrackPage() {
  const searchParams = useSearchParams();
  const trackingNumber = searchParams.get('number');
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingNumber) {
      setError('No tracking number provided.');
      setLoading(false);
      return;
    }

    async function fetchTrackingData() {
      try {
        const response = await fetch(`/api/ipn?number=${trackingNumber}`);
        
        // التأكد من أن الاستجابة هي JSON قبل محاولة معالجتها
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
        if (err.message === 'Failed to fetch') {
          setError('Unable to reach the server. Please check your connection and try again.');
        } else if (err.message === 'The server returned an unexpected response.') {
          setError('The server returned an unexpected response. Please try again later.');
        } else if (err.message === 'The tracking number is incorrect or not found.') {
          setError('The tracking number is incorrect or not found.');
        } else {
          setError(err.message || 'An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTrackingData();
  }, [trackingNumber]);

  if (loading) {
    return (
      <Container className="my-5" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
      <Container className="my-5" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!trackingData) {
    return (
      <Container className="my-5" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Alert variant="warning">No tracking information available.</Alert>
      </Container>
    );
  }

  const { tracking_number, carrier, tracking_url, events } = trackingData;

  return (
    <Container className="my-5" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

      <style jsx>{`
        .timeline {
          list-style: none;
          padding: 0;
          position: relative;
          margin: 0;
        }
        .timeline:before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #dee2e6;
          left: 20px;
          margin: 0;
        }
        .timeline-item {
          margin-bottom: 20px;
          position: relative;
          display: flex;
        }
        .timeline-badge {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          position: absolute;
          top: 8px;
          left: 16px;
          z-index: 1;
        }
        .timeline-panel {
          margin-left: 40px;
          flex: 1;
        }
        .timeline-heading {
          margin-bottom: 5px;
        }
        .timeline-title {
          margin: 0;
          font-size: 1rem;
        }
        .timeline-body {
          margin-top: 5px;
        }
      `}</style>
    </Container>
  );
}
