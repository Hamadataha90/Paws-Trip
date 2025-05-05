import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get('number');

  if (!trackingNumber) {
    return new Response(
      JSON.stringify({ error: 'Tracking number is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: { tracking_number: trackingNumber },
    });

    if (!order || !order.shopify_order_id) {
      return new Response(
        JSON.stringify({ error: 'No tracking information available.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const shopifyUrl = `${process.env.SHOPIFY_API_BASE}/orders/${order.shopify_order_id}/fulfillment_orders.json`;
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    // تحقق مما إذا كانت الاستجابة صحيحة (200)
    if (!response.ok) {
      throw new Error(`Failed to fetch from Shopify. Status: ${response.status}`);
    }

    // تحقق مما إذا كانت الاستجابة بصيغة JSON
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Received non-JSON response from Shopify');
    }

    const data = await response.json();
    const fulfillmentOrder = data.fulfillment_orders?.[0];

    if (!fulfillmentOrder) {
      return new Response(
        JSON.stringify({ error: 'No fulfillment data available.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trackingInfo = fulfillmentOrder.fulfillments?.[0]?.tracking_info || {};
    const trackingEvents = fulfillmentOrder.tracking_events || [];

    const formattedEvents = trackingEvents.map((event) => ({
      status: event.status || 'unknown',
      date: event.created_at,
      location: event.location || null,
    }));

    const trackingData = {
      tracking_number: trackingInfo.tracking_number || order.tracking_number,
      carrier: trackingInfo.company || null,
      tracking_url: trackingInfo.url || null,
      events: formattedEvents,
    };

    return new Response(JSON.stringify(trackingData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // هنا نعرض رسائل خطأ أفضل
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
