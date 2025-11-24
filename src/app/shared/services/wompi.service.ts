import { environment } from "../../../environments/environment";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

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
  providedIn: "root",
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

      if (document.querySelector("#wompi-script")) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.wompi.co/widget.js";
      script.id = "wompi-script";
      script.async = true;

      script.onload = () => {
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  //----------------------------------------------------------------------
  // 2. ABRIR CHECKOUT (LEGADO) -> REDIRIGE AL FLUJO SEGURO
  //----------------------------------------------------------------------
  async openCheckout(
    config: Partial<WompiCheckoutConfig>,
    onResult?: (transaction: any) => Promise<void> | void
  ): Promise<void> {
    const reference = config.reference || this.generateReference();
    await this.openCheckoutFromBackend(reference, config, onResult);
  }

  //----------------------------------------------------------------------
  // 3. ABRIR CHECKOUT USANDO CONFIG GENERADA EN BACKEND
  //----------------------------------------------------------------------
  async openCheckoutFromBackend(
    pedidoId: string,
    extraConfig: Partial<WompiCheckoutConfig> = {},
    onResult?: (transaction: any) => Promise<void> | void
  ): Promise<void> {
    await this.loadWompiScript();

    const base =
      (environment as any)?.wompi?.functionsBase ||
      `https://us-central1-${environment.firebase.projectId}.cloudfunctions.net`;
    const url = `${base}/createWompiCheckout`;

    const backendConfig = await firstValueFrom(
      this.http.post<any>(url, { pedidoId })
    );

    const checkoutConfig: WompiCheckoutConfig = {
      currency: backendConfig.currency || environment.wompi.currency,
      amountInCents: backendConfig.amountInCents,
      reference: backendConfig.reference || pedidoId,
      publicKey: backendConfig.publicKey || environment.wompi.publicKey,
      redirectUrl: environment.wompi.redirectUrl,
      signature: backendConfig.signature,
      ...extraConfig,
    };

    this.widgetCheckout = new window.WidgetCheckout(checkoutConfig);

    // Esperar a que el usuario complete/cierre el checkout
    await new Promise<void>((resolve) => {
      this.widgetCheckout.open(async (result: any) => {
        const tx = result.transaction;

        if (onResult) {
          await onResult(tx);
        }

        resolve();
      });
    });
  }

  //----------------------------------------------------------------------
  // REFERENCIA ÚNICA (RESERVA)
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
  // VERIFICAR TRANSACCIÓN (FRONT)
  //----------------------------------------------------------------------
  async verifyTransaction(id: string): Promise<any> {
    if (!id) throw new Error("Id de transaccion requerido");
    const base = (environment as any)?.wompi?.apiBase || "https://sandbox.wompi.co";
    const url = `${base}/v1/transactions/${id}`;
    const resp = await firstValueFrom(this.http.get<any>(url));
    return resp?.data;
  }
}
