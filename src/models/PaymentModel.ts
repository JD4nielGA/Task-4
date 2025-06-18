import { DatabaseFacade } from '../facades/DatabaseFacade';

export interface Payment {
    id?: number;
    service: string;
    amount: number;
    status: string;
    created_at?: string;
    payment_data?: string;
}

export class PaymentModel {
    private db: DatabaseFacade;

    constructor() {
        this.db = new DatabaseFacade();
        this.initializeDB();
    }

    private async initializeDB() {
        await this.db.initialize();
        await this.db.runQuery(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service TEXT NOT NULL,
                amount REAL NOT NULL,
                status TEXT NOT NULL,
                payment_data TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async add(service: string, amount: number, status: string, paymentData?: any): Promise<Payment> {
        const result = await this.db.runQuery(
            `INSERT INTO payments (service, amount, status, payment_data) VALUES (?, ?, ?, ?)`,
            [service, amount, status, paymentData ? JSON.stringify(paymentData) : null]
        );

        return {
            id: result.lastID,
            service,
            amount,
            status,
            payment_data: paymentData ? JSON.stringify(paymentData) : undefined,
            created_at: new Date().toISOString(),
        };
    }

    public async getAll(): Promise<Payment[]> {
        return this.db.allQuery('SELECT * FROM payments ORDER BY created_at DESC');
    }

    public async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
        return this.db.allQuery(
            'SELECT * FROM payments WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
            [startDate, endDate]
        );
    }

    public async getByService(service: string): Promise<Payment[]> {
        return this.db.allQuery(
            'SELECT * FROM payments WHERE service = ? ORDER BY created_at DESC',
            [service]
        );
    }

    public async getByStatus(status: string): Promise<Payment[]> {
        return this.db.allQuery(
            'SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC',
            [status]
        );
    }
}