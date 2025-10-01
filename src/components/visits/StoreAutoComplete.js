"use client";

import { useState, useEffect, useRef } from "react";
import { Form, Button } from "react-bootstrap";

export default function StoreAutoComplete({ onSelect }) {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);

  // دریافت همه فروشگاه‌ها هنگام mount
  useEffect(() => {
    fetch("/api/stores/all")
      .then((res) => res.json())
      .then((data) => setStores(data.stores || []))
      .catch((err) => console.error("خطا در دریافت فروشگاه‌ها", err));
  }, []);

  // فیلتر فروشگاه‌ها برای autocomplete
  useEffect(() => {
    if (search.length >= 3) {
      const filtered = stores.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      );
      setSuggestions(filtered);
      setActiveIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [search, stores]);

  // کلیک خارج از کامپوننت → بستن پیشنهادها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (store) => {
    setSearch(store.name);
    setSuggestions([]);
    if (onSelect) onSelect(store);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
  };

  const handleClear = () => {
    setSearch("");
    setSuggestions([]);
    setActiveIndex(0);
  };

  return (
    <div className="position-relative" ref={wrapperRef}>
      <Form.Group className="d-flex align-items-center">
        <Form.Control
          type="text"
          placeholder="نام یا کد فروشگاه..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {search && (
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-2"
            onClick={handleClear}
          >
            ❌
          </Button>
        )}
      </Form.Group>

      {suggestions.length > 0 && (
        <ul
          className="list-group position-absolute w-100 shadow"
          style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
        >
          {suggestions.map((store, idx) => (
            <li
              key={store.id}
              className={`list-group-item list-group-item-action ${
                idx === activeIndex ? "active" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => handleSelect(store)}
            >
              {store.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
