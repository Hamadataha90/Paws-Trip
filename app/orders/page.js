'use client';

import { Suspense } from 'react';
import { Spinner } from 'react-bootstrap';
import OrdersPageClient from './OrdersPageClient';

export default function OrdersPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Suspense 
        fallback={
          <div className="text-center my-4 flex-grow-1">
            <Spinner animation="border" variant="primary" />
          </div>
        }
      >
        <OrdersPageClient />
      </Suspense>
    </div>
  );
}
