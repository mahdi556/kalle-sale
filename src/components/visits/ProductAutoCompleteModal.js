"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function ProductAutoCompleteModal({ show, onClose, onAdd, products }) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (search.length >= 3) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase())
      );
      setSuggestions(filtered);
      setActiveIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [search, products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product) => {
    setSelectedProduct(product);
    setSearch(product.name);
    setSuggestions([]);
    setQuantity(1);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!selectedProduct && suggestions.length > 0) {
          handleSelect(suggestions[activeIndex]);
        } else if (selectedProduct) {
          handleAddProduct();
        }
      }
    } else if (selectedProduct) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setQuantity((q) => Math.min(q + 1, 999));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setQuantity((q) => Math.max(q - 1, 1));
      }
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return alert("یک محصول انتخاب کنید.");
    onAdd({
      product_id: selectedProduct.id,
      product_input: selectedProduct.name,
      quantity,
      price: selectedProduct.price,
      weight: selectedProduct.weight,
    });
    setSearch("");
    setSelectedProduct(null);
    setQuantity(1);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>➕ افزودن کالا</Modal.Title>
      </Modal.Header>
      <Modal.Body ref={wrapperRef}>
        <Form.Group className="mb-3">
          <Form.Label>جستجوی محصول (حداقل 3 حرف)</Form.Label>
          <Form.Control
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="نام یا کد محصول..."
          />
          {suggestions.length > 0 && (
            <ul
              className="list-group position-absolute w-100 shadow"
              style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
            >
              {suggestions.map((p, idx) => (
                <li
                  key={p.id}
                  className={`list-group-item list-group-item-action ${
                    idx === activeIndex ? "active" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelect(p)}
                >
                  {p.name} ({p.code})
                </li>
              ))}
            </ul>
          )}
        </Form.Group>

        {selectedProduct && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <Button
              variant="primary"
              onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
            >
              -
            </Button>
            <span>{quantity}</span>
            <Button
              variant="success"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </Button>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          ❌ بستن
        </Button>
        <Button variant="primary" onClick={handleAddProduct}>
          ✅ افزودن به فاکتور
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
