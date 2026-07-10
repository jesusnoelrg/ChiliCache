import Database from "better-sqlite3"; 
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/database.db');

const db: DatabaseType = new Database(
  dbPath, 
  {verbose: process.env.MODE === 'production' ? undefined : console.log}
);


db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    unit TEXT DEFAULT 'ml',
    net_content INTEGER NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    rfc TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT CHECK (phone GLOB '*[0-9]*'),
    mail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    total REAL NOT NULL,
    invoice BOOL NOT NULL,
    id_client INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    FOREIGN KEY(id_client) REFERENCES clients(id),
    FOREIGN KEY(id_user) REFERENCES users(id) 
  );

  CREATE TABLE IF NOT EXISTS sales_detail (
    price REAL NOT NULL,
    amount INTEGER NOT NULL,
    id_sale INTEGER NOT NULL,
    id_product INTEGER NOT NULL,
    PRIMARY KEY (id_sale, id_product),
    FOREIGN KEY(id_sale) REFERENCES sales(id),
    FOREIGN KEY(id_product) REFERENCES products(id)
  );
`)

export default db;