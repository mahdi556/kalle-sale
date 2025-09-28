import { db } from "../../../lib/db";
import VisitsClient from "./VisitsClient";

export default async function VisitsPage() {
  // دریافت مسیرها از دیتابیس
  const [routes] = await db.query("SELECT id, name FROM routes ORDER BY name");

  return <VisitsClient routes={routes} />;
}
