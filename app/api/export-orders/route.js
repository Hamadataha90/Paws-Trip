import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { parse } from "json2csv";

export async function POST(req) {
  try {
    const { email, txn_id } = await req.formData().then(form => Object.fromEntries(form));
    let query = `
      SELECT o.txn_id, o.order_date, o.status, o.currency, o.customer_name, o.customer_email,
             o.customer_address, o.customer_city, o.customer_postal_code, o.customer_country,
             o.customer_phone, o.shopify_synced, o.shopify_order_id, o.fulfillment_status,
             o.tracking_number, COALESCE(SUM(oi.total_price) * 2, 0) as total_price,
             STRING_AGG(oi.product_name || ' (' || oi.varientname || ', Qty: ' || oi.quantity || ')', '; ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];
    if (email) {
      query += ` AND o.customer_email = $${params.length + 1}`;
      params.push(email);
    }
    if (txn_id) {
      query += ` AND o.txn_id = $${params.length + 1}`;
      params.push(txn_id);
    }
    query += ` GROUP BY o.id`;
    const { rows } = await sql.query(query, params);
    const csv = parse(rows, {
      fields: [
        "txn_id", "order_date", "status", "currency", "customer_name", "customer_email",
        "customer_address", "customer_city", "customer_postal_code", "customer_country",
        "customer_phone", "shopify_synced", "shopify_order_id", "fulfillment_status",
        "tracking_number", "total_price", "items"
      ]
    });
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=orders.csv",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}