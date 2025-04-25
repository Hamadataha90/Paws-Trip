import { sql } from "@vercel/postgres";

async function insertOrder(orderId, item, discountRate = 0) {
  const price = parseFloat(item.price);
  const quantity = parseInt(item.quantity, 10);
  const total_price = ((price * quantity) / 2).toFixed(2); // السعر الأصلي بدون خصم
  const customer_paid = (price * quantity * (1 - discountRate)).toFixed(2); // السعر المضروب بعد الخصم

  if (isNaN(price) || isNaN(quantity)) {
    console.error(`Invalid price or quantity for product: ${item.title}`);
    return false;
  }

  try {
    await sql`
      INSERT INTO order_items (
        order_id,
        variant_id,
        varientName,
        product_name,
        price,
        quantity,
        discount_rate,
        total_price,
        customer_paid,
        color,
        sku
      )
      VALUES (
        ${orderId},
        ${item.id},
        ${item.varientName || null},
        ${item.title},
        ${price},
        ${quantity},
        ${discountRate},
        ${total_price},
        ${customer_paid},
        ${item.color || null},
        ${item.sku || null}
      );
    `;
    return true;
  } catch (error) {
    console.error(`Error inserting item ${item.title}:`, error);
    return false;
  }
}

export async function POST(req) {
  try {
    const {
      cartItems,
      shippingInfo,
      selectedCurrency,
      txn_id,
      status,
      discountRate,
    } = await req.json();

    // التحقق من المدخلات
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Cart items are required and must be an array",
        }),
        { status: 400 }
      );
    }
    if (!shippingInfo || typeof shippingInfo !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Shipping info is required",
        }),
        { status: 400 }
      );
    }
    if (!txn_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Transaction ID is required",
        }),
        { status: 400 }
      );
    }

    console.log("Received cartItems:", cartItems);
    console.log("Received shippingInfo:", shippingInfo);
    console.log("Received selectedCurrency:", selectedCurrency);
    console.log("Received txn_id:", txn_id);
    console.log("Received status:", status);
    console.log("Received discountRate:", discountRate);

    // تحديد العملة والحالة
    let currency = String(selectedCurrency || "USD");
    if (!currency || currency.trim() === "") {
      console.warn("Currency is empty, defaulting to USD");
      currency = "USD";
    }
    const orderStatus = status || "Pending";

    // إنشاء أوردر جديد في orders
    const orderResult = await sql`
      INSERT INTO orders (
        status,
        txn_id,
        currency,
        customer_name,
        customer_email,
        customer_address,
        customer_city,
        customer_postal_code,
        customer_country,
        customer_phone
      )
      VALUES (
        ${orderStatus},
        ${txn_id},
        ${currency},
        ${shippingInfo.name || null},
        ${shippingInfo.email || null},
        ${shippingInfo.address || null},
        ${shippingInfo.city || null},
        ${shippingInfo.postalCode || null},
        ${shippingInfo.country || null},
        ${shippingInfo.phone || null}
      )
      RETURNING id;
    `;

    const orderId = orderResult.rows[0].id;
    console.log(`Created order with ID: ${orderId}`);

    // إضافة المنتجات في order_items
    let successfulInserts = 0;
    for (const item of cartItems) {
      console.log(`Inserting item: ${item.title}, price: ${item.price}`);
      const inserted = await insertOrder(orderId, item, discountRate);
      if (inserted) {
        successfulInserts++;
        console.log(`Item ${item.title} inserted successfully.`);
      }
    }

    if (successfulInserts === 0) {
      // لو ما نجحناش نضيف ولا منتج، نمسح الأوردر
      await sql`DELETE FROM orders WHERE id = ${orderId};`;
      return new Response(
        JSON.stringify({
          success: false,
          message: "No valid items were inserted",
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order processed successfully",
        orderId,
        insertedCount: successfulInserts,
        totalItems: cartItems.length,
        txn_id,
        discountRate,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing order:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to process order",
        error: error.message || "Unknown error",
      }),
      { status: 500 }
    );
  }
}
