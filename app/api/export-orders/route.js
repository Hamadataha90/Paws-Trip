import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { parse } from "json2csv";

export async function POST(req) {
  try {
    // استلام البيانات من الفورم
    const formData = await req.formData();
    const { email, txn_id } = Object.fromEntries(formData);

    // بناء الكويري والباراميترز
    let query = `
      SELECT 
        o.txn_id, 
        o.order_date, 
        o.status, 
        o.currency, 
        o.customer_name, 
        o.customer_email,
        o.customer_address, 
        o.customer_city, 
        o.customer_postal_code, 
        o.customer_country,
        '+' || o.customer_phone as customer_phone, -- إضافة علامة + للهاتف
        o.shopify_synced,
        o.shopify_order_id,
        o.fulfillment_status, 
        o.tracking_number, 
        COALESCE(SUM(oi.customer_paid), 0) as total_price,
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

    query += ` GROUP BY o.id ORDER BY o.order_date DESC`;

    // تنفيذ الكويري
    const { rows } = await sql.query(query, params);

    // تحديد الحقول المطلوبة للـ CSV
    const fields = [
      "txn_id",
      "order_date",
      "status",
      "currency",
      "customer_name",
      "customer_email",
      "customer_address",
      "customer_city",
      "customer_postal_code",
      "customer_country",
      "customer_phone",
      "fulfillment_status",
      "tracking_number",
      "total_price",
      "items"
    ];

    // تحويل النتائج إلى CSV مع BOM للتوافق مع Excel
    const csv = '\uFEFF' + parse(rows, { fields });

    // إرجاع الملف كـ download
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=orders.csv",
      },
    });

  } catch (error) {
    console.error("CSV Export Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
