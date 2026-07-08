//const sqlite3 = require('sqlite3').verbose();
import Database from "better-sqlite3"; 
import type { Database as DatabaseType } from 'better-sqlite3';

const db: DatabaseType = new Database(
  './database.db', 
  {verbose: process.env.MODE === 'production' ? undefined : console.log}
);


db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Productos (
            IDProducto INTEGER PRIMARY KEY AUTOINCREMENT,
            Nombre TEXT NOT NULL,
            UnidadMedida TEXT NOT NULL,
            ContenidoNeto INTEGER NOT NULL,
            Precio REAL NOT NULL,
            Stock INTEGER NOT NULL,
            Imagen BLOB
  );
`)

export default db;

/*db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");
    
    
    db.run(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            IDUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
            Nombres TEXT NOT NULL,
            Apellidos TEXT NOT NULL,
            RFC TEXT NOT NULL,
            Telefono TEXT NOT NULL,
            Correo TEXT NOT NULL,
            Rol TEXT NOT NULL,
            NombreUsuario TEXT NOT NULL,
            Password TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Productos (
            IDProducto INTEGER PRIMARY KEY AUTOINCREMENT,
            Nombre TEXT NOT NULL,
            UnidadMedida TEXT NOT NULL,
            ContenidoNeto INTEGER NOT NULL,
            Precio REAL NOT NULL,
            Stock INTEGER NOT NULL,
            Imagen BLOB
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Clientes (
            IDCliente INTEGER PRIMARY KEY AUTOINCREMENT,
            Empresa TEXT NOT NULL,
            RFC TEXT NOT NULL,
            Direccion TEXT NOT NULL,
            Telefono,
            Correo TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Ventas (
            IDVenta INTEGER PRIMARY KEY AUTOINCREMENT,
            Fecha TEXT NOT NULL,
            Total REAL NOT NULL,
            Factura INTEGER NOT NULL,
            IDCliente INTEGER,
            FOREIGN KEY (IDCliente) REFERENCES Clientes(IDCliente)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS DetalleVentas (
            IDVenta INTEGER,
            IDProducto INTEGER,
            Precio REAL NOT NULL,
            Cantidad INTEGER NOT NULL,
            PRIMARY KEY (IDVenta, IDProducto),
            FOREIGN KEY (IDVenta) REFERENCES Ventas(IDVenta),
            FOREIGN KEY (IDProducto) REFERENCES Productos(IDProducto)
        )
    `);
});*/

//module.exports = db;