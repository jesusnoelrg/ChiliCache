import express, {type Express, type Request, type Response} from 'express';
import cookieParser from 'cookie-parser';

import db from './config/db.ts';

import UserRoutes from './routes/user.routes.ts';
import ProductRoutes from "./routes/product.routes.ts";
import ClientRoutes from "./routes/client.routes.ts";
import SaleRoutes from "./routes/sale.routes.ts";
import AuthRoutes from "./routes/auth.routes.ts";
import ViewRoutes from "./routes/views.routes.ts";
import DashboardRoutes from './routes/dashboard.routes.ts';

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();
const app: Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../views')));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:3000"],
      fontSrc: ["'self'"]
    },
  },
}));
app.use(cookieParser());
app.disable('x-powered-by');

app.get('/', (req: Request, res: Response) => {
  res.send('API de ChiliCache');
});

app.use('/api/auth', AuthRoutes);
app.use('/', ViewRoutes);
app.use('/api/dashboard', DashboardRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/clients', ClientRoutes);
app.use('/api/sales', SaleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
