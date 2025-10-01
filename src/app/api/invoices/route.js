import { db } from "../../../../lib/db";
import products from "../../../products.json"; // مسیر فایل JSON

export async function POST(req) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { storeId, visitId, items, note, visitNote, nextTour = false } = await req.json();

    if (!storeId && !visitId) {
      throw new Error("شناسه فروشگاه یا بازدید معتبر نیست");
    }

    // 1️⃣ ثبت یا بروزرسانی بازدید
    let visitIdToUse = visitId;

    if (!visitIdToUse) {
      // چک اگر بازدید امروز وجود دارد
      const [existing] = await connection.query(
        "SELECT id, has_invoice FROM visits WHERE store_id = ? AND visit_date = CURDATE()",
        [storeId]
      );

      if (existing.length === 0) {
        // ثبت بازدید جدید
        const [visitResult] = await connection.query(
          `INSERT INTO visits (store_id, visit_date, has_invoice, next_tour, note)
           VALUES (?, CURDATE(), ${items?.length > 0 ? true : false}, ?, ?)`,
          [storeId, nextTour ? true : false, visitNote || null]
        );
        visitIdToUse = visitResult.insertId;
      } else {
        // بروزرسانی بازدید موجود
        await connection.query(
          `UPDATE visits SET has_invoice = ${items?.length > 0 ? true : existing[0].has_invoice}, next_tour = ?, note = ? WHERE id = ?`,
          [nextTour ? true : false, visitNote || null, existing[0].id]
        );
        visitIdToUse = existing[0].id;
      }
    }

    let invoiceId = null;
    let totalAmount = 0;

    // 2️⃣ اگر آیتم فاکتور وجود داشت، ثبت فاکتور و ردیف‌ها
    if (items && items.length > 0) {
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoices (visit_id, invoice_date, note) VALUES (?, CURDATE(), ?)`,
        [visitIdToUse, note || null]
      );
      invoiceId = invoiceResult.insertId;

      for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);

        if (!productId || !quantity) continue;

        const product = products.find(p => Number(p.id) === productId);
        if (!product) {
          console.warn(`Product not found in JSON: ${productId}`);
          continue;
        }

        const price = Number(product.price);
        totalAmount += price * quantity;

        await connection.query(
          `INSERT INTO invoice_items (invoice_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [invoiceId, productId, quantity, price]
        );
      }

      // آپدیت مبلغ کل فاکتور
      await connection.query(
        "UPDATE invoices SET total_amount = ? WHERE id = ?",
        [totalAmount, invoiceId]
      );
    }

    // ✅ commit تراکنش
    await connection.commit();

    return new Response(JSON.stringify({ ok: true, visitId: visitIdToUse, invoiceId }), { status: 200 });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Transaction failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  } finally {
    connection.release();
  }
}
