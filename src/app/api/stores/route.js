// src/app/api/stores/route/route.js
import { db } from "../../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");
    if (!routeId) {
      return new Response(JSON.stringify({ stores: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [stores] = await db.query(
      "SELECT id, name FROM stores WHERE route_id = ? ORDER BY name",
      [routeId]
    );
 
    return new Response(JSON.stringify({ stores }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("خطا در API /stores/route:", err);
    return new Response(JSON.stringify({ stores: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
