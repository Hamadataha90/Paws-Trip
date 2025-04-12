import { sql } from '@vercel/postgres';

async function insertOrder(item, shippingInfo, currency, txn_id, status) {
  const price = parseFloat(item.price);
  const quantity = parseInt(item.quantity, 10);
  const total_price = price * quantity;

  if (isNaN(price) || isNaN(quantity)) {
    console.error(`Invalid price or quantity for product: ${item.title}`);
    return false;
  }

  await sql`
    INSERT INTO "public"."orders" (
      variant_id,
      product_name,
      currency,
      price,
      quantity,
      total_price,
      color,
      customer_name,
      customer_email,
      customer_address,
      customer_city,
      customer_postal_code,
      customer_country,
      customer_phone,
      txn_id,
      status
    )
    VALUES (
      ${item.id},
      ${item.title},
      ${currency},
      ${price},
      ${quantity},
      ${total_price},
      ${item.color},
      ${shippingInfo.name},
      ${shippingInfo.email},
      ${shippingInfo.address},
      ${shippingInfo.city},
      ${shippingInfo.postalCode},
      ${shippingInfo.country},
      ${shippingInfo.phone},
      ${txn_id},
      ${status}
    );
  `;
  return true;
}

export async function POST(req) {
  try {
    const { cartItems, shippingInfo, totalPrice, selectedCurrency, txn_id, status } = await req.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Cart items are required and must be an array' }),
        { status: 400 }
      );
    }
    if (!shippingInfo || typeof shippingInfo !== 'object') {
      return new Response(
        JSON.stringify({ success: false, message: 'Shipping info is required' }),
        { status: 400 }
      );
    }

    let currency = String(selectedCurrency || 'USD');
    if (!currency || currency.trim() === '') {
      console.warn('Currency is empty, defaulting to USD');
      currency = 'USD';
    }

    const orderStatus = status || 'Pending';

    let successfulInserts = 0;

    for (const item of cartItems) {
      const inserted = await insertOrder(item, shippingInfo, currency, txn_id, orderStatus);
      if (inserted) {
        successfulInserts++;
      }
    }

    if (successfulInserts === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No valid items were inserted' }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order processed successfully',
        insertedCount: successfulInserts,
        totalItems: cartItems.length,
        txn_id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error inserting order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process order',
        error: error.message || 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
