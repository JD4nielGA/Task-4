import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { ValidateRecaptcha } from "../middlewares/Auth";

const validateRecaptcha = new ValidateRecaptcha();

export class PaymentsController {
    private service = new PaymentService();

    // GET payments listing
    public async index(req: Request, res: Response) {
        try {
            const paymentModel = await this.getPaymentModel();
            const payments = await paymentModel.getAll();
            res.json({ success: true, payments });
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los pagos' });
        }
    }

    private async getPaymentModel() {
        const { PaymentModel } = await import('../models/PaymentModel');
        return new PaymentModel();
    }

    // POST payment processing
    public async store(req: Request, res: Response) {
        return this.add(req, res);
    }

    public async add(req: Request, res: Response) {
        try {
            await validateRecaptcha.validate(req, res, async () => {
            const { 
              service, 
              email, 
              cardholderName, 
              cardNumber, 
              expMonth, 
              expYear, 
              cvv, 
              amount, 
              currency,
              description,
              reference
            } = req.body;

            try {
            const result = await this.service.processPayment(
                service,
                email,
                cardholderName,
                cardNumber,
                expMonth,
                expYear,
                cvv,
                Number(amount),
                currency.toUpperCase(),
                description,
                reference
            );

            await this.service.getTransaction(result.transactionId);

              req.session.message = result.message;
              req.session.success = true;
            } catch (serviceError) {
              req.session.message = serviceError instanceof Error ? serviceError.message : 'Error en el pago';
              req.session.success = false;
            }
            return res.redirect('/');
            })
        } catch (error) {
            req.session.message = error instanceof Error ? error.message : 'Error en el pago';
            req.session.success = false;
            return res.redirect('/');
        }
    }
}
