import express, {type Express, type Request, type Response} from 'express';
import db from './config/db.ts';
import UserRoutes from './routes/user.routes.ts';
import ProductRoutes from "./routes/product.routes.ts";
import ClientRoutes from "./routes/client.routes.ts";
import SaleRoutes from "./routes/sale.routes.ts";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();
const app: Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));
app.disable('x-powered-by');

app.get('/', (req: Request, res: Response) => {
    res.send('API de ChiliCache');
});

app.use('/users', UserRoutes);
app.use('/products', ProductRoutes);
app.use('/clients', ClientRoutes);
app.use('/sales', SaleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
