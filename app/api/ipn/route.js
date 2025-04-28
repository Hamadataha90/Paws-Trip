import { sql } from "@vercel/postgres";
import { createHmac } from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const SHOPIFY_API_BASE = process.env.SHOPIFY_API_BASE ;
const SHOPIFY_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
  "Cache-Control": "no-cache",
};

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const receivedHmac = req.headers.get("hmac");
    const secret = process.env.IPN_SECRET;

    if (!secret) {
      console.error("❌ IPN_SECRET is not defined");
      return NextResponse.json({ error: "IPN_SECRET missing" }, { status: 500 });
    }

    const hmac = createHmac("sha512", secret).update(bodyText).digest("hex");
    if (receivedHmac !== hmac) {
      console.error("❌ Invalid HMAC signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const params = new URLSearchParams(bodyText);
    const txn_id = params.get("txn_id");
    let buyer_email = params.get("buyer_email");
    const status = parseInt(params.get("status"));

    if (!txn_id) {
      console.error("❌ Missing txn_id in IPN");
      return NextResponse.json({ error: "Missing txn_id" }, { status: 400 });
    }

    if (!buyer_email) {
      const emailResult = await sql`
        SELECT customer_email FROM orders WHERE txn_id = ${txn_id};
      `;
      buyer_email = emailResult.rows[0]?.customer_email || null;
    }

    if (status >= 100 || status === 2) {
      const updateResult = await sql`
        UPDATE orders
        SET status = 'Completed'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
        RETURNING id, customer_name, customer_email, customer_address, customer_city, 
                 customer_postal_code, customer_country, customer_phone, txn_id;
      `;
      const updatedOrder = updateResult.rows[0];

      if (!updatedOrder) {
        console.error(`❌ No order found for txn_id: ${txn_id}`);
        return NextResponse.json({ error: `No order found for txn_id: ${txn_id}` }, { status: 404 });
      }

      const itemsResult = await sql`
        SELECT variant_id, product_name, varientName, quantity, total_price, sku 
        FROM order_items 
        WHERE order_id = ${updatedOrder.id};
      `;
      const items = itemsResult.rows;

      if (!items.length) {
        console.error(`❌ No items found for order ${updatedOrder.id}`);
        return NextResponse.json({ error: `No items for order ${updatedOrder.id}` }, { status: 400 });
      }

      const invalidItems = items.filter((item) => !item.variant_id);
      if (invalidItems.length) {
        console.error(`❌ Invalid variant_id for order ${updatedOrder.id}`);
        return NextResponse.json({ error: `Invalid variant_id for order ${updatedOrder.id}` }, { status: 400 });
      }

      for (const item of items) {
        const variantResponse = await fetch(
          `${SHOPIFY_API_BASE}/variants/${item.variant_id}.json`,
          { headers: SHOPIFY_HEADERS }
        );
        if (!variantResponse.ok) {
          console.error(`❌ Variant ${item.variant_id} not found: ${variantResponse.status}`);
          return NextResponse.json({ error: `Invalid variant_id ${item.variant_id}` }, { status: 400 });
        }
      }

      const line_items = items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: (item.total_price / item.quantity).toFixed(2),
      }));

      const shopifyOrder = {
        order: {
          customer: {
            first_name: updatedOrder.customer_name?.split(" ")[0] || "Unknown",
            last_name: updatedOrder.customer_name?.split(" ").slice(1).join(" ") || "",
            email: updatedOrder.customer_email || "no-email@example.com",
            phone: updatedOrder.customer_phone ? `+${updatedOrder.customer_phone}` : ""
          },
          billing_address: {
            address1: updatedOrder.customer_address || "Unknown",
            city: updatedOrder.customer_city || "Unknown",
            zip: updatedOrder.customer_postal_code || "00000",
            country: updatedOrder.customer_country || "Unknown",
            phone: updatedOrder.customer_phone ? `+${updatedOrder.customer_phone}` : ""
          },
          shipping_address: {
            address1: updatedOrder.customer_address || "Unknown",
            city: updatedOrder.customer_city || "Unknown",
            zip: updatedOrder.customer_postal_code || "00000",
            country: updatedOrder.customer_country || "Unknown",
            phone: updatedOrder.customer_phone ? `+${updatedOrder.customer_phone}` : ""
          },
          line_items,
          total_price: items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2),
          financial_status: "paid",
          fulfillment_status: null,
          source_name: "web",
          note: `Order synced from custom checkout. Txn ID: ${txn_id}`
        }
      };

      const simplifiedOrder = {
        order: {
          line_items,
          customer: { email: updatedOrder.customer_email || "no-email@example.com" },
          financial_status: "paid",
          total_price: items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2),
        }
      };

      const minimalOrder = {
        order: {
          line_items,
          financial_status: "paid",
          total_price: items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2),
        }
      };

      if (!process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || !SHOPIFY_API_BASE) {
        console.error("❌ Shopify configuration missing");
        return NextResponse.json({ error: "Shopify configuration error" }, { status: 500 });
      }

      const payloads = [shopifyOrder, simplifiedOrder, minimalOrder];
      let shopifyData;
      let responseText;

      for (let i = 0; i < payloads.length; i++) {
        const fetchOptions = {
          method: "POST",
          headers: SHOPIFY_HEADERS,
          body: JSON.stringify(payloads[i]),
        };
        const response = await fetch(`${SHOPIFY_API_BASE}/orders.json`, fetchOptions);
        responseText = await response.text();

        if (response.ok && !responseText.includes('"orders":[]')) {
          shopifyData = JSON.parse(responseText);
          break;
        }
        console.error(`❌ Payload attempt ${i + 1} failed: ${response.status} - ${responseText}`);
      }

      const shopifyOrderId = shopifyData?.order?.id;
      if (!shopifyOrderId) {
        console.error(`❌ No Shopify order ID returned: ${responseText}`);
        return NextResponse.json({ error: `Failed to sync order: ${responseText}` }, { status: 500 });
      }

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
    }

    if (buyer_email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: buyer_email,
        subject: status >= 100 ? "Payment Confirmation" : "Payment Status Update",
        text: status >= 100
          ? `Your payment with transaction ID ${txn_id} has been successfully processed.`
          : `Your payment with transaction ID ${txn_id} is still pending.`,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ message: "IPN processed" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error in IPN handler:", error.message);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}