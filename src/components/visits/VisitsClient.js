"use client";

import { useState } from "react";
import { Button, Table, Form, Modal } from "react-bootstrap";
import StoreAutoComplete from "./StoreAutoComplete";
import ProductAutoCompleteModal from "./ProductAutoCompleteModal";
import products from "../../products.json";

export default function VisitsClient() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [visitNote, setVisitNote] = useState("");
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showNextTourModal, setShowNextTourModal] = useState(false);

  // افزودن کالا از مدال
  const handleAddProduct = (item) => {
    if (!item || !item.product_id) return;

    setInvoiceItems((prevItems) => {
      const index = prevItems.findIndex(i => i.product_id === item.product_id);
      if (index !== -1) {
        // اگر قبلاً اضافه شده، فقط تعدادش را تغییر بده
        const updatedItems = [...prevItems];
        updatedItems[index].quantity = item.quantity > 0 ? item.quantity : 1;
        return updatedItems;
      } else {
        return [...prevItems, { ...item, quantity: item.quantity > 0 ? item.quantity : 1 }];
      }
    });
  };

  // حذف کالا از جدول
  const removeItem = (index) => {
    setInvoiceItems((prevItems) => {
      const items = [...prevItems];
      items.splice(index, 1);
      return items;
    });
  };

  // ثبت نهایی فاکتور
  const handleInvoiceSubmit = async () => {
    if (!selectedStore) return alert("یک فروشگاه انتخاب کنید.");
    if (invoiceItems.length === 0) return alert("حداقل یک کالا باید انتخاب شود.");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          storeId: selectedStore.id,
          items: invoiceItems,
          note: visitNote,
          nextTour: false,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "خطا در ثبت فاکتور");

      alert("✅ فاکتور ثبت شد");
      setSelectedStore(null);
      setVisitNote("");
      setInvoiceItems([]);
    } catch (err) {
      alert("خطا: " + err.message);
    }
  };

  // ثبت تور بعد با توضیحات
  const handleNextTourSubmit = async () => {
    if (!selectedStore) return alert("یک فروشگاه انتخاب کنید.");

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        body: JSON.stringify({
          storeId: selectedStore.id,
          visited: true,
          nextTour: true,
          note: visitNote,
          has_invoice: false,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "خطا در ثبت تور بعد");

      alert("✅ تور بعد با توضیحات ثبت شد");
      setSelectedStore(null);
      setVisitNote("");
      setShowNextTourModal(false);
    } catch (err) {
      alert("خطا: " + err.message);
    }
  };

  const totalAmount = invoiceItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  return (
    <div className="container my-4">
      <h1 className="mb-4">📍 ثبت بازدید و فاکتور</h1>

      {/* انتخاب فروشگاه */}
      <StoreAutoComplete onSelect={setSelectedStore} />

      {selectedStore && (
        <>
          {/* دکمه‌ها */}
          <div className="mt-3 d-flex gap-2">
            <Button variant="primary" onClick={() => setShowProductModal(true)}>
              ➕ افزودن کالا
            </Button>
            <Button variant="warning" onClick={() => setShowNextTourModal(true)}>
              📅 ثبت تور بعد
            </Button>
          </div>

          {/* جدول کالاها */}
          {invoiceItems.length > 0 && (
            <>
              <hr />
              <h5>🛒 اقلام فاکتور</h5>
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
                      <td>{item.product_input}</td>
                      <td>{item.quantity}</td>
                      <td>{item.weight}</td>
                      <td>{item.price.toLocaleString()}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => removeItem(idx)}>
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-2">
                <strong>مجموع مبلغ فاکتور: </strong>
                {totalAmount.toLocaleString()} تومان
              </div>

              <Button variant="success" className="mt-3" onClick={handleInvoiceSubmit}>
                ✅ ثبت نهایی فاکتور
              </Button>
            </>
          )}
        </>
      )}

      {/* مدال انتخاب کالا */}
      <ProductAutoCompleteModal
        show={showProductModal}
        onClose={() => setShowProductModal(false)}
        onAdd={handleAddProduct}
        products={products}
      />

      {/* مدال ثبت تور بعد */}
      <Modal show={showNextTourModal} onHide={() => setShowNextTourModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>📅 ثبت تور بعد</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>توضیحات:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNextTourModal(false)}>
            ❌ بستن
          </Button>
          <Button variant="primary" onClick={handleNextTourSubmit}>
            ✅ ثبت تور بعد
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
