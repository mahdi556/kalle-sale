import { db } from "../../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const [rows] = await db.query(
      `SELECT v.id AS visit_id, v.note, v.has_invoice, v.next_tour,
              s.id AS store_id, s.name AS store_name, r.name AS route_name
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       JOIN routes r ON s.route_id = r.id
       WHERE v.visit_date = ?
       ORDER BY r.name, s.name`,
      [date]
    );

    const stores = [];

    for (const v of rows) {
      let invoices = [];

      if (v.has_invoice) {
        const [items] = await db.query(
          `SELECT ii.quantity, p.code AS product_code, p.name AS product_name, 
                  p.weight, p.price
           FROM invoice_items ii
           JOIN products p ON ii.product_id = p.id
           JOIN invoices i ON ii.invoice_id = i.id
           WHERE i.visit_id = ?`,
          [v.visit_id]
        );
        invoices = items;
      }

      stores.push({
        store_id: v.store_id,
        store_name: v.store_name,
        route_name: v.route_name,
        note: v.note,
        next_tour: v.next_tour,
        invoices,
      });
    }

    return new Response(JSON.stringify({ ok: true, stores }));
  } catch (err) {
    console.error("❌ Error fetching report:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
    });
  }
}
