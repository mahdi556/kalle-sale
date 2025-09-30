import { db } from "../../../lib/db";
import StoresClient from "../../components/stores/StoresClient";

export default async function StoresPage() {
  const [rows] = await db.query(`
    SELECT 
      s.id AS store_id,
      s.name AS store_name,
      r.name AS route_name,
      v.id AS visit_id,
      v.has_invoice
    FROM stores s
    JOIN routes r ON s.route_id = r.id
    LEFT JOIN visits v 
      ON s.id = v.store_id AND v.visit_date = CURDATE()
    ORDER BY r.name, s.name
  `);

  return <StoresClient stores={rows} />;
}
