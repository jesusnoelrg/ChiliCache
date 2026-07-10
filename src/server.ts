import express, {type Express, type Request, type Response} from 'express';
import db from './config/db.ts';
import UserRoutes from './routes/user.ts';
import ProductRoutes from "./routes/products.ts";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();
const app: Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req: Request, res: Response) => {
    res.send('API de ChiliCache');
});

app.use('/users', UserRoutes);
app.use('/products', ProductRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
