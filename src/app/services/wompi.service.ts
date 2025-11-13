import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export interface WompiCheckoutConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature?: {
    integrity: string;
  };
  redirectUrl?: string;
  taxInCents?: {
    vat?: number;
    consumption?: number;
  };
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
    legalId?: string;
    legalIdType?: string;
  };
  shippingAddress?: {
    addressLine1?: string;
    city?: string;
    phoneNumber?: string;
    region?: string;
    country?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WompiService {
  private widgetCheckout: any;
  private scriptLoaded = false;

  constructor() {
    this.loadWompiScript();
  }

  /**
   * Carga el script de Wompi dinámicamente
   */
  private loadWompiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scriptLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        console.log('Wompi script loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Error loading Wompi script', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Genera la firma de integridad para Wompi usando SHA-256
   * Según especificación de Wompi: <Referencia><Monto><Moneda><SecretoIntegridad>
   * @param reference Referencia de la transacción
   * @param amountInCents Monto en centavos
   * @param currency Moneda
   * @param expirationTime Fecha de expiración opcional (ISO string)
   * @returns Firma de integridad SHA-256
   */
  private async generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
    expirationTime?: string
  ): Promise<string> {
    try {
      const integritySecret = environment.wompi.integritySecret;

      // Validar que el integrity secret esté configurado
      if (integritySecret === 'TU_CLAVE_INTEGRIDAD_AQUI') {
        console.warn('⚠️ Integrity secret no configurado. Por favor configúralo en environment.ts');
        throw new Error('Integrity secret not configured');
      }

      // Concatenar según especificación de Wompi
      // Sin expiración: "<Referencia><Monto><Moneda><SecretoIntegridad>"
      // Con expiración: "<Referencia><Monto><Moneda><FechaExpiracion><SecretoIntegridad>"
      let cadenaConcatenada: string;

      if (expirationTime) {
        cadenaConcatenada = `${reference}${amountInCents}${currency}${expirationTime}${integritySecret}`;
      } else {
        cadenaConcatenada = `${reference}${amountInCents}${currency}${integritySecret}`;
      }

      console.log('📝 Cadena concatenada:', cadenaConcatenada);

      // Codificar la cadena
      const encodedText = new TextEncoder().encode(cadenaConcatenada);

      // Generar hash SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedText);

      // Convertir el ArrayBuffer a hexadecimal
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('✅ Firma de integridad SHA-256 generada:', hashHex);
      return hashHex;

    } catch (error) {
      console.error('Error generando firma de integridad:', error);
      throw error;
    }
  }

  /**
   * Abre el checkout de Wompi
   * @param config Configuración del checkout
   */
  async openCheckout(config: Partial<WompiCheckoutConfig>): Promise<void> {
    try {
      // Asegurarse de que el script esté cargado
      await this.loadWompiScript();

      // Configuración por defecto
      const defaultConfig: WompiCheckoutConfig = {
        currency: environment.wompi.currency,
        amountInCents: config.amountInCents || 5000000, // $50,000 COP por defecto
        reference: config.reference || this.generateReference(),
        publicKey: environment.wompi.publicKey,
        redirectUrl: config.redirectUrl || environment.wompi.redirectUrl
      };

      // Combinar configuración
      const checkoutConfig = { ...defaultConfig, ...config };

      // Validar que la clave pública esté configurada
      if (checkoutConfig.publicKey === 'TU_CLAVE_PUBLICA_AQUI') {
        alert('⚠️ Por favor configura tu clave pública de Wompi en src/environments/environment.ts');
        console.error('Wompi public key not configured');
        return;
      }

      // Generar la firma de integridad
      try {
        const integritySignature = await this.generateIntegritySignature(
          checkoutConfig.reference,
          checkoutConfig.amountInCents,
          checkoutConfig.currency
        );

        // Agregar la firma a la configuración
        checkoutConfig.signature = {
          integrity: integritySignature
        };

        console.log('📝 Configuración del checkout:', {
          reference: checkoutConfig.reference,
          amount: checkoutConfig.amountInCents,
          currency: checkoutConfig.currency,
          signature: integritySignature
        });

      } catch (signatureError) {
        alert('⚠️ Error: Por favor configura tu clave de integridad (integrity secret) en src/environments/environment.ts\n\nLa firma de integridad es obligatoria para procesar pagos.');
        console.error('Signature generation failed:', signatureError);
        return;
      }

      // Crear instancia del widget
      this.widgetCheckout = new window.WidgetCheckout(checkoutConfig);

      // Abrir el widget
      this.widgetCheckout.open((result: any) => {
        const transaction = result.transaction;
        console.log('Transaction result:', transaction);

        // Manejar el resultado de la transacción
        if (transaction.status === 'APPROVED') {
          console.log('✅ Pago aprobado:', transaction);
          this.handleApprovedPayment(transaction);
        } else if (transaction.status === 'DECLINED') {
          console.log('❌ Pago rechazado:', transaction);
          this.handleDeclinedPayment(transaction);
        } else if (transaction.status === 'ERROR') {
          console.log('⚠️ Error en el pago:', transaction);
          this.handleErrorPayment(transaction);
        }
      });

    } catch (error) {
      console.error('Error opening Wompi checkout:', error);
      alert('Error al abrir el checkout de pago. Por favor intenta de nuevo.');
    }
  }

  /**
   * Genera una referencia única para la transacción
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `KALAD-${timestamp}-${random}`;
  }

  /**
   * Maneja el pago aprobado
   */
  private handleApprovedPayment(transaction: any): void {
    alert(`✅ ¡Pago aprobado exitosamente!\n\nReferencia: ${transaction.reference}\nID: ${transaction.id}`);
    // Aquí puedes agregar lógica adicional:
    // - Guardar la transacción en tu base de datos
    // - Enviar email de confirmación
    // - Redirigir a página de confirmación
    // window.location.href = '/confirmacion?ref=' + transaction.reference;
  }

  /**
   * Maneja el pago rechazado
   */
  private handleDeclinedPayment(transaction: any): void {
    alert(`❌ Pago rechazado\n\nReferencia: ${transaction.reference}\nMotivo: ${transaction.status_message || 'No especificado'}`);
    // Aquí puedes agregar lógica adicional
  }

  /**
   * Maneja errores en el pago
   */
  private handleErrorPayment(transaction: any): void {
    alert(`⚠️ Error en el proceso de pago\n\nPor favor intenta de nuevo o contacta con soporte.`);
    // Aquí puedes agregar lógica adicional
  }

  /**
   * Cierra el checkout si está abierto
   */
  closeCheckout(): void {
    if (this.widgetCheckout) {
      this.widgetCheckout.close();
    }
  }
}
