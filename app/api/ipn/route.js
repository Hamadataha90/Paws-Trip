import { sql } from '@vercel/postgres';
import { createHmac } from 'crypto';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const SHOPIFY_API_BASE = 'https://humidityzone.myshopify.com/admin/api/2023-10';
const SHOPIFY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
};

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const headers = req.headers;
    const receivedHmac = headers.get('hmac');
    const secret = process.env.IPN_SECRET;

    if (!secret) {
      console.error('❌ IPN_SECRET is not defined.');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const hmac = createHmac('sha512', secret).update(bodyText).digest('hex');

    if (receivedHmac !== hmac) {
      console.error('❌ Invalid HMAC signature. IPN rejected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const params = new URLSearchParams(bodyText);
    const txn_id = params.get('txn_id');
    const buyer_email = params.get('buyer_email');
    const status = parseInt(params.get('status'));
    const status_text = params.get('status_text');
    const amount = params.get('amount1');
    const currency = params.get('currency1');

    console.log('📬 IPN Received:', {
      txn_id,
      status,
      status_text,
      amount,
      currency,
    });

    // تحديث قاعدة البيانات
    if (status >= 100 || status === 2) {
      // تحديث status لـ Completed
      const updateResult = await sql`
        UPDATE orders
        SET status = 'Completed'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
        RETURNING *;
      `;
      const updatedOrder = updateResult.rows[0];

      if (!updatedOrder) {
        console.error(`❌ No order found for txn_id: ${txn_id}`);
        return NextResponse.json({ message: 'No order to sync.' }, { status: 200 });
      }

      console.log(`✅ Order ${txn_id} marked as Completed. Order ID: ${updatedOrder.id}`);

      // جلب الـ order_items
      const itemsResult = await sql`
        SELECT variant_id, product_name, quantity, total_price, sku 
        FROM order_items 
        WHERE order_id = ${updatedOrder.id};
      `;
      const items = itemsResult.rows;

      if (!items.length) {
        console.error(`❌ No items for order ${updatedOrder.id}`);
        return NextResponse.json({ message: 'No items to sync.' }, { status: 200 });
      }

      console.log('🛒 Order items:', items);

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
            first_name: updatedOrder.customer_name?.split(' ')[0] || 'Unknown',
            last_name: updatedOrder.customer_name?.split(' ').slice(1).join(' ') || '',
            email: updatedOrder.customer_email || 'no-email@example.com'
          },
          billing_address: {
            address1: updatedOrder.customer_address || 'Unknown',
            city: updatedOrder.customer_city || 'Unknown',
            zip: updatedOrder.customer_postal_code || '00000',
            country: updatedOrder.customer_country || 'Unknown',
            phone: updatedOrder.customer_phone || ''
          },
          shipping_address: {
            address1: updatedOrder.customer_address || 'Unknown',
            city: updatedOrder.customer_city || 'Unknown',
            zip: updatedOrder.customer_postal_code || '00000',
            country: updatedOrder.customer_country || 'Unknown',
            phone: updatedOrder.customer_phone || ''
          },
          line_items,
          total_price: items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2),
          financial_status: 'paid',
          fulfillment_status: null,
          source_name: 'web',
          note: `Order synced from custom checkout. Txn ID: ${txn_id}`
        }
      };

      console.log('📤 Sending to Shopify:', JSON.stringify(shopifyOrder, null, 2));

      // التحقق من التوكن
      if (!process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
        console.error('❌ SHOPIFY_ADMIN_API_ACCESS_TOKEN is not defined.');
        return NextResponse.json({ error: 'Shopify configuration error' }, { status: 500 });
      }

      // إرسال الأوردر لـ Shopify
      const response = await fetch(`${SHOPIFY_API_BASE}/orders.json`, {
        method: 'POST',
        headers: SHOPIFY_HEADERS,
        body: JSON.stringify(shopifyOrder)
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error(`❌ Failed to sync order ${updatedOrder.id}: ${response.status} - ${responseText}`);
        return NextResponse.json({ message: `Failed to sync order: ${responseText}` }, { status: 200 });
      }

      const shopifyData = JSON.parse(responseText);
      const shopifyOrderId = shopifyData.order.id;

      console.log(`✅ Order ${txn_id} synced to Shopify with ID ${shopifyOrderId}`);

      // تحديث shopify_order_id و shopify_synced
      await sql`
        UPDATE orders 
        SET shopify_synced = TRUE, 
            shopify_order_id = ${shopifyOrderId}, 
            fulfillment_status = 'ready_to_ship'
        WHERE id = ${updatedOrder.id};
      `;

    } else if (status === -1) {
      await sql`
        UPDATE orders
        SET status = 'Cancelled'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
      `;
      console.log(`❌ Order ${txn_id} marked as Cancelled.`);
    } else {
      console.log(`⏳ Payment for order ${txn_id} still pending (status: ${status}).`);
    }

    // إرسال إيميل
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: buyer_email,
      subject: status >= 100 ? 'Payment Confirmation' : 'Payment Status Update',
      text: status >= 100
        ? `Your payment with transaction ID ${txn_id} has been successfully processed.`
        : `Your payment with transaction ID ${txn_id} was not completed. Status: ${status}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully.');
    } catch (error) {
      console.error('📧 Error sending email:', error.message);
    }

    return NextResponse.json({ message: 'IPN received and processed.' }, { status: 200 });
  } catch (error) {
    console.error('🚨 Error in IPN handler:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}