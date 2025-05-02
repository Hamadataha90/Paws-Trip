import { sql } from "@vercel/postgres";
import { createHmac } from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { format } from "date-fns";

// Shopify API configuration
const SHOPIFY_API_BASE = process.env.SHOPIFY_API_BASE;
const SHOPIFY_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
};

// Handle POST request for IPN
export async function POST(req) {
  try {
    // Read request body
    const bodyText = await req.text();
    const headers = req.headers;
    const receivedHmac = headers.get("hmac");
    const secret = process.env.IPN_SECRET;

    console.log("Received IPN request");

    // Validate IPN secret
    if (!secret) {
      console.error("IPN_SECRET is not defined");
      return NextResponse.json(
        { error: "Internal server error: IPN_SECRET missing" },
        { status: 500 }
      );
    }

    // Verify HMAC signature
    const hmac = createHmac("sha512", secret).update(bodyText).digest("hex");
    if (receivedHmac !== hmac) {
      console.error("Invalid HMAC signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Parse IPN parameters
    const params = new URLSearchParams(bodyText);
    const txn_id = params.get("txn_id");
    let buyer_email = params.get("buyer_email");
    const status = parseInt(params.get("status"));
    const status_text = params.get("status_text");
    const amount = params.get("amount1");
    const currency = params.get("currency1");

    console.log("IPN Data:", { txn_id, status, status_text, amount, currency });

    // Validate transaction ID
    if (!txn_id) {
      console.error("Missing txn_id in IPN");
      return NextResponse.json({ error: "Missing txn_id" }, { status: 400 });
    }

    // Fetch customer email from database if not provided
    if (!buyer_email) {
      const emailResult = await sql`
        SELECT customer_email FROM orders WHERE txn_id = ${txn_id};
      `;
      buyer_email = emailResult.rows[0]?.customer_email || null;
      console.log(`Fetched customer_email from database: ${buyer_email}`);
    }

    // Process order and send email only if payment is completed
    if (status >= 100 || status === 2) {
      console.log(`Payment completed for order ${txn_id}. Processing order and sending email.`);

      // Update order status to Completed
      const updateResult = await sql`
        UPDATE orders
        SET status = 'Completed'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
        RETURNING id, customer_name, customer_email, customer_address, customer_city, 
                 customer_postal_code, customer_country, customer_phone, txn_id, order_date;
      `;
      const updatedOrder = updateResult.rows[0];

      // Check if order exists and was in Pending status
      if (!updatedOrder) {
        console.error(`No order found for txn_id: ${txn_id} or status not Pending`);
        return NextResponse.json(
          { error: `No order found for txn_id: ${txn_id}` },
          { status: 404 }
        );
      }

      console.log(`Order ${txn_id} marked as Completed. Order ID: ${updatedOrder.id}`);

      // Fetch order items
      const itemsResult = await sql`
        SELECT variant_id, product_name, varientName, quantity, total_price, sku 
        FROM order_items 
        WHERE order_id = ${updatedOrder.id};
      `;
      const items = itemsResult.rows;

      // Validate order items
      if (!items.length) {
        console.error(`No items found for order ${updatedOrder.id}`);
        return NextResponse.json(
          { error: `No items for order ${updatedOrder.id}` },
          { status: 400 }
        );
      }

      console.log("Order items:", items);

      // Validate variant_id for items
      const invalidItems = items.filter((item) => !item.variant_id);
      if (invalidItems.length) {
        console.error(`Invalid variant_id for items in order ${updatedOrder.id}`, invalidItems);
        return NextResponse.json(
          { error: `Invalid variant_id for order ${updatedOrder.id}` },
          { status: 400 }
        );
      }

      // Prepare line items for Shopify
      const line_items = items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: (item.total_price / item.quantity).toFixed(2),
        sku: item.sku || "",
        title: item.product_name || "Unknown Product",
        variant_title: item.varientName || "Unknown"
      }));

      // Prepare Shopify order payload
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
          total_price: items
            .reduce((sum, item) => sum + parseFloat(item.total_price), 0)
            .toFixed(2),
          financial_status: "paid",
          fulfillment_status: null,
          source_name: "web",
          note: `Order synced from custom checkout. Txn ID: ${txn_id}`
        }
      };

      console.log("Shopify Order Payload:", JSON.stringify(shopifyOrder, null, 2));

      // Validate Shopify configuration
      if (!process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
        console.error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not defined");
        return NextResponse.json(
          { error: "Shopify configuration error: Missing token" },
          { status: 500 }
        );
      }
      if (!SHOPIFY_API_BASE) {
        console.error("SHOPIFY_API_BASE is not defined");
        return NextResponse.json(
          { error: "Shopify configuration error: Missing API base" },
          { status: 500 }
        );
      }

      // Send order to Shopify
      const response = await fetch(`${SHOPIFY_API_BASE}/orders.json`, {
        method: "POST",
        headers: SHOPIFY_HEADERS,
        body: JSON.stringify(shopifyOrder),
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error(`Failed to sync order ${updatedOrder.id}: ${response.status} - ${responseText}`);
        return NextResponse.json(
          { error: `Failed to sync order: ${response.status} - ${responseText}` },
          { status: 500 }
        );
      }

      const shopifyData = JSON.parse(responseText);
      const shopifyOrderId = shopifyData.order?.id;

      // Validate Shopify order ID
      if (!shopifyOrderId) {
        console.error(`No shopify_order_id returned for order ${updatedOrder.id}`);
        return NextResponse.json(
          { error: "No Shopify order ID returned" },
          { status: 500 }
        );
      }

      console.log(`Order ${txn_id} synced to Shopify with ID ${shopifyOrderId}`);

      // Update database with Shopify sync details
      await sql`
        UPDATE orders 
        SET shopify_synced = TRUE, 
            shopify_order_id = ${shopifyOrderId}, 
            fulfillment_status = 'ready_to_ship'
        WHERE id = ${updatedOrder.id};
      `;

      // Send email only if payment is completed and email is available
      if (buyer_email) {
        console.log(`Preparing to send payment confirmation email to ${buyer_email}`);
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // Prepare HTML email template
        const totalPrice = items
          .reduce((sum, item) => sum + parseFloat(item.total_price), 0)
          .toFixed(2);
        const orderDate = format(new Date(updatedOrder.order_date), 'MMMM dd, yyyy');

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: buyer_email,
          subject: `Order Confirmation - #${txn_id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2c3e50; font-size: 24px; margin: 0;">Thank You for Your Order!</h1>
                <p style="color: #7f8c8d; font-size: 14px;">Your payment has been successfully processed.</p>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #2c3e50; margin-top: 0;">Order Summary</h2>
                <p><strong>Order Number:</strong> ${txn_id}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Total:</strong> ${currency} ${totalPrice}</p>
              </div>
              <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #2c3e50;">Order Items</h2>
                <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: #2c3e50; color: #fff;">
                      <th style="padding: 10px; text-align: left; font-size: 14px;">Product</th>
                      <th style="padding: 10px; text-align: center; font-size: 14px;">Quantity</th>
                      <th style="padding: 10px; text-align: right; font-size: 14px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .map(
                        (item) => `
                          <tr style="border-bottom: 1px solid #e9ecef;">
                            <td style="padding: 10px;">
                              <strong>${item.product_name || 'Unknown Product'}</strong>
                              ${item.varientName ? `<br><small>Variant: ${item.varientName}</small>` : ''}
                              ${item.sku ? `<br><small>SKU: ${item.sku}</small>` : ''}
                            </td>
                            <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                            <td style="padding: 10px; text-align: right;">${currency} ${parseFloat(item.total_price).toFixed(2)}</td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                      <td style="padding: 10px; text-align: right; font-weight: bold;">${currency} ${totalPrice}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="font-size: 18px; color: #2c3e50; margin-top: 0;">Customer Information</h2>
                <p><strong>Name:</strong> ${updatedOrder.customer_name || 'Unknown'}</p>
                <p><strong>Email:</strong> ${updatedOrder.customer_email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${updatedOrder.customer_phone ? `+${updatedOrder.customer_phone}` : 'N/A'}</p>
                <p><strong>Shipping Address:</strong><br>
                  ${updatedOrder.customer_address || 'N/A'},<br>
                  ${updatedOrder.customer_city || 'N/A'}, ${updatedOrder.customer_postal_code || 'N/A'},<br>
                  ${updatedOrder.customer_country || 'N/A'}
                </p>
              </div>
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p style="color: #7f8c8d; font-size: 12px;">Thank you for shopping with us!</p>
                <p style="color: #7f8c8d; font-size: 12px;">If you have any questions, contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #3498db;">${process.env.EMAIL_USER}</a>.</p>
              </div>
            </div>
          `,
        };

        // Send email
        try {
          await transporter.sendMail(mailOptions);
          console.log(`Payment confirmation email sent successfully to ${buyer_email}`);
        } catch (error) {
          console.error(`Error sending email to ${buyer_email}:`, error.message);
        }
      } else {
        console.warn(`No email available for order ${txn_id}, skipping email`);
      }
    } else if (status === -1) {
      // Update order status to Cancelled, no email sent
      await sql`
        UPDATE orders
        SET status = 'Cancelled'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
      `;
      console.log(`Order ${txn_id} marked as Cancelled. No email sent.`);
    } else {
      // Payment is pending, no email sent
      console.log(`Payment for order ${txn_id} is pending (status: ${status}). No email sent.`);
    }

    // Return success response
    return NextResponse.json(
      { message: "IPN received and processed" },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error("Error in IPN handler:", error.message);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}