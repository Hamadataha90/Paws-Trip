'use client';

import { Container, Card, Alert, ListGroup, Badge } from 'react-bootstrap';

export default function TrackClient({ trackingData, error }) {
  if (error) {
    return (
      <Container
        fluid
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh' }}
      >
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!trackingData) {
    return (
      <Container
        fluid
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh' }}
      >
        <Alert variant="warning">No tracking information available.</Alert>
      </Container>
    );
  }

  const { tracking_number, carrier, tracking_url, events } = trackingData;

  return (
    <Container className="my-5 d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Card className="flex-grow-1 d-flex flex-column">
        <Card.Header as="h5">Track Your Shipment</Card.Header>
        <Card.Body className="d-flex flex-column flex-grow-1">
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
