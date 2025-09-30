"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ReportClient() {
  const [date, setDate] = useState(new Date());
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  // بارگذاری گزارش هر بار که تاریخ تغییر کنه
  useEffect(() => {
    fetchReport();
  }, [date]);

  async function fetchReport() {
    setLoading(true);
    try {
      const dateStr = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/report/route?date=${dateStr}`);
      const data = await res.json();

      if (data.ok) {
        setStores(data.stores);
      } else {
        alert("خطا در دریافت گزارش: " + (data.error || "نامشخص"));
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("خطا در دریافت گزارش! لطفاً console را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container my-4">
      <h1 className="mb-4">📊 گزارش بازدید و فاکتورها</h1>

      <div className="mb-3 row align-items-center">
        <label className="col-sm-2 col-form-label">انتخاب تاریخ:</label>
        <div className="col-sm-4">
          <DatePicker
            selected={date}
            onChange={setDate}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <div className="accordion" id="reportAccordion">
          {stores.map((store, idx) => {
            // فروشگاه‌هایی که فاکتور دارند → accordion بازشونده
            if (store.invoices.length > 0) {
              return (
                <div className="accordion-item" key={store.store_id}>
                  <h2 className="accordion-header" id={`heading${idx}`}>
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse${idx}`}
                      aria-expanded="false"
                      aria-controls={`collapse${idx}`}
                    >
                      {store.store_name} - <small>{store.route_name}</small>
                      {store.note && (
                        <span className="ms-2 badge bg-secondary">
                          توضیح: {store.note}
                        </span>
                      )}
                    </button>
                  </h2>
                  <div
                    id={`collapse${idx}`}
                    className="accordion-collapse collapse"
                    aria-labelledby={`heading${idx}`}
                    data-bs-parent="#reportAccordion"
                  >
                    <div className="accordion-body">
                      <ul className="list-group">
                        {store.invoices.map((inv, iidx) => (
                          <li key={iidx} className="list-group-item">
                            <b>کد کالا:</b> {inv.product_code} |{" "}
                            <b>نام کالا:</b> {inv.product_name} |{" "}
                            <b>وزن:</b> {inv.weight} |{" "}
                            <b>قیمت:</b> {inv.price} |{" "}
                            <b>تعداد:</b> {inv.quantity} |{" "}
                            <b>جمع:</b> {inv.price * inv.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            }

            // فروشگاه‌هایی که تور بعد دارند
            if (store.next_tour) {
              return (
                <div
                  key={store.store_id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    {store.store_name} - <small>{store.route_name}</small>
                    {store.note && (
                      <span className="text-muted"> ({store.note})</span>
                    )}
                  </div>
                  <span className="badge bg-warning text-dark">تور بعد</span>
                </div>
              );
            }

            // فروشگاه‌هایی که بازدید شدن ولی نه فاکتور و نه تور بعد دارن
            return (
              <div
                key={store.store_id}
                className="list-group-item text-muted"
              >
                {store.store_name} - <small>{store.route_name}</small> – ❌ فاکتور صادر نشده
                {store.note && <span> | توضیح: {store.note}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
