import createError from 'http-errors';
import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import passport from './config/passport';
import { loadUser } from './middlewares/Auth';

// Type declarations
interface User {
  id?: number;
  username: string;
  isAdmin: boolean;
  googleId?: string;
}

declare global {
  namespace Express {
    interface User {
      id?: number;
      username: string;
      isAdmin?: boolean;
      googleId?: string;
    }
  }
}

// Importar tipos para express-session
import { SessionOptions } from 'express-session';

// Extender el tipo de sesión
declare module 'express-session' {
  interface SessionData {
    message?: string;
    success?: boolean;
  }
}

const app: Application = express();

// Configuración del motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const sessionSecret = process.env.SESSION_SECRET;
const nodeEnv = process.env.NODE_ENV;

if (nodeEnv == 'production') {
  app.set('trust proxy', 1); // Confía en el primer proxy (ej. Nginx, Heroku, Render)
}

const sessionConfig: SessionOptions = {
  secret: sessionSecret || 'something',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: nodeEnv == 'production',
    sameSite: nodeEnv == 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
};

app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Load user middleware
app.use(loadUser);

declare module 'express-session' {
  interface SessionData {
    message?: string;
    success?: boolean;
    paymentMessage?: string;  
    paymentSuccess?: boolean;
    userId?: number;
    username?: string;
    isAdmin?: boolean;
    redirectTo?: string;
  }
}

// Middleware para pasar mensajes a las vistas
app.use((req: Request, res: Response, next: NextFunction) => {
  // Mensajes generales
  res.locals.message = req.session.message;
  res.locals.success = req.session.success;
  
  // Mensajes específicos de pagos (opcional)
  res.locals.paymentMessage = req.session.paymentMessage;
  res.locals.paymentSuccess = req.session.paymentSuccess;
  
  // Limpiar todos los mensajes
  req.session.message = undefined;
  req.session.success = undefined;
  req.session.paymentMessage = undefined;
  req.session.paymentSuccess = undefined;
  
  next();
});

app.use((req, res, next) => {
  res.locals.gaKey = process.env.GOOGLE_ANALYTICS_KEY || '';
  res.locals.cD = process.env.COOKIE_DOMAIN || '';
  next();
});

const staticFilesPath = path.join(__dirname, 'public');
app.use(express.static(staticFilesPath, {
  setHeaders: (res) => {
    res.header('Cache-Control', 'public, max-age=3600');
  }
}));

// Importar rutas
import indexRouter from './routes/index';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import protectedRouter from './routes/protected';
import paymentsRouter from './routes/payments';

// Rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/protected', protectedRouter);
app.use('/payments', paymentsRouter);

// Redirect /login to /auth/login for convenience
app.get('/login', (req, res) => res.redirect('/auth/login'));
app.get('/logout', (req, res) => res.redirect('/auth/logout'));
app.get('/register', (req, res) => res.redirect('/auth/register'));

// Manejo de error 404
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// Manejador de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;
