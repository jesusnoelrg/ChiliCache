/*const express = require('express');
const path = require('path');
const db = require('./sqlite');
const usuariosRoutes = require('./routes/usuarios');
const clientesRoutes = require('./routes/clientes');*/
import express, {type Express, type Request, type Response} from 'express';
//import UserRoutes from './routes/usuarios.js';
//import ClientRoutes from './routes/clientes.js';
import path from 'path'


const app: Express = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req: Request, res: Response) => {
    res.send('API de ChiliCache');
});

//app.use('/usuarios', UserRoutes);
//app.use('/clientes', ClientRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
