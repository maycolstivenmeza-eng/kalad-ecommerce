import { environment } from '../../../environments/environment';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  //----------------------------------------------------------------------
  // 1. CARGAR SCRIPT DINÁMICO DE WOMPI
  //----------------------------------------------------------------------
  private loadWompiScript(): Promise<void> {
    return new Promise((resolve) => {
      if (!isPlatformBrowser(this.platformId)) {
        resolve();
        return;
      }

      // Si ya está cargado, evitar duplicarlo
      if (document.querySelector('#wompi-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.id = 'wompi-script';
      script.async = true;

      script.onload = () => {
        console.log('Wompi script loaded');
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  //----------------------------------------------------------------------
  // 2. GENERAR FIRMA SHA-256
  //----------------------------------------------------------------------
  private async generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): Promise<string> {
    const secret = environment.wompi.integritySecret;

    if (!secret || secret === 'TU_CLAVE_INTEGRIDAD_AQUI') {
      throw new Error('Integrity secret not configured');
    }

    const raw = `${reference}${amountInCents}${currency}${secret}`;
    const encoded = new TextEncoder().encode(raw);
    const hash = await crypto.subtle.digest('SHA-256', encoded);

    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  //----------------------------------------------------------------------
  // 3. ABRIR CHECKOUT CON CALLBACK
  //----------------------------------------------------------------------
  async openCheckout(
    config: Partial<WompiCheckoutConfig>,
    onResult?: (transaction: any) => Promise<void> | void
  ): Promise<void> {
    await this.loadWompiScript();

    // Config base
    const checkoutConfig: WompiCheckoutConfig = {
      currency: environment.wompi.currency,
      amountInCents: config.amountInCents!,
      reference: config.reference || this.generateReference(),
      publicKey: environment.wompi.publicKey,
      redirectUrl: environment.wompi.redirectUrl,
      ...config
    };

    // Firma de integridad
    const integrity = await this.generateIntegritySignature(
      checkoutConfig.reference,
      checkoutConfig.amountInCents,
      checkoutConfig.currency
    );

    checkoutConfig.signature = { integrity };

    console.log('Wompi Checkout Config:', checkoutConfig);

    // Crear widget
    this.widgetCheckout = new window.WidgetCheckout(checkoutConfig);

    // ABRIR EL WIDGET Y MANEJAR EL RESULTADO
    this.widgetCheckout.open(async (result: any) => {
      const tx = result.transaction;
      console.log('Transaction result:', tx);

      // Manejo explícito por estado
      if (tx.status === 'APPROVED') {
        console.log('Pago aprobado');
      } else if (tx.status === 'DECLINED') {
        console.log('Pago rechazado');
      } else if (tx.status === 'ERROR') {
        console.log('Error en el pago');
      }

      // Si el checkout.component pasó un callback → devolverle el resultado
      if (onResult) {
        await onResult(tx);
      }
    });
  }

  //----------------------------------------------------------------------
  // REFERENCIA ÚNICA
  //----------------------------------------------------------------------
  private generateReference(): string {
    return `KALAD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  //----------------------------------------------------------------------
  // CERRAR WIDGET
  //----------------------------------------------------------------------
  closeCheckout(): void {
    this.widgetCheckout?.close();
  }

  //----------------------------------------------------------------------
  // VERIFICAR TRANSACCION (sin backend)
  //----------------------------------------------------------------------
  async verifyTransaction(id: string): Promise<any> {
    if (!id) throw new Error('Id de transaccion requerido');
    const base = (environment as any)?.wompi?.apiBase || 'https://sandbox.wompi.co';
    const url = `${base}/v1/transactions/${id}`;
    const resp = await firstValueFrom(this.http.get<any>(url));
    return resp?.data;
  }
}
