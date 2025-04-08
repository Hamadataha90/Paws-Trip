import { sql } from '@vercel/postgres';

export async function POST(req) {
  try {
    const { cartItems, shippingInfo, totalPrice } = await req.json();

    // إضافة رسائل التصحيح
    console.log("Received cartItems:", cartItems);
    console.log("Received shippingInfo:", shippingInfo);
    console.log("Received totalPrice:", totalPrice);

    // إضافة البيانات إلى قاعدة البيانات
    for (const item of cartItems) {
      console.log(`Inserting order for product: ${item.title}, price: ${item.price}`);

      await sql`
  INSERT INTO "public"."orders" (
    variant_id,
    product_name,
    price,
    quantity,
    color,
    customer_name,
    customer_email,
    customer_address,
    customer_city,
    customer_postal_code,
    customer_country,
    customer_phone,
    total_price,
    status
  )
  VALUES (
    ${item.id},
    ${item.title},
    ${item.price},
    ${item.quantity},
    ${item.color},
    ${shippingInfo.name},
    ${shippingInfo.email},
    ${shippingInfo.address},
    ${shippingInfo.city},
    ${shippingInfo.postalCode},
    ${shippingInfo.country},
    ${shippingInfo.phone},
    ${item.price * item.quantity},
    'Pending'
  );
`;

    
      console.log(`Order for ${item.title} inserted successfully.`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Order processed successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error inserting order:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to process order' }),
      { status: 500 }
    );
  }
}
