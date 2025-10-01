// src/app/api/stores/all/route.js
import { db } from "../../../../../lib/db"; // یا مسیر واقعی

export async function GET() {
  try {
    const [stores] = await db.query("SELECT id, name FROM stores ORDER BY name");
    return new Response(JSON.stringify({ stores }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ stores: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
