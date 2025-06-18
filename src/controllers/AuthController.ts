import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
import passport from 'passport';

export class AuthController {
    private userModel: UserModel;

    constructor() {
        this.userModel = new UserModel();
    }

    // Show login page
    public showLogin = (req: Request, res: Response) => {
        const isAuthenticated = req.session && req.session.userId;
        const isAdmin = req.session && req.session.isAdmin;
        
        res.render('auth/login', {
            title: 'Iniciar Sesión - TutorNest',
            message: res.locals.message || null,
            success: res.locals.success || false,
            isAuthenticated: isAuthenticated,
            isAdmin: isAdmin
        });
    };

    // Handle local login
    public login = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                req.session.message = 'Usuario y contraseña son requeridos';
                req.session.success = false;
                return res.redirect('/login');
            }

            const user = await this.userModel.validatePassword(username, password);
            
            if (user) {
                req.session.userId = user.id;
                req.session.username = user.username;
                req.session.isAdmin = user.isAdmin || user.username === 'admin'; // Check isAdmin field or admin username
                req.session.message = `¡Bienvenido, ${user.username}!`;
                req.session.success = true;
                
                console.log('🔍 Login Debug Info:');
                console.log('User object:', user);
                console.log('Session userId:', req.session.userId);
                console.log('Session username:', req.session.username);
                console.log('Session isAdmin:', req.session.isAdmin);
                
                // Redirect to dashboard after successful login
                const redirectTo = req.session.redirectTo || '/protected/dashboard';
                delete req.session.redirectTo;
                return res.redirect(redirectTo);
            } else {
                req.session.message = 'Usuario o contraseña incorrectos';
                req.session.success = false;
                return res.redirect('/login');
            }
        } catch (error) {
            console.error('Error en login:', error);
            req.session.message = 'Error interno del servidor';
            req.session.success = false;
            return res.redirect('/login');
        }
    };

    // Handle logout
    public logout = (req: Request, res: Response) => {
        const username = req.session.username;
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/?message=' + encodeURIComponent(`¡Hasta luego, ${username}!`));
        });
    };

    // Show registration page (admin only)
    public showRegister = (req: Request, res: Response) => {
        res.render('auth/register', {
            title: 'Registrar Usuario - TutorNest',
            message: res.locals.message,
            success: res.locals.success
        });
    };

    // Handle registration (admin only)
    public register = async (req: Request, res: Response) => {
        try {
            const { username, password, confirmPassword } = req.body;
            
            console.log('🚀 Iniciando proceso de registro de usuario');
            console.log('📝 Datos recibidos:', { username, password: '***', confirmPassword: '***' });

            // Validación de campos requeridos
            if (!username || !password || !confirmPassword) {
                console.log('❌ Error: Campos requeridos faltantes');
                req.session.message = 'Todos los campos son requeridos';
                req.session.success = false;
                return res.redirect('/register');
            }
            
            console.log('✅ Validación de campos requeridos: PASÓ');

            // Validación de formato de usuario
            console.log('🔍 Validando formato de usuario:', username);
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                console.log('❌ Error: Formato de usuario inválido');
                req.session.message = 'El usuario debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos';
                req.session.success = false;
                return res.redirect('/register');
            }
            console.log('✅ Validación de formato de usuario: PASÓ');

            // Validación de contraseñas
            console.log('🔍 Validando coincidencia de contraseñas');
            if (password !== confirmPassword) {
                console.log('❌ Error: Las contraseñas no coinciden');
                req.session.message = 'Las contraseñas no coinciden';
                req.session.success = false;
                return res.redirect('/register');
            }
            console.log('✅ Validación de coincidencia de contraseñas: PASÓ');

            console.log('🔍 Validando longitud de contraseña');
            if (password.length < 6) {
                console.log('❌ Error: Contraseña muy corta');
                req.session.message = 'La contraseña debe tener al menos 6 caracteres';
                req.session.success = false;
                return res.redirect('/register');
            }
            console.log('✅ Validación de longitud de contraseña: PASÓ');

            // Validación de fortaleza de contraseña
            console.log('🔍 Validando fortaleza de contraseña');
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                console.log('❌ Error: Contraseña no cumple con los requisitos de fortaleza');
                req.session.message = 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número';
                req.session.success = false;
                return res.redirect('/register');
            }
            console.log('✅ Validación de fortaleza de contraseña: PASÓ');

            // Verificar si el usuario ya existe
            console.log('🔍 Verificando si el usuario ya existe en la base de datos');
            const existingUser = await this.userModel.findByUsername(username);
            if (existingUser) {
                console.log('❌ Error: El usuario ya existe en la base de datos');
                console.log('👤 Usuario existente:', { id: existingUser.id, username: existingUser.username });
                req.session.message = 'El usuario ya existe';
                req.session.success = false;
                return res.redirect('/register');
            }
            console.log('✅ Verificación de usuario existente: PASÓ (usuario no existe)');

            // Crear nuevo usuario SIEMPRE como administrador
            console.log('🔨 Iniciando creación de nuevo usuario administrador');
            console.log('📋 Parámetros de creación:', { username, isAdmin: true });
            
            const newUser = await this.userModel.createUser(username, password, true);
            
            console.log('🎉 ¡Usuario creado exitosamente!');
            console.log('👤 Detalles del nuevo usuario:', {
                 id: newUser?.id,
                 username: newUser?.username,
                 isAdmin: newUser?.isAdmin,
                 created_at: newUser?.created_at
             });
            
            req.session.message = `¡Usuario administrador ${username} creado exitosamente! 🎉`;
            req.session.success = true;
            
            console.log(`✅ Proceso de registro completado exitosamente para: ${username}`);
            return res.redirect('/register');

        } catch (error: unknown) {
            console.error('💥 ERROR CRÍTICO en el proceso de registro:');
            console.error('🔍 Tipo de error:', error instanceof Error ? error.constructor.name : typeof error);
            console.error('📝 Mensaje de error:', error instanceof Error ? error.message : String(error));
            console.error('📚 Stack trace completo:', error instanceof Error ? error.stack : 'No stack trace available');
            console.error('⚠️ Error completo:', error);
            
            req.session.message = 'Error interno del servidor. Por favor, inténtelo de nuevo.';
            req.session.success = false;
            return res.redirect('/register');
        }
    };

    // Google OAuth callback
    public googleCallback = (req: Request, res: Response) => {
        // This will be handled by passport middleware
        if (req.user) {
            console.log('🔍 Google OAuth Login Debug Info:');
            console.log('User object from Google:', req.user);
            
            // Establecer sesión del usuario
            req.session.userId = req.user.id;
            req.session.username = req.user.username;
            req.session.isAdmin = req.user.isAdmin || true; // Los usuarios de Google son administradores
            
            console.log('Session userId:', req.session.userId);
            console.log('Session username:', req.session.username);
            console.log('Session isAdmin:', req.session.isAdmin);
            
            req.session.message = `¡Bienvenido, ${req.user.username}!`;
            req.session.success = true;
            
            console.log('✅ Redirigiendo al dashboard');
            res.redirect('/protected/dashboard');
        } else {
            console.log('❌ Error: No se encontró información del usuario en req.user');
            req.session.message = 'Error al obtener información del usuario';
            req.session.success = false;
            res.redirect('/login');
        }
    };

    // Handle Google OAuth failure
    public googleFailure = (req: Request, res: Response) => {
        req.session.message = 'Error al autenticar con Google';
        req.session.success = false;
        res.redirect('/login');
    };

    // Check username availability (API endpoint)
    public async checkUsernameAvailability(req: Request, res: Response) {
        try {
            const { username } = req.body;
            
            if (!username || typeof username !== 'string') {
                return res.status(400).json({ error: 'Username is required' });
            }
            
            // Validar formato de usuario
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                return res.json({ available: false, reason: 'Invalid format' });
            }
            
            const existingUser = await this.userModel.findByUsername(username);
            const available = !existingUser;
            
            return res.json({ available });
            
        } catch (error) {
            console.error('Error checking username availability:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // Public method to check if username exists (for route access)
    public async findUserByUsername(username: string) {
        return await this.userModel.findByUsername(username);
    }
}