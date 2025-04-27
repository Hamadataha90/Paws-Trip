import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

const SHOPIFY_API_BASE = process.env.SHOPIFY_API_BASE;
const SHOPIFY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
};

export async function POST() {
  try {
    console.log('📋 Starting Shopify sync');

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

    let syncedCount = 0;
    const preparedOrders = [];

    for (const order of orders) {
      console.log(`🛠 Processing order ${order.id} (txn_id: ${order.txn_id})`);

      // جلب الـ order_items
      const itemsResult = await sql`
        SELECT variant_id, product_name, varientName, quantity, total_price, sku 
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
        sku: item.sku || '',
        title: item.product_name || 'Unknown Product',
        variant_title: item.varientName || 'Unknown'
      }));

      // إعداد الأوردر لـ Shopify
      const shopifyOrder = {
        order: {
          email: order.customer_email || 'no-email@example.com',
          send_receipt: true,
          customer: {
            first_name: order.customer_name?.split(' ')[0] || 'Unknown',
            last_name: order.customer_name?.split(' ').slice(1).join(' ') || '',
            email: order.customer_email || 'no-email@example.com',
            phone: order.customer_phone || ''
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
          note: `Order synced from custom checkout. Txn ID: +${order.txn_id}`
        }
      };

      console.log(`📤 Prepared Shopify order for ${order.id}:`, JSON.stringify(shopifyOrder, null, 2));

      // التحقق من التوكن و API base
      if (!process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
        console.error(`❌ SHOPIFY_ADMIN_API_ACCESS_TOKEN is not defined for order ${order.id}`);
        continue;
      }
      if (!SHOPIFY_API_BASE) {
        console.error(`❌ SHOPIFY_API_BASE is not defined for order ${order.id}`);
        continue;
      }

      // إرسال الأوردر لـ Shopify
      console.log(`🚀 Sending order ${order.id} to Shopify`);
      const response = await fetch(`${SHOPIFY_API_BASE}/orders.json`, {
        method: 'POST',
        headers: SHOPIFY_HEADERS,
        body: JSON.stringify(shopifyOrder)
      });

      const responseText = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log(`📥 Shopify response for order ${order.id}: Status ${response.status}, Headers:`, responseHeaders, `Body: ${responseText}`);

      if (!response.ok) {
        console.error(`❌ Failed to sync order ${order.id}: ${response.status} - ${responseText}`);
        continue;
      }

      let shopifyData;
      try {
        shopifyData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ Failed to parse Shopify response for order ${order.id}: ${parseError.message}`);
        continue;
      }

      const shopifyOrderId = shopifyData.order?.id;
      if (!shopifyOrderId) {
        console.error(`❌ No shopify_order_id returned for order ${order.id}. Response:`, responseText);
        continue;
      }

      // تحديث الداتابيز
      await sql`
        UPDATE orders 
        SET shopify_synced = TRUE, 
            shopify_order_id = ${shopifyOrderId}, 
            fulfillment_status = 'ready_to_ship'
        WHERE id = ${order.id};
      `;

      console.log(`✅ Order ${order.id} synced to Shopify with ID ${shopifyOrderId}`);
      syncedCount++;
      preparedOrders.push({ id: order.id, shopifyOrderId });
    }

    console.log(`🎉 Synced ${syncedCount} orders successfully`);
    return NextResponse.json(
      { success: true, message: `Synced ${syncedCount} orders`, preparedOrders },
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