const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

db.serialize(() => {
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
});

module.exports = db;