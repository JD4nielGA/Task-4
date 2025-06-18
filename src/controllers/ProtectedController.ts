import { Request, Response } from 'express';
import { ContactsModel } from '../models/ContactsModel';
import { PaymentModel } from '../models/PaymentModel';

// Instancias globales
let contactsModelInstance: ContactsModel | null = null;
let paymentModelInstance: PaymentModel | null = null;

// Funciones para obtener las instancias inicializadas
async function getContactsModel(): Promise<ContactsModel> {
    if (!contactsModelInstance) {
        contactsModelInstance = new ContactsModel();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return contactsModelInstance;
}

async function getPaymentModel(): Promise<PaymentModel> {
    if (!paymentModelInstance) {
        paymentModelInstance = new PaymentModel();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return paymentModelInstance;
}

export class ProtectedController {
    private async getContactsModel(): Promise<ContactsModel> {
        return await getContactsModel();
    }

    private async getPaymentModel(): Promise<PaymentModel> {
        return await getPaymentModel();
    }

    // Show contacts dashboard
    public showContacts = async (req: Request, res: Response) => {
        try {
            const contactsModel = await this.getContactsModel();
            const contacts = await contactsModel.get();
            
            res.render('protected/contacts', {
                title: 'Gestión de Contactos - TutorNest',
                contacts: contacts,
                user: res.locals.user,
                message: res.locals.message,
                success: res.locals.success
            });
        } catch (error) {
            console.error('Error al obtener contactos:', error);
            req.session.message = 'Error al cargar los contactos';
            req.session.success = false;
            res.redirect('/login');
        }
    };

    // Show payments dashboard
    public showPayments = async (req: Request, res: Response) => {
        try {
            const paymentModel = await this.getPaymentModel();
            const payments = await paymentModel.getAll();
            
            res.render('protected/payments', {
                title: 'Gestión de Pagos - TutorNest',
                payments: payments,
                user: res.locals.user,
                message: res.locals.message,
                success: res.locals.success
            });
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            req.session.message = 'Error al cargar los pagos';
            req.session.success = false;
            res.redirect('/login');
        }
    };

    // API endpoint for contacts search
    public searchContacts = async (req: Request, res: Response) => {
        try {
            const { search } = req.query;
            const contactsModel = await this.getContactsModel();
            let contacts = await contactsModel.get();
            
            if (search && typeof search === 'string') {
                const searchTerm = search.toLowerCase();
                contacts = contacts.filter((contact: any) => 
                    contact.name.toLowerCase().includes(searchTerm) ||
                    contact.email.toLowerCase().includes(searchTerm) ||
                    contact.country.toLowerCase().includes(searchTerm)
                );
            }
            
            res.json({ success: true, contacts });
        } catch (error) {
            console.error('Error en búsqueda de contactos:', error);
            res.status(500).json({ success: false, message: 'Error en la búsqueda' });
        }
    };

    // API endpoint to get all contacts
    public getContacts = async (req: Request, res: Response) => {
        try {
            console.log('📋 API: Obteniendo todos los contactos');
            const contactsModel = await this.getContactsModel();
            const contacts = await contactsModel.get();
            
            console.log(`✅ API: Se encontraron ${contacts.length} contactos`);
            res.json({ success: true, contacts });
        } catch (error) {
            console.error('❌ Error al obtener contactos:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los contactos' });
        }
    };

    // API endpoint to get all payments
    public getPayments = async (req: Request, res: Response) => {
        try {
            const paymentModel = await this.getPaymentModel();
            const payments = await paymentModel.getAll();
            
            res.json({ success: true, payments });
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los pagos' });
        }
    };

    // API endpoint for payments search
    public searchPayments = async (req: Request, res: Response) => {
        try {
            const { search, service, status, startDate, endDate } = req.query;
            const paymentModel = await this.getPaymentModel();
            let payments = await paymentModel.getAll();
            
            // Filter by search term
            if (search && typeof search === 'string') {
                const searchTerm = search.toLowerCase();
                payments = payments.filter((payment: any) => 
                    payment.service.toLowerCase().includes(searchTerm)
                );
            }
            
            // Filter by service
            if (service && typeof service === 'string' && service !== 'all') {
                payments = payments.filter((payment: any) => 
                    payment.service === service
                );
            }
            
            // Filter by status
            if (status && typeof status === 'string' && status !== 'all') {
                payments = payments.filter((payment: any) => 
                    payment.status === status
                );
            }
            
            // Filter by date range
            if (startDate && endDate) {
                payments = payments.filter((payment: any) => {
                    const paymentDate = new Date(payment.created_at);
                    const start = new Date(startDate as string);
                    const end = new Date(endDate as string);
                    return paymentDate >= start && paymentDate <= end;
                });
            }
            
            res.json({ success: true, payments });
        } catch (error) {
            console.error('Error en búsqueda de pagos:', error);
            res.status(500).json({ success: false, message: 'Error en la búsqueda' });
        }
    };

    // Dashboard home
    public showDashboard = async (req: Request, res: Response) => {
        try {
            const contactsModel = await this.getContactsModel();
            const paymentModel = await this.getPaymentModel();
            const contacts = await contactsModel.get();
            const payments = await paymentModel.getAll();
            
            const stats = {
                totalContacts: contacts.length,
                totalPayments: payments.length,
                recentContacts: contacts.slice(0, 5),
                recentPayments: payments.slice(0, 5)
            };
            
            res.render('protected/dashboard', {
                title: 'Panel de Control - TutorNest',
                stats: stats,
                user: res.locals.user,
                message: res.locals.message,
                success: res.locals.success
            });
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            req.session.message = 'Error al cargar el panel de control';
            req.session.success = false;
            res.redirect('/login');
        }
    };
}