import { DatabaseFacade } from '../facades/DatabaseFacade';
import bcrypt from 'bcrypt';

export interface User {
    id?: number;
    username: string;
    password_hash?: string;
    created_at?: string;
    google_id?: string;
    email?: string;
    isAdmin?: boolean;
}

export class UserModel {
    private db: DatabaseFacade;

    constructor() {
        this.db = new DatabaseFacade();
        this.initializeDB();
    }

    private async initializeDB() {
        await this.db.initialize();
        await this.db.runQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password_hash TEXT,
                google_id TEXT UNIQUE,
                email TEXT,
                isAdmin INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create default admin user if no users exist
        const existingUsers = await this.db.allQuery('SELECT COUNT(*) as count FROM users');
        if (existingUsers[0].count === 0) {
            try {
                await this.createUser('admin', 'admin123', true);
                console.log('✅ Default admin user created (username: admin, password: admin123)');
            } catch (error: any) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    console.log('ℹ️ Admin user already exists, skipping creation');
                } else {
                    console.error('Error creating admin user:', error);
                }
            }
        }
    }

    public async createUser(username: string, password: string, isAdmin: boolean = false): Promise<User> {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        const result = await this.db.runQuery(
            `INSERT INTO users (username, password_hash, isAdmin) VALUES (?, ?, ?)`,
            [username, password_hash, isAdmin ? 1 : 0]
        );

        return {
            id: result.lastID,
            username,
            isAdmin,
            created_at: new Date().toISOString(),
        };
    }

    public async createGoogleUser(googleId: string, email: string, username: string): Promise<User> {
        console.log('🔨 Creando usuario de Google como administrador');
        console.log('📋 Datos del usuario Google:', { googleId, email, username, isAdmin: true });
        
        const result = await this.db.runQuery(
            `INSERT INTO users (google_id, email, username, isAdmin) VALUES (?, ?, ?, ?)`,
            [googleId, email, username, 1]
        );

        const newUser = {
            id: result.lastID,
            username,
            email,
            google_id: googleId,
            isAdmin: true,
            created_at: new Date().toISOString(),
        };
        
        console.log('🎉 Usuario de Google creado exitosamente como administrador:', newUser);
        return newUser;
    }

    public async findByUsername(username: string): Promise<User | null> {
        const user = await this.db.getQuery(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (user) {
            user.isAdmin = Boolean(user.isAdmin);
        }
        return user || null;
    }

    public async findByGoogleId(googleId: string): Promise<User | null> {
        const user = await this.db.getQuery(
            'SELECT * FROM users WHERE google_id = ?',
            [googleId]
        );
        if (user) {
            user.isAdmin = Boolean(user.isAdmin);
        }
        return user || null;
    }

    public async findById(id: number): Promise<User | null> {
        const user = await this.db.getQuery(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        if (user) {
            user.isAdmin = Boolean(user.isAdmin);
        }
        return user || null;
    }

    public async validatePassword(username: string, password: string): Promise<User | null> {
        const user = await this.findByUsername(username);
        if (!user || !user.password_hash) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (isValid) {
            // Remove password hash from returned user object
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        
        return null;
    }

    public async getAllUsers(): Promise<User[]> {
        const users = await this.db.allQuery('SELECT id, username, email, google_id, isAdmin, created_at FROM users ORDER BY created_at DESC');
        return users.map(user => ({
            ...user,
            isAdmin: Boolean(user.isAdmin)
        }));
    }
}