import { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { UserModel } from '../models/UserModel';

// Instancia global de UserModel
let userModelInstance: UserModel | null = null;

// Función para obtener la instancia inicializada
async function getUserModel(): Promise<UserModel> {
    if (!userModelInstance) {
        userModelInstance = new UserModel();
        // Esperar a que se inicialice completamente
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return userModelInstance;
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        req.session.message = 'Debes iniciar sesión para acceder a esta página';
        req.session.success = false;
        return res.redirect('/login');
    }
}

// Middleware to check if user is admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    console.log('🔍 RequireAdmin Debug Info:');
    console.log('Session exists:', !!req.session);
    console.log('Session userId:', req.session?.userId);
    console.log('Session isAdmin:', req.session?.isAdmin);
    console.log('Session username:', req.session?.username);
    
    if (req.session && req.session.userId && req.session.isAdmin) {
        console.log('✅ Admin access granted');
        return next();
    } else {
        console.log('❌ Admin access denied - redirecting to login');
        req.session.message = 'Acceso denegado. Se requieren permisos de administrador';
        req.session.success = false;
        return res.redirect('/login');
    }
}

// Middleware to pass user info to views
export async function loadUser(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.userId) {
        try {
            const userModel = await getUserModel();
            const user = await userModel.findById(req.session.userId);
            res.locals.user = user;
            res.locals.isAuthenticated = true;
        } catch (error) {
            console.error('Error loading user:', error);
            res.locals.user = null;
            res.locals.isAuthenticated = false;
        }
    } else {
        res.locals.user = null;
        res.locals.isAuthenticated = false;
    }
    next();
}

export class ValidateRecaptcha {
    private secretKey: string;

    constructor() {
        const recaptchaKey = process.env.RECAPTCHA

               if (!recaptchaKey) {
            console.error("⚠️ Error: La variable de entorno RECAPTCHA no está definida.");
            this.secretKey = 'VALOR_POR_DEFECTO_SOLO_PARA_DESARROLLO';
        } else {
            this.secretKey = recaptchaKey;
        }
    }

    public async validate(req: Request, res: Response, next: NextFunction) {
        try {
            const recaptchaResponse = req.body["g-recaptcha-response"];

            if (!recaptchaResponse) {
                console.error("⚠️ Error: Token reCAPTCHA no recibido.");
                req.session.message = "Verificación reCAPTCHA fallida";
                req.session.success = false;
                return res.redirect("/");
            }

            const googleUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${this.secretKey}&response=${recaptchaResponse}`;

            console.log("🔍 Enviando solicitud a Google reCAPTCHA...");
            const googleResponse = await fetch(googleUrl, { method: "POST" });
            const data = await googleResponse.json();

            console.log("📜 Respuesta de Google reCAPTCHA:", data);

            if (!data.success) {
                console.error("🚫 Verificación fallida.");
                req.session.message = "Verificación reCAPTCHA fallida.";
                req.session.success = false;
                return res.redirect("/");
            }

            console.log("✅ reCAPTCHA validado correctamente.");
            next(); // Continuar con la ejecución de la siguiente función
        } catch (error) {
            console.error("❌ Error en la verificación de reCAPTCHA:", error);
            req.session.message = "Error al procesar reCAPTCHA.";
            req.session.success = false;
            return res.redirect("/");
        }
    }
}
