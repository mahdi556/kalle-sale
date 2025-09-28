"use client";
import { useState } from "react";

export default function StoresClient({ stores }) {
  const [data, setData] = useState(stores);

  async function markVisited(storeId) {
    await fetch("/api/visit", {
      method: "POST",
      body: JSON.stringify({ storeId }),
    });
    window.location.reload();
  }

  async function markInvoice(storeId) {
    await fetch("/api/invoice", {
      method: "POST",
      body: JSON.stringify({ storeId }),
    });
    window.location.reload();
  }

  // 🔹 گروه‌بندی فروشگاه‌ها بر اساس route
  const grouped = data.reduce((acc, store) => {
    if (!acc[store.route_name]) {
      acc[store.route_name] = [];
    }
    acc[store.route_name].push(store);
    return acc;
  }, {});

  return (
    <div>
      <h1>📍 فروشگاه‌ها بر اساس مسیر</h1>
      {Object.entries(grouped).map(([routeName, stores]) => (
        <div key={routeName} style={{ marginBottom: "20px" }}>
          <h2>🚩 {routeName}</h2>
          <ul>
            {stores.map((s) => (
              <li key={s.store_id}>
                <b>{s.store_name}</b>
                {s.visit_id ? (
                  <>
                    ✅ بازدید شد
                    {s.has_invoice ? (
                      " 🧾 فاکتور صادر شد"
                    ) : (
                      <button onClick={() => markInvoice(s.store_id)}>
                        ثبت فاکتور
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={() => markVisited(s.store_id)}>
                    بازدید شد
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
