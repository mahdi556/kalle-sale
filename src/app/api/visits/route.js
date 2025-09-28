import { db } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { storeId, visited, nextTour, note, has_invoice } = await req.json();

    // آیا بازدید امروز ثبت شده؟
    const [existing] = await db.query(
      "SELECT id FROM visits WHERE store_id = ? AND visit_date = CURDATE()",
      [storeId]
    );

    let visitId;

    if (visited) {
      if (existing.length === 0) {
        // ثبت بازدید جدید
        const result = await db.query(
          `INSERT INTO visits (store_id, visit_date, has_invoice, next_tour, note)
           VALUES (?, CURDATE(), ?, ?, ?)`,
          [storeId, has_invoice ? true : false, nextTour || false, note || null]
        );
        visitId = result[0].insertId; // شناسه بازدید جدید
      } else {
        // به‌روزرسانی بازدید موجود
        await db.query(
          `UPDATE visits 
           SET next_tour = ?, note = ?, has_invoice = ?
           WHERE id = ?`,
          [nextTour || false, note || null, has_invoice ? true : existing[0].has_invoice, existing[0].id]
        );
        visitId = existing[0].id;
      }
    } else {
      // لغو بازدید = حذف
      if (existing.length > 0) {
        await db.query("DELETE FROM visits WHERE id = ?", [existing[0].id]);
        visitId = null;
      }
    }

    return new Response(JSON.stringify({ ok: true, visitId }), { status: 200 });
  } catch (err) {
    console.error("❌ Error saving visit:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}
