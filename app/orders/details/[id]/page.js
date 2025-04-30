import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import OrderDetailsClient from './OrderDetailsClient';

export default async function OrderDetailsPage({ params }) {
  const { id } = params;

  // Fetch order details
  const orderQuery = `
    SELECT o.*, COALESCE(SUM(oi.customer_paid), 0) as total_price
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDetailsClient order={order} items={items} />
    </Suspense>
  );
}