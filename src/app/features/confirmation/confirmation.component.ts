import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.css'
})
export class ConfirmationComponent implements OnInit {
  orderReference: string | null = null;
  paymentStatus: string | null = null;
  transactionId: string | null = null;
  currentDate: Date = new Date();

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Capturar parámetros de la URL que Wompi puede enviar
    this.route.queryParams.subscribe(params => {
      this.orderReference = params['id'] || this.generateOrderReference();
      this.paymentStatus = params['status'] || 'APPROVED';
      this.transactionId = params['transactionId'] || null;

      console.log('Parámetros de confirmación:', {
        orderReference: this.orderReference,
        paymentStatus: this.paymentStatus,
        transactionId: this.transactionId
      });
    });
  }

  /**
   * Genera una referencia de orden temporal si no viene en los parámetros
   */
  private generateOrderReference(): string {
    return `KALAD-${Date.now()}`;
  }

  /**
   * Obtiene el texto legible del estado del pago
   */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'APPROVED': 'Aprobado',
      'PENDING': 'Pendiente',
      'DECLINED': 'Rechazado',
      'VOIDED': 'Anulado',
      'ERROR': 'Error'
    };

    return statusMap[status] || status;
  }
}
