import { validateEmail, validateText, validateCardNumber, validateCVV, validateExpiration, validateAmount } from '../utils/validators';
import 'dotenv/config';
import axios from 'axios';
import { PaymentModel } from '../models/PaymentModel';

// Instancia global de PaymentModel
let paymentModelInstance: PaymentModel | null = null;

// Función para obtener la instancia inicializada
async function getPaymentModel(): Promise<PaymentModel> {
    if (!paymentModelInstance) {
        paymentModelInstance = new PaymentModel();
        // Esperar a que se inicialice completamente
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return paymentModelInstance;
}

export class PaymentService {
    private readonly NAME_MIN = 2;
    private readonly NAME_MAX = 100;
    private readonly ALLOWED_CURRENCIES = ['USD', 'EUR'];
    private readonly PAYMENT_API = 'https://fakepayment.onrender.com/';
    private readonly FAKE_PAY = process.env.FAKE_PAY;

    private async getPaymentModel(): Promise<PaymentModel> {
        return await getPaymentModel();
    } 

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.FAKE_PAY}`,
            'Content-Type': 'application/json'
        };
    }

    public async processPayment(
        service: string,
        email: string,
        cardholderName: string,
        cardNumber: string,
        expMonth: string,
        expYear: string,
        cvv: string,
        amount: number,
        currency: string,
        description: string,
        reference: string
    ) {
        
        // Procesamiento con el proveedor
        //const paymentResult = await this.processWithProvider(service, amount, currency);


    this.validateInput(
        service,
        email,
        cardholderName,
        cardNumber,
        expMonth,
        expYear,
        cvv,
        amount,
        currency
    )

        try {
            // Limpiar espacios del número de tarjeta para la API
            const cleanCardNumber = cardNumber.replace(/\s+/g, '');
            
            const paymentData = {
                amount: amount,
                'card-number': cleanCardNumber,
                cvv: cvv,
                'expiration-month': expMonth,
                'expiration-year': expYear,
                'full-name': cardholderName,
                currency: currency,
                description: description,
                reference: reference
            };
            const response = await axios.post(`${this.PAYMENT_API}payments`, paymentData, { headers: this.getHeaders() });
            console.log('id: ' + response.data.data.transaction_id)
            console.log('Respuesta API:', JSON.stringify(response.data, null, 2));

            // Save payment to database
            const paymentStatus = response.data.success ? 'completed' : 'failed';
            const paymentModel = await this.getPaymentModel();
            await paymentModel.add(
                service,
                amount,
                paymentStatus,
                {
                    transactionId: response.data.data.transaction_id,
                    currency: currency,
                    description: description,
                    reference: reference,
                    cardholderName: cardholderName,
                    email: email
                }
            );

            // La respuesta de la API externa debería contener la información del resultado del pago
            return {
                success: true,
                transactionId: response.data.data.transaction_id, 
                message: 'Pago realizado',
                // Puedes incluir más información de la respuesta si es necesario
            };

        } catch (error: any) {
            console.error('Respuesta de la API (data):', JSON.stringify(error.response.data, null, 2));
            console.error('Error al procesar el pago con la API externa:', error.message);
            
            // Generate unique transaction ID for failed payment
            const failedTransactionId = `FAILED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Save failed payment to database
            try {
                const paymentModel = await this.getPaymentModel();
                await paymentModel.add(
                    service,
                    amount,
                    'failed',
                    {
                        transactionId: failedTransactionId,
                        error: error.message,
                        currency: currency,
                        description: description,
                        reference: reference,
                        cardholderName: cardholderName,
                        email: email
                    }
                );
            } catch (dbError) {
                console.error('Error saving failed payment to database:', dbError);
            }
            
            throw new Error('Error al procesar el pago');
        }

    }

    public validateInput(
        service: string,
        email: string,
        cardholderName: string,
        cardNumber: string,
        expMonth: string,
        expYear: string,
        cvv: string,
        amount: number,
        currency: string
    ) {
      if (!this.ALLOWED_CURRENCIES.includes(currency)) {
            throw new Error(`Moneda no permitida: ${currency}`);
      }

        // Validación de proveedor
      if (!['Stripe', 'PayPal', 'MercadoPago'].includes(service)) {
          throw new Error('Proveedor no soportado');
      }

      if (!validateText(cardholderName, this.NAME_MIN, this.NAME_MAX)) {
      throw new Error(`Nombre del titular debe tener entre ${this.NAME_MIN}-${this.NAME_MAX} caracteres`);
      }

      if (!validateCardNumber(cardNumber)) throw new Error('Número de tarjeta inválido');

      if (!validateExpiration(expMonth, expYear)) {
        throw new Error('Fecha de expiración inválida o fuera de rango');
      }

      if (!validateCVV(cvv)) throw new Error('CVV inválido (3-4 dígitos)');

      if (!validateAmount(amount)) throw new Error('Monto inválido');

      if (!validateEmail(email)) {
            throw new Error('Email inválido');
      }

    }

    public async getTransaction(transactionId: string): Promise<any> {
        try {
            const response = await axios.get(`${this.PAYMENT_API}payments/${transactionId}`, { headers: this.getHeaders() });
            
            console.log(response.data);
        } catch (error: any) {
          console.log(transactionId)
          console.log(`${this.PAYMENT_API}payments/:${transactionId}`)
            console.error('Error al obtener la transacción:', error.message);
        }
    }

    private async processWithProvider(service: string, amount: number, currency: string) {
        // Lógica específica de cada proveedor
        if (service === 'stripe') {
            return { id: `stripe_${Math.random().toString(36).slice(2)}` };
        } else {
            return { id: `paypal_${Math.random().toString(36).slice(2)}` };
        }
    }
}
