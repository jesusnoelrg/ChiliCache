const express = require('express');
const router = express.Router();
const db = require('../../sqlite');


// Ruta para obtener todos los clientes
router.get('/', (req, res) => {
    db.all(`SELECT * FROM Clientes`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.length > 0 ? rows : []);
        }
    });
});


//Ruta para crear un nuevo cliente
router.post('/', (req, res) => {
    const { Empresa, RFC, Direccion, Correo, Telefono } = req.body;

    if (!Empresa || RFC.length < 10 || RFC.length > 13 || !Telefono || !Correo || !Direccion) {
        return res.status(400).json({ error: 'Datos inválidos. Por favor, verifica que todos los campos estén completos y correctos.' });
    }

    db.run(`
        INSERT INTO Clientes (Empresa, RFC, Direccion, Correo, Telefono) VALUES (?, ?, ?, ?, ?)
    `, [Empresa, RFC, Direccion, Correo, Telefono], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: `¡Has registrado a ${req.body.Empresa} en el sistema!`, id: this.lastID });
        }
    });
});

//Ruta para modificar un cliente
router.put('/cliente/:id', (req, res) => {
    const clienteId = req.params.id;
    const { Empresa, RFC, Direccion, Correo, Telefono } = req.body;
    db.run(`
        UPDATE Clientes SET Empresa = ?, RFC = ?, Direccion = ?, Correo = ?, Telefono = ? WHERE IDcliente = ?
    `, [Empresa, RFC, Direccion, Correo, Telefono, clienteId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Has editados los datos de ${req.body.Empresa} correctamente!` });
        }
    });
});

//Ruta para eliminar un cliente
router.delete('/:id', (req, res) => {
    const clienteId = req.params.id;
    db.run(`DELETE FROM Clientes WHERE IDcliente = ?`, [clienteId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Cliente eliminado con exito!` });
        }
    });
});

//Ruta para obtener un cliente por ID
router.get('/:id', (req, res) => {
    const clienteId = req.params.id;
    db.get(`SELECT * FROM Clientes WHERE IDcliente = ?`, [clienteId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Ese cliente no existe en el sistema." });
        }
    });
});

//Ruta para obtener un cliente por el nombre de la empresa
router.get('/nombre/:empresa', (req, res) => {
    const empresa = req.params.empresa;
    db.all(`SELECT * FROM Clientes WHERE Empresa LIKE ?`, [`%${empresa}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;