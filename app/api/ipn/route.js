import { sql } from "@vercel/postgres";
import { createHmac } from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const SHOPIFY_API_BASE = process.env.SHOPIFY_API_BASE;
const SHOPIFY_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
};

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const headers = req.headers;
    const receivedHmac = headers.get("hmac");
    const secret = process.env.IPN_SECRET;

    console.log("📥 Received IPN request");

    if (!secret) {
      console.error("❌ IPN_SECRET is not defined");
      return NextResponse.json(
        { error: "Internal server error: IPN_SECRET missing" },
        { status: 500 }
      );
    }

    const hmac = createHmac("sha512", secret).update(bodyText).digest("hex");

    if (receivedHmac !== hmac) {
      console.error("❌ Invalid HMAC signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const params = new URLSearchParams(bodyText);
    const txn_id = params.get("txn_id");
    // const buyer_email = params.get("buyer_email");
    const buyer_email = params.get("email");
    const status = parseInt(params.get("status"));
    const status_text = params.get("status_text");
    const amount = params.get("amount1");
    const currency = params.get("currency1");

    console.log("📬 IPN Data:", {
      txn_id,
      status,
      status_text,
      amount,
      currency,
    });

    if (!txn_id) {
      console.error("❌ Missing txn_id in IPN");
      return NextResponse.json({ error: "Missing txn_id" }, { status: 400 });
    }

    // تحديث قاعدة البيانات
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
        console.error(
          `❌ No order found for txn_id: ${txn_id} or status not Pending`
        );
        return NextResponse.json(
          { error: `No order found for txn_id: ${txn_id}` },
          { status: 404 }
        );
      }

      console.log(
        `✅ Order ${txn_id} marked as Completed. Order ID: ${updatedOrder.id}`
      );

      // جلب الـ order_items
      const itemsResult = await sql`
        SELECT variant_id, product_name, varientName, quantity, total_price, sku 
        FROM order_items 
        WHERE order_id = ${updatedOrder.id};
      `;
      const items = itemsResult.rows;

      if (!items.length) {
        console.error(`❌ No items found for order ${updatedOrder.id}`);
        return NextResponse.json(
          { error: `No items for order ${updatedOrder.id}` },
          { status: 400 }
        );
      }

      console.log("🛒 Order items:", items);

      // التحقق من variant_id
      const invalidItems = items.filter((item) => !item.variant_id);
      if (invalidItems.length) {
        console.error(
          `❌ Invalid variant_id for items in order ${updatedOrder.id}`,
          invalidItems
        );
        return NextResponse.json(
          { error: `Invalid variant_id for order ${updatedOrder.id}` },
          { status: 400 }
        );
      }

      // إعداد line_items لـ Shopify
      const line_items = items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: (item.total_price / item.quantity).toFixed(2),
        sku: item.sku || "",
        title: item.product_name || "Unknown Product",
        variant_title: item.varientName || "Unknown"
      }));

      // إعداد الأوردر لـ Shopify
      const shopifyOrder = {
        order: {
          customer: {
            first_name: updatedOrder.customer_name?.split(" ")[0] || "Unknown",
            last_name:
              updatedOrder.customer_name?.split(" ").slice(1).join(" ") || "",
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
          total_price: items
            .reduce((sum, item) => sum + parseFloat(item.total_price), 0)
            .toFixed(2),
          financial_status: "paid",
          fulfillment_status: null,
          source_name: "web",
          note: `Order synced from custom checkout. Txn ID: ${txn_id}`
        }
      };

      console.log(
        "📤 Shopify Order Payload:",
        JSON.stringify(shopifyOrder, null, 2)
      );

      // التحقق من التوكن و API base
      if (!process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
        console.error("❌ SHOPIFY_ADMIN_API_ACCESS_TOKEN is not defined");
        return NextResponse.json(
          { error: "Shopify configuration error: Missing token" },
          { status: 500 }
        );
      }
      if (!SHOPIFY_API_BASE) {
        console.error("❌ SHOPIFY_API_BASE is not defined");
        return NextResponse.json(
          { error: "Shopify configuration error: Missing API base" },
          { status: 500 }
        );
      }

      // إرسال الأوردر لـ Shopify
      const response = await fetch(`${SHOPIFY_API_BASE}/orders.json`, {
        method: "POST",
        headers: SHOPIFY_HEADERS,
        body: JSON.stringify(shopifyOrder),
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error(
          `❌ Failed to sync order ${updatedOrder.id}: ${response.status} - ${responseText}`
        );
        return NextResponse.json(
          {
            error: `Failed to sync order: ${response.status} - ${responseText}`
          },
          { status: 500 }
        );
      }

      const shopifyData = JSON.parse(responseText);
      const shopifyOrderId = shopifyData.order?.id;

      if (!shopifyOrderId) {
        console.error(
          `❌ No shopify_order_id returned for order ${updatedOrder.id}`
        );
        return NextResponse.json(
          { error: "No Shopify order ID returned" },
          { status: 500 }
        );
      }

      console.log(
        `✅ Order ${txn_id} synced to Shopify with ID ${shopifyOrderId}`
      );

      // تحديث الداتابيز
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
      console.log(`❌ Order ${txn_id} marked as Cancelled`);
    } else {
      console.log(
        `⏳ Payment for order ${txn_id} still pending (status: ${status})`
      );
    }

    // إرسال إيميل
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
        subject:
          status >= 100 ? "Payment Confirmation" : "Payment Status Update",
        text:
          status >= 100
            ? `Your payment with transaction ID ${txn_id} has been successfully processed.`
            : `Your payment with transaction ID ${txn_id} was not completed. Status: ${status}`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("📧 Email sent successfully to", buyer_email);
      } catch (error) {
        console.error("📧 Error sending email:", error.message);
      }
    } else {
      console.warn("⚠️ No buyer_email provided, skipping email");
    }

    return NextResponse.json(
      { message: "IPN received and processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("🚨 Error in IPN handler:", error.message);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}