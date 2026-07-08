const express = require('express');
const path = require('path');
const db = require('./sqlite');
const usuariosRoutes = require('./routes/usuarios');
const clientesRoutes = require('./routes/clientes');
const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.send('API de ChiliCache');
});

app.use('/usuarios', usuariosRoutes);
app.use('/clientes', clientesRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
