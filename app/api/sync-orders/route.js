import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('📋 Starting Shopify sync check');

    const ordersResult = await sql`
      SELECT id, txn_id
      FROM orders 
      WHERE status = 'Completed' AND shopify_synced = FALSE;
    `;
    const orders = ordersResult.rows;

    console.log(`📋 Found ${orders.length} orders to sync:`, orders);

    return NextResponse.json(
      { success: true, message: `Found ${orders.length} orders to sync`, orders },
      { status: 200 }
    );
  } catch (error) {
    console.error('🚨 Error checking orders:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to check orders', error: error.message },
      { status: 500 }
    );
  }
}