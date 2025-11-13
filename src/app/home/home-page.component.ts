import { Component } from '@angular/core';
import { WompiService } from '../services/wompi.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

  constructor(private wompiService: WompiService) {}

  /**
   * Abre el checkout de Wompi cuando se hace clic en el botón hero
   */
  openWompiCheckout(): void {
    // Configuración del pago de prueba
    const checkoutConfig = {
      amountInCents: 15000000, // $150,000 COP (monto de ejemplo para una mochila)
      reference: `KALAD-ORIGEN-${Date.now()}`,
      customerData: {
        email: 'cliente@ejemplo.com', // Puedes hacer esto dinámico
        fullName: 'Cliente Ejemplo',
        phoneNumber: '3001234567',
        phoneNumberPrefix: '+57'
      }
    };

    // Abrir el widget de Wompi
    this.wompiService.openCheckout(checkoutConfig);
  }
}
