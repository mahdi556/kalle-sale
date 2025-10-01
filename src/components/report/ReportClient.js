"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ReportClient() {
  const [date, setDate] = useState(new Date());
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalDayAmount, setTotalDayAmount] = useState(0);
  const [totalDayWeight, setTotalDayWeight] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [date]);

  async function fetchReport() {
    setLoading(true);
    try {
      const dateStr = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/report?date=${dateStr}`);
      const data = await res.json();

      if (data.ok) {
        setStores(data.stores);

        let dayAmount = 0;
        let dayWeight = 0;

        data.stores.forEach(store => {
          store.invoices.forEach(item => {
            dayAmount += item.price * item.quantity;
            dayWeight += item.weight * item.quantity;
          });
        });

        setTotalDayAmount(dayAmount);
        setTotalDayWeight(dayWeight);

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
    <div className="container my-5">
      <h1 className="mb-4 text-center">📊 گزارش بازدید و فاکتورها</h1>

      <div className="row mb-4 align-items-center">
        <label className="col-sm-2 col-form-label fw-bold">انتخاب تاریخ:</label>
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
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">در حال بارگذاری...</p>
        </div>
      ) : stores.length === 0 ? (
        <p className="text-center text-muted">هیچ بازدیدی برای این تاریخ ثبت نشده است.</p>
      ) : (
        <>
          <div className="accordion" id="reportAccordion">
            {stores.map((store, idx) => {
              const hasInvoices = store.invoices.length > 0;
              const isNextTour = store.next_tour;

              const storeAmount = store.invoices.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
              );
              const storeWeight = store.invoices.reduce(
                (sum, i) => sum + i.weight * i.quantity,
                0
              );

              // فروشگاه‌هایی که تور بعد دارند → اکاردئونی نیستند
              if (isNextTour) {
                return (
                  <div
                    key={store.store_id}
                    className="list-group-item d-flex px-3 py-1 border border-light-subtle justify-content-between align-items-center mb-2 shadow-sm rounded"
                  >
                    <div>
                      <strong>{store.store_name}</strong>{" "}
                      <small className="text-muted">({store.route_name})</small>
                      {store.note && <span className="ms-2 badge bg-secondary">{store.note}</span>}
                    </div>
                    <span className="badge bg-warning text-dark">تور بعد</span>
                  </div>
                );
              }

              // فروشگاه‌هایی که فاکتور دارند → اکاردئونی پیش‌فرض بسته
              if (hasInvoices) {
                return (
                  <div className="accordion-item border border-light-subtle my-4 shadow-sm rounded" key={store.store_id}>
                    <h2 className="accordion-header" id={`heading${idx}`}>
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse${idx}`}
                        aria-expanded="false"
                        aria-controls={`collapse${idx}`}
                      >
                        <div className="d-flex justify-content-between w-100 align-items-center">
                          <div>
                            <strong>{store.store_name}</strong>{" "}
                            <small className="text-muted">({store.route_name})</small>
                            {store.note && (
                              <span className="badge bg-secondary ms-2">{store.note}</span>
                            )}
                          </div>
                          <div className="text-end">
                            <span className="badge bg-success me-2">
                              مبلغ: {storeAmount.toLocaleString()} تومان | وزن: {storeWeight} کیلوگرم
                            </span>
                          </div>
                        </div>
                      </button>
                    </h2>
                    <div
                      id={`collapse${idx}`}
                      className="accordion-collapse collapse"
                      aria-labelledby={`heading${idx}`}
                      data-bs-parent="#reportAccordion"
                    >
                      <div className="accordion-body">
                        <div className="table-responsive">
                          <table className="table table-striped table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>کد کالا</th>
                                <th>نام کالا</th>
                                <th>وزن</th>
                                <th>قیمت</th>
                                <th>تعداد</th>
                                <th>جمع</th>
                                <th>جمع وزن</th>
                              </tr>
                            </thead>
                            <tbody>
                              {store.invoices.map((inv, iidx) => (
                                <tr key={iidx}>
                                  <td>{inv.product_code}</td>
                                  <td>{inv.product_name}</td>
                                  <td>{inv.weight}</td>
                                  <td>{inv.price.toLocaleString()}</td>
                                  <td>{inv.quantity}</td>
                                  <td>{(inv.price * inv.quantity).toLocaleString()}</td>
                                  <td>{inv.weight * inv.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // فروشگاه‌هایی که بازدید شدند ولی نه فاکتور و نه تور بعد دارند
              return (
                <div
                  key={store.store_id}
                  className="list-group-item mb-2 shadow-sm rounded text-muted"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {store.store_name} - <small>{store.route_name}</small>
                      {store.note && <span className="ms-2">| توضیح: {store.note}</span>}
                    </div>
                    <span className="badge bg-danger">❌ فاکتور صادر نشده</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-end">
            <h5>
              <strong>💰 مجموع کل روز: {totalDayAmount.toLocaleString()} تومان</strong>
            </h5>
            <h5>
              <strong>⚖️ مجموع وزن کل روز: {totalDayWeight} کیلوگرم</strong>
            </h5>
          </div>
        </>
      )}
    </div>
  );
}
