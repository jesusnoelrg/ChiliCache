const express = require('express');
const router = express.Router();
const db = require('../sqlite');


// Ruta para obtener todos los usuarios
router.get('/', (req, res) => {
    db.all(`SELECT * FROM Usuarios`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.length > 0 ? rows : []);
        }
    });
});


//Ruta para crear un nuevo usuario
router.post('/', (req, res) => {
    const { Nombres, Apellidos, RFC, Telefono, Correo, Rol, NombreUsuario, Password } = req.body;

    if (!Nombres || !Apellidos || !RFC || RFC.length < 10 || RFC.length > 13 || !Telefono || !Correo || !Rol || !NombreUsuario || !Password || Password.length < 4 || Password.length > 12) {
        return res.status(400).json({ error: 'Datos inválidos. Por favor, verifica que todos los campos estén completos y correctos.' });
    }

    db.run(`
        INSERT INTO Usuarios (Nombres, Apellidos, RFC, Telefono, Correo, Rol, NombreUsuario, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [Nombres, Apellidos, RFC, Telefono, Correo, Rol, NombreUsuario, Password], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: `¡Has registrado a ${req.body.NombreUsuario} en el sistema!`, id: this.lastID });
        }
    });
});

//Ruta para modificar un usuario
router.put('/usuario/:id', (req, res) => {
    const userId = req.params.id;
    const { Nombres, Apellidos, RFC, Telefono, NombreUsuario, Correo, Rol } = req.body;
    db.run(`
        UPDATE Usuarios SET Nombres = ?, Apellidos = ?, RFC = ?, Telefono = ?, NombreUsuario = ?, Correo = ?, Rol = ? WHERE IDUsuario = ?
    `, [Nombres, Apellidos, RFC, Telefono, NombreUsuario, Correo, Rol, userId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Has editados los datos de ${req.body.NombreUsuario} correctamente!` });
        }
    });
});

//Ruta para eliminar un usuario
router.delete('/:id', (req, res) => {
    const userId = req.params.id;
    db.run(`DELETE FROM Usuarios WHERE IDUsuario = ?`, [userId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Usuario eliminado con exito!` });
        }
    });
});

//Ruta para obtener un usuario por ID
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    db.get(`SELECT * FROM Usuarios WHERE IDUsuario = ?`, [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Ese usuario no existe en el sistema." });
        }
    });
});

//Ruta para obtener un usuario por nombre
router.get('/nombre/:nombre', (req, res) => {
    const userName = req.params.nombre;
    db.all(`SELECT * FROM Usuarios WHERE NombreUsuario LIKE ?`, [`%${userName}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;