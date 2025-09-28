// components/Navbar.js
"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" href="/">📌 مدیریت بازدید</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" href="/visits">بازدید فروشگاه‌ها</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/report">گزارش روزانه</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
