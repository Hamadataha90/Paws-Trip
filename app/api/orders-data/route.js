import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "";
    const txnId = searchParams.get("txn_id") || "";
    const sort = searchParams.get("sort") || "desc";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 10;

    let ordersQuery = `
      SELECT o.*, 
             COALESCE(SUM(oi.total_price) * 2, 0) as total_price,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];
    if (email) {
      ordersQuery += ` AND o.customer_email = $${params.length + 1}`;
      params.push(email);
    }
    if (txnId) {
      ordersQuery += ` AND o.txn_id = $${params.length + 1}`;
      params.push(txnId);
    }
    ordersQuery += ` GROUP BY o.id ORDER BY o.order_date ${sort === "asc" ? "ASC" : "DESC"}`;
    ordersQuery += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const { rows: orders } = await sql.query(ordersQuery, params);
    const { rows: [{ count }] } = await sql.query(
      `SELECT COUNT(*) as count FROM orders WHERE 1=1 ${email ? "AND customer_email = $1" : ""} ${txnId ? "AND txn_id = $2" : ""}`,
      params
    );

    return NextResponse.json({
      orders,
      total: count,
      page,
      limit
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}