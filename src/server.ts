import express, {type Express, type Request, type Response} from 'express';
import db from './config/db.ts';
import UserRoutes from './routes/user.routes.ts';
import ProductRoutes from "./routes/product.routes.ts";
import ClientRoutes from "./routes/client.routes.ts";
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
app.use('/clients', ClientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
