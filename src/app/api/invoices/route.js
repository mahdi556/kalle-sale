import { db } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { visitId, items, note } = await req.json();

    if (!visitId) {
      return new Response(
        JSON.stringify({ ok: false, error: "شناسه بازدید معتبر نیست" }),
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "فاکتور خالی است" }),
        { status: 400 }
      );
    }

    // 1️⃣ ثبت فاکتور
    const [result] = await db.query(
      `INSERT INTO invoices (visit_id, invoice_date, note) 
       VALUES (?, CURDATE(), ?)`,
      [visitId, note || null]
    );

    const invoiceId = result.insertId;
    console.log("Created invoiceId:", invoiceId);

    let totalAmount = 0;

    // 2️⃣ ثبت ردیف‌های فاکتور
    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!productId || !quantity) continue;

      // بررسی موجود بودن محصول
      const [rows] = await db.query(
        "SELECT price FROM products WHERE id = ?",
        [productId]
      );
      if (rows.length === 0) {
        console.warn(`Product not found: ${productId}`);
        continue;
      }

      const price = rows[0].price;
      totalAmount += price * quantity;

      // ثبت در invoice_items
      await db.query(
        `INSERT INTO invoice_items (invoice_id, product_id, quantity) 
         VALUES (?, ?, ?)`,
        [invoiceId, productId, quantity]
      );
      console.log("Inserted invoice_item:", { invoiceId, productId, quantity });
    }

    // 3️⃣ آپدیت مبلغ کل فاکتور
    await db.query(
      "UPDATE invoices SET total_amount = ? WHERE id = ?",
      [totalAmount, invoiceId]
    );

    // 4️⃣ آپدیت وضعیت بازدید
    await db.query(
      "UPDATE visits SET has_invoice = TRUE, next_tour = FALSE WHERE id = ?",
      [visitId]
    );

    console.log("Invoice items saved, total amount:", totalAmount);

    return new Response(JSON.stringify({ ok: true, invoiceId }));
  } catch (err) {
    console.error("❌ Error saving invoice:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
    });
  }
}
