import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PedidosService, Pedido } from '../../shared/services/pedidos.service';
import { Observable } from 'rxjs';

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
  pedido$?: Observable<Pedido | undefined>;

  constructor(private route: ActivatedRoute, private pedidosService: PedidosService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.orderReference = params['id'] || this.generateOrderReference();
      this.paymentStatus = params['status'] || 'APPROVED';
      this.transactionId = params['transactionId'] || null;

      if (this.orderReference) {
        this.pedido$ = this.pedidosService.obtenerPedido(this.orderReference);
      }
    });
  }

  private generateOrderReference(): string {
    return `KALAD-${Date.now()}`;
  }

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
