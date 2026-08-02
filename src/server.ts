import express, {type Express, type Request, type Response} from 'express';
import cookieParser from 'cookie-parser';

import db from './config/db.ts';

import CompanyRoutes from './routes/company.routes.ts';
import UserRoutes from './routes/user.routes.ts';
import ProductRoutes from "./routes/product.routes.ts";
import ClientRoutes from "./routes/client.routes.ts";
import SaleRoutes from "./routes/sale.routes.ts";
import AuthRoutes from "./routes/auth.routes.ts";
import ViewRoutes from "./routes/views.routes.ts";
import DashboardRoutes from './routes/dashboard.routes.ts';
import MovementsRoutes from "./routes/movements.routes.ts";

import { loadPublicData } from './middlewares/data.middleware';
import { errorNotFound } from './middlewares/error_404.middleware.ts';
import { handleErrorGlobal } from './middlewares/error_500.midleware.ts';

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();
const app: Express = express();

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.use(loadPublicData);
app.use(express.static(path.join(__dirname, '../views')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", `${API_URL}:${PORT}`],
      fontSrc: ["'self'"]
    },
  },
}));
app.use(cookieParser());
app.disable('x-powered-by');

app.get('/', (req: Request, res: Response) => {
  res.send('API de ChiliCache');
});

app.use('/api/company', CompanyRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api/dashboard', DashboardRoutes);
app.use('/api/movements', MovementsRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/clients', ClientRoutes);
app.use('/api/sales', SaleRoutes);
app.use('/', ViewRoutes);
app.use(errorNotFound);
app.use(handleErrorGlobal);


app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${API_URL}:${PORT}`);
});
