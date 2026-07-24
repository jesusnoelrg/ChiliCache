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
    role TEXT DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    unit TEXT DEFAULT 'ml',
    net_content INTEGER NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    rfc TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT CHECK (
        phone IS NULL
        OR length(phone) = 10 
        AND phone NOT GLOB '*[^0-9]*'
    ),
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL,
    customer_payment INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'canceled')),
    invoice INTEGER NOT NULL CHECK (invoice IN (0, 1)),
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

  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'created' CHECK (type IN ('created', 'restock', 'sale', 'cancel')),
    old_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_product INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    FOREIGN KEY(id_product) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(id_user) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    logo_path TEXT,
    name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(id_user);
  CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(id_client);
  CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

  CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(id_product);
  CREATE INDEX IF NOT EXISTS idx_movements_user ON movements(id_user);
  CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at DESC);
`)

export default db;