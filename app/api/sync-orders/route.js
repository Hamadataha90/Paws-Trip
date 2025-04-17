import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('📋 Starting Shopify sync check');

    // جلب الأوردرات
    const ordersResult = await sql`
      SELECT id, txn_id, customer_name, customer_email, customer_address, customer_city, 
             customer_postal_code, customer_country, customer_phone
      FROM orders 
      WHERE status = 'Completed' AND shopify_synced = FALSE;
    `;
    const orders = ordersResult.rows;

    console.log(`📋 Found ${orders.length} orders to sync`);

    if (!orders.length) {
      console.log('✅ No orders to sync');
      return NextResponse.json(
        { success: true, message: 'No orders to sync', orders: [] },
        { status: 200 }
      );
    }

    const preparedOrders = [];

    for (const order of orders) {
      console.log(`🛠 Processing order ${order.id} (txn_id: ${order.txn_id})`);

      // جلب الـ order_items
      const itemsResult = await sql`
        SELECT variant_id, product_name, quantity, total_price, sku 
        FROM order_items 
        WHERE order_id = ${order.id};
      `;
      const items = itemsResult.rows;

      if (!items.length) {
        console.error(`❌ No items found for order ${order.id}`);
        continue;
      }

      // التحقق من variant_id
      const invalidItems = items.filter(item => !item.variant_id);
      if (invalidItems.length) {
        console.error(`❌ Invalid variant_id for order ${order.id}:`, invalidItems);
        continue;
      }

      // إعداد line_items
      const line_items = items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: (item.total_price / item.quantity).toFixed(2),
        sku: item.sku || ''
      }));

      // إعداد الأوردر لـ Shopify
      const shopifyOrder = {
        order: {
          customer: {
            first_name: order.customer_name?.split(' ')[0] || 'Unknown',
            last_name: order.customer_name?.split(' ').slice(1).join(' ') || '',
            email: order.customer_email || 'no-email@example.com'
          },
          billing_address: {
            address1: order.customer_address || 'Unknown',
            city: order.customer_city || 'Unknown',
            zip: order.customer_postal_code || '00000',
            country: order.customer_country || 'Unknown',
            phone: order.customer_phone || ''
          },
          shipping_address: {
            address1: order.customer_address || 'Unknown',
            city: order.customer_city || 'Unknown',
            zip: order.customer_postal_code || '00000',
            country: order.customer_country || 'Unknown',
            phone: order.customer_phone || ''
          },
          line_items,
          total_price: items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2),
          financial_status: 'paid',
          fulfillment_status: null,
          source_name: 'web',
          note: `Order synced from custom checkout. Txn ID: ${order.txn_id}`
        }
      };

      console.log(`📤 Prepared Shopify order for ${order.id}:`, JSON.stringify(shopifyOrder, null, 2));
      preparedOrders.push({ id: order.id, shopifyOrder });
    }

    console.log(`🎉 Prepared ${preparedOrders.length} orders for sync`);
    return NextResponse.json(
      { success: true, message: `Prepared ${preparedOrders.length} orders`, preparedOrders },
      { status: 200 }
    );
  } catch (error) {
    console.error('🚨 Error preparing orders:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to prepare orders', error: error.message },
      { status: 500 }
    );
  }
}