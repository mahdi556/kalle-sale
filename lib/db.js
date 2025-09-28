import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",   // یا IP سرور
  user: "root",        // یوزر دیتابیس
  password: "",// پسورد دیتابیس
  database: "kalle",    // نام دیتابیس
});