"use client";

import { useState, useEffect } from "react";
import { Form, Button, Table } from "react-bootstrap";
import products from "../products.json"; // مسیر فایل JSON محصولات

export default function VisitsClient({ routes }) {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [nextTour, setNextTour] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!selectedRoute) return;

    fetch(`/api/stores?routeId=${selectedRoute}`)
      .then((res) => res.json())
      .then((data) => setStores(data.stores || []))
      .catch((err) => console.error("خطا در دریافت فروشگاه‌ها", err));
  }, [selectedRoute]);

  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { product_id: "", product_input: "", quantity: 1, weight: 0, price: 0 },
    ]);
  };

  const removeItem = (index) => {
    const items = [...invoiceItems];
    items.splice(index, 1);
    setInvoiceItems(items);
  };

  const updateItem = (index, field, value) => {
    const items = [...invoiceItems];
    items[index][field] = value;
    setInvoiceItems(items);
  };

  const resetForm = () => {
    setSelectedRoute("");
    setSelectedStore("");
    setVisitNote("");
    setNextTour(false);
    setInvoiceItems([]);
    setCreatingInvoice(false);
    setSuggestions([]);
  };

  const handleVisitSubmit = async () => {
    if (!selectedStore) return alert("یک فروشگاه انتخاب کنید.");

    const res = await fetch("/api/visits", {
      method: "POST",
      body: JSON.stringify({
        storeId: selectedStore,
        visited: true,
        nextTour,
        note: visitNote,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.ok) {
      alert("بازدید ثبت شد ✅");
      resetForm();
    } else {
      alert("خطا در ثبت بازدید: " + data.error);
    }
  };

  const handleInvoiceSubmit = async () => {
    if (!selectedStore) return alert("یک فروشگاه انتخاب کنید.");

    // فقط ردیف‌هایی که product_id و quantity دارند
    const items = invoiceItems.filter(
      (i) => Number(i.product_id) > 0 && Number(i.quantity) > 0
    );
    if (items.length === 0) return alert("حداقل یک ردیف فاکتور باید پر شود!");

    try {
      // ثبت بازدید با has_invoice = true و next_tour = false
      const visitRes = await fetch("/api/visits", {
        method: "POST",
        body: JSON.stringify({
          storeId: selectedStore,
          visited: true,
          nextTour: false,
          note: visitNote,
          has_invoice: true,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const visitData = await visitRes.json();
      if (!visitData.ok) throw new Error("خطا در ثبت بازدید برای فاکتور");

      const visitId = visitData.visitId;
      if (!visitId) throw new Error("شناسه بازدید معتبر نیست");

      // ثبت فاکتور با visitId
      const invoiceRes = await fetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({ visitId, items, note: visitNote }),
        headers: { "Content-Type": "application/json" },
      });

      const invoiceData = await invoiceRes.json();
      if (!invoiceData.ok)
        throw new Error(invoiceData.error || "خطا در ثبت فاکتور");

      alert("بازدید و فاکتور با موفقیت ثبت شد ✅");
      resetForm();
    } catch (err) {
      alert("خطا: " + err.message);
    }
  };

  const handleProductInput = (index, value) => {
    updateItem(index, "product_input", value);

    if (value.length >= 3) {
      const filtered = products.filter(
        (p) =>
          p.name.includes(value) ||
          p.code.includes(value)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectProduct = (index, product) => {
    updateItem(index, "product_id", product.id);
    updateItem(index, "product_input", product.name);
    updateItem(index, "price", product.price);
    updateItem(index, "weight", product.weight);
    setSuggestions([]);
  };

  // محاسبه مجموع مبلغ فاکتور
  const totalAmount = invoiceItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  return (
    <div className="container my-4">
      <h1 className="mb-4">📍 ثبت بازدید و فاکتور</h1>

      <Form.Group className="mb-3">
        <Form.Label>انتخاب مسیر:</Form.Label>
        <Form.Select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
        >
          <option value="">-- انتخاب مسیر --</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {selectedRoute && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>انتخاب فروشگاه:</Form.Label>
            <Form.Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="">-- انتخاب فروشگاه --</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>توضیح (اختیاری):</Form.Label>
            <Form.Control
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
            />
          </Form.Group>

          {!creatingInvoice && (
            <>
              <Form.Check
                type="checkbox"
                label="تور بعد"
                checked={nextTour}
                onChange={(e) => setNextTour(e.target.checked)}
              />
              {!nextTour && (
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() => setCreatingInvoice(true)}
                >
                  ایجاد فاکتور
                </Button>
              )}
            </>
          )}

          {nextTour && !creatingInvoice && (
            <Button variant="primary" onClick={handleVisitSubmit}>
              ثبت بازدید
            </Button>
          )}

          {creatingInvoice && invoiceItems.length > 0 && (
            <Button variant="success" onClick={handleInvoiceSubmit}>
              ثبت فاکتور
            </Button>
          )}

          {creatingInvoice && (
            <>
              <hr />
              <h5>اقلام فاکتور</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>کالا</th>
                    <th>تعداد</th>
                    <th>وزن</th>
                    <th>قیمت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ position: "relative" }}>
                        <Form.Control
                          type="text"
                          placeholder="نام یا کد محصول"
                          value={item.product_input || ""}
                          onChange={(e) =>
                            handleProductInput(idx, e.target.value)
                          }
                        />
                        {suggestions.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              background: "white",
                              border: "1px solid #ccc",
                              zIndex: 10,
                              width: "100%",
                              maxHeight: "150px",
                              overflowY: "auto",
                            }}
                          >
                            {suggestions.map((p) => (
                              <div
                                key={p.id}
                                style={{ padding: "5px", cursor: "pointer" }}
                                onClick={() => selectProduct(idx, p)}
                              >
                                {p.name} ({p.code})
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={item.weight}
                          onChange={(e) =>
                            updateItem(idx, "weight", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(idx, "price", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(idx)}
                        >
                          -
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="secondary" onClick={addItem}>
                + افزودن کالا
              </Button>

              {/* مجموع مبلغ فاکتور */}
              <div className="mt-2">
                <strong>مجموع مبلغ فاکتور: </strong> {totalAmount.toLocaleString()} تومان
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
