import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

const SHOPIFY_API_BASE = 'https://humidityzone.myshopify.com/admin/api/2023-10';
const SHOPIFY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
};

export async function POST() {
  try {
    // جلب الأوردرات اللي Completed ومش synced
    const ordersResult = await sql`
      SELECT * FROM orders 
      WHERE status = 'Completed' AND shopify_synced = FALSE;
    `;
    const orders = ordersResult.rows;

    console.log(`📋 Found ${orders.length} orders to sync`);

    if (!orders.length) {
      return NextResponse.json({ success: true, message: 'No orders to sync' }, { status: 200 });
    }

    let syncedCount = 0;

    for (const order of orders) {
      console.log(`🛠 Processing order ${order.id}`);

      // جلب الـ order_items
      const itemsResult = await sql`
        SELECT variant_id, product_name, quantity, total_price, sku 
        FROM order_items 
        WHERE order_id = ${order.id};
      `;
      const items = itemsResult.rows;

      if (!items.length) {
        console.error(`❌ No items for order ${order.id}`);
        continue;
      }

      console.log(`🛒 Order items for ${order.id}:`, items);

      // إعداد line_items لـ Shopify
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

      console.log(`📤 Sending order ${order.id} to Shopify`);

      // التحقق من التوكن
      if (!process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
        console.error('❌ SHOPIFY_ADMIN_API_ACCESS_TOKEN is not defined');
        continue;
      }

      // إرسال الأوردر لـ Shopify
      const response = await fetch(`${SHOPIFY_API_BASE}/orders.json`, {
        method: 'POST',
        headers: SHOPIFY_HEADERS,
        body: JSON.stringify(shopifyOrder)
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error(`❌ Failed to sync order ${order.id}: ${response.status} - ${responseText}`);
        continue;
      }

      const shopifyData = JSON.parse(responseText);
      const shopifyOrderId = shopifyData.order.id;

      console.log(`✅ Order ${order.id} synced with Shopify ID ${shopifyOrderId}`);

      // تحديث الداتابيز
      await sql`
        UPDATE orders 
        SET shopify_synced = TRUE, 
            shopify_order_id = ${shopifyOrderId}, 
            fulfillment_status = 'ready_to_ship'
        WHERE id = ${order.id};
      `;

      syncedCount++;
    }

    return NextResponse.json(
      { success: true, message: `Synced ${syncedCount} orders`, syncedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('🚨 Error syncing orders:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to sync orders', error: error.message },
      { status: 500 }
    );
  }
}