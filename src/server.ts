import express, {type Express, type Request, type Response} from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';

import { seedAdmin } from './config/seed';
import { UPLOADS_DIR, ensureDataDirs } from './config/paths';

import CompanyRoutes from './routes/company.routes';
import UserRoutes from './routes/user.routes';
import ProductRoutes from "./routes/product.routes";
import ClientRoutes from "./routes/client.routes";
import SaleRoutes from "./routes/sale.routes";
import AuthRoutes from "./routes/auth.routes";
import ViewRoutes from "./routes/views.routes";
import DashboardRoutes from './routes/dashboard.routes';
import MovementsRoutes from "./routes/movements.routes";

import { loadPublicData } from './middlewares/data.middleware';
import { errorNotFound } from './middlewares/error_404.middleware';
import { handleErrorGlobal } from './middlewares/error_500.midleware';

dotenv.config();
ensureDataDirs();

const app: Express = express();

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const isProduction = process.env.MODE === 'production';

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.json());
app.use(cookieParser());
app.disable('x-powered-by');

app.use(loadPublicData);

app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", API_URL],
      fontSrc: ["'self'"]
    },
  },
}));

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

seedAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en ${API_URL} (puerto ${PORT}, mode=${process.env.MODE || 'dev'})`);
      if (isProduction) {
        console.log(`Datos persistentes en DATA_DIR (uploads + SQLite)`);
      }
    });
  })
  .catch(() => {
    console.error('Hubo un error al intentar inicializar la base de datos')
  });
