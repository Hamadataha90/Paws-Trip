'use client';

import { Suspense } from 'react';
import { Spinner } from 'react-bootstrap';
import OrdersPageClient from './OrdersPageClient';

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      }
    >
      <OrdersPageClient />
    </Suspense>
  );
}
