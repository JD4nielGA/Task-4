# Proyecto Node.js con TypeScript

Este es un proyecto web desarrollado con Node.js, TypeScript, Express y SQLite.

## Características

- **Backend**: Node.js con TypeScript
- **Framework**: Express.js
- **Base de datos**: SQLite
- **Autenticación**: Passport.js con Google OAuth
- **Pagos**: Integración con MercadoPago
- **Email**: Nodemailer con Gmail
- **Vistas**: EJS templates
- **Validación**: reCAPTCHA

## Instalación Local

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Copia el archivo `.env.example` a `.env` y configura las variables
4. Ejecuta en modo desarrollo:
   ```bash
   npm run dev
   ```

## Deploy en Render

### Configuración de Build

- **Build Command**: `npm run build:linux`
- **Start Command**: `npm start`
- **Node Version**: 18 o superior

### Variables de Entorno Requeridas

Configura estas variables en Render:

```
NODE_ENV=production
PORT=10000
SESSION_SECRET=tu_session_secret_seguro
COOKIE_DOMAIN=tu-app.onrender.com

# APIs externas
IPSTACK_API_KEY=tu_ipstack_api_key
FAKE_PAY=tu_fake_pay_token

# Google Services
GOOGLE_ANALYTICS_KEY=tu_google_analytics_key
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://tu-app.onrender.com/auth/google/callback

# reCAPTCHA
RECAPTCHA=tu_recaptcha_site_key
RECAPTCHA_HTML=tu_recaptcha_secret_key

# Email (Gmail)
GMAIL_USER=tu_email@gmail.com
GMAIL_PASSWORD=tu_app_password
EMAIL_FROM=tu_email_from@gmail.com
EMAIL_TO=email_destino@gmail.com
```

### Notas Importantes

1. **Puerto**: Render asigna automáticamente el puerto, no hardcodees el puerto 5000
2. **Base de datos**: SQLite se crea automáticamente en el primer arranque
3. **Archivos estáticos**: Se copian automáticamente durante el build
4. **HTTPS**: Render proporciona HTTPS automáticamente

## Scripts Disponibles

- `npm start`: Inicia el servidor en producción
- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm run build`: Compila para Windows
- `npm run build:linux`: Compila para Linux/Render
- `npm test`: Ejecuta las pruebas (pendiente)

## Estructura del Proyecto

```
src/
├── app.ts              # Configuración principal de Express
├── bin/www.ts          # Punto de entrada del servidor
├── controllers/        # Controladores de rutas
├── models/            # Modelos de datos
├── routes/            # Definición de rutas
├── services/          # Servicios de negocio
├── middlewares/       # Middlewares personalizados
├── facades/           # Facades para base de datos
├── utils/             # Utilidades
├── views/             # Templates EJS
└── public/            # Archivos estáticos
```

## Endpoints Principales

- `/` - Página principal
- `/auth/login` - Login
- `/auth/register` - Registro
- `/auth/google` - Autenticación con Google
- `/protected/dashboard` - Dashboard (requiere autenticación)
- `/protected/contacts` - Gestión de contactos
- `/protected/payments` - Gestión de pagos
- `/payments/*` - API de pagos

## Tecnologías Utilizadas

- Node.js
- TypeScript
- Express.js
- SQLite3
- Passport.js
- EJS
- Nodemailer
- MercadoPago SDK
- Axios
- bcrypt
