# Ejemplos de Integración de Firebase

Esta guía muestra cómo integrar los servicios de Firebase en tus componentes.

## 1. Usar ProductService en el Componente de Productos

### products.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.error = 'Error al cargar los productos';
        this.loading = false;
      }
    });
  }

  // Filtrar por categoría
  filterByCategory(category: string): void {
    this.loading = true;
    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  // Filtrar por colección
  filterByCollection(collection: string): void {
    this.loading = true;
    this.productService.getProductsByCollection(collection).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }
}
```

### products.component.html

```html
<div class="products-container">
  <!-- Loading State -->
  @if (loading) {
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando productos...</p>
    </div>
  }

  <!-- Error State -->
  @if (error) {
    <div class="error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button (click)="loadProducts()">Reintentar</button>
    </div>
  }

  <!-- Products Grid -->
  @if (!loading && !error) {
    <div class="products-grid">
      @for (product of products; track product.id) {
        <div class="product-card">
          <img [src]="product.imagen" [alt]="product.nombre">
          <h3>{{ product.nombre }}</h3>
          <p class="price">{{ product.precio | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
          @if (product.stock > 0) {
            <button>Agregar al carrito</button>
          } @else {
            <p class="out-of-stock">Agotado</p>
          }
        </div>
      }
    </div>
  }
</div>
```

## 2. Usar ProductService en el Componente de Detalles

### details-products.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-details-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-products.component.html',
  styleUrl: './details-products.component.css'
})
export class DetailsProductsComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.error = null;

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.error = 'Producto no encontrado';
        this.loading = false;
      }
    });
  }
}
```

## 3. Crear un Pedido después del Pago

### checkout.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WompiService } from '../../shared/services/wompi.service';
import { OrderService } from '../../shared/services/order.service';
import { ProductService } from '../../shared/services/product.service';
import { Order, OrderStatus, PaymentStatus, OrderItem } from '../../shared/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  isProcessing = false;
  cartItems: any[] = []; // Obtener del servicio de carrito

  constructor(
    private fb: FormBuilder,
    private wompiService: WompiService,
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    // this.loadCartItems();
  }

  initializeForm(): void {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      documentType: ['CC', Validators.required],
      documentNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      department: ['', Validators.required],
      postalCode: ['', Validators.pattern(/^[0-9]{6}$/)],
      notes: ['']
    });
  }

  async processPayment(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      alert('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.isProcessing = true;

    try {
      const formValue = this.checkoutForm.value;
      const reference = `KALAD-${Date.now()}`;

      // 1. Crear el pedido en Firebase ANTES del pago
      const order: Omit<Order, 'id'> = {
        reference,
        orderDate: new Date(),
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        customerInfo: {
          fullName: formValue.fullName,
          email: formValue.email,
          phone: formValue.phone,
          documentType: formValue.documentType,
          documentNumber: formValue.documentNumber
        },
        shippingAddress: {
          address: formValue.address,
          city: formValue.city,
          department: formValue.department,
          postalCode: formValue.postalCode
        },
        items: this.cartItems.map(item => ({
          productId: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          color: item.color,
          imagen: item.imagen,
          subtotal: item.precio * item.cantidad
        })),
        subtotal: this.getTotal(),
        shippingCost: 0,
        total: this.getTotal(),
        notes: formValue.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Guardar el pedido
      const orderDoc = await this.orderService.createOrder(order);
      console.log('Pedido creado con ID:', orderDoc.id);

      // 2. Configurar el pago con Wompi
      const checkoutConfig = {
        amountInCents: this.getTotalInCents(),
        reference: reference,
        customerData: {
          email: formValue.email,
          fullName: formValue.fullName,
          phoneNumber: formValue.phone,
          phoneNumberPrefix: '+57',
          legalId: formValue.documentNumber,
          legalIdType: formValue.documentType
        },
        shippingAddress: {
          addressLine1: formValue.address,
          city: formValue.city,
          region: formValue.department,
          country: 'CO',
          phoneNumber: formValue.phone
        },
        redirectUrl: window.location.origin + `/confirmation?orderId=${orderDoc.id}`
      };

      // 3. Abrir el widget de Wompi
      await this.wompiService.openCheckout(checkoutConfig);

      // 4. Reducir el stock de los productos
      for (const item of this.cartItems) {
        await this.productService.reduceStock(item.id, item.cantidad);
      }

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Ocurrió un error al procesar el pago. Por favor intenta de nuevo.');
    } finally {
      this.isProcessing = false;
    }
  }

  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  getTotalInCents(): number {
    return this.getTotal() * 100;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
```

## 4. Actualizar el Estado del Pedido en la Confirmación

### confirmation.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../shared/services/order.service';
import { PaymentStatus } from '../../shared/models/order.model';

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
  orderId: string | null = null;
  currentDate: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async params => {
      this.orderId = params['orderId'] || null;
      this.orderReference = params['id'] || params['reference'] || null;
      this.paymentStatus = params['status'] || 'APPROVED';
      this.transactionId = params['transactionId'] || null;

      // Actualizar el estado del pago en Firebase
      if (this.orderId) {
        await this.updateOrderPayment();
      }
    });
  }

  async updateOrderPayment(): Promise<void> {
    if (!this.orderId) return;

    try {
      const paymentStatus = this.mapWompiStatusToPaymentStatus(this.paymentStatus);

      await this.orderService.updatePaymentStatus(
        this.orderId,
        paymentStatus,
        {
          transactionId: this.transactionId || undefined,
          paymentMethod: 'CARD',
          paymentDate: new Date()
        }
      );

      console.log('Estado de pago actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el estado del pago:', error);
    }
  }

  private mapWompiStatusToPaymentStatus(wompiStatus: string | null): PaymentStatus {
    switch (wompiStatus?.toLowerCase()) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'pending':
        return PaymentStatus.PENDING;
      case 'declined':
        return PaymentStatus.DECLINED;
      case 'voided':
        return PaymentStatus.VOIDED;
      default:
        return PaymentStatus.ERROR;
    }
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
```

## 5. Mostrar Historial de Pedidos

### history.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../shared/services/order.service';
import { Order } from '../../shared/models/order.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error: string | null = null;
  userEmail = 'usuario@example.com'; // Obtener del servicio de autenticación

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    // Si tienes el email del usuario
    this.orderService.getOrdersByEmail(this.userEmail).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.error = 'Error al cargar los pedidos';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'PROCESSING': 'status-processing',
      'SHIPPED': 'status-shipped',
      'DELIVERED': 'status-delivered',
      'CANCELLED': 'status-cancelled'
    };

    return statusClasses[status] || '';
  }
}
```

## 6. Panel de Administración (Ejemplo)

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../shared/services/product.service';
import { OrderService } from '../../shared/services/order.service';
import { Product } from '../../shared/models/product.model';
import { Order, OrderStatus } from '../../shared/models/order.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  products: Product[] = [];
  orders: Order[] = [];
  stats: any = null;

  constructor(
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Cargar productos
    this.productService.getAllProducts().subscribe(products => {
      this.products = products;
    });

    // Cargar pedidos
    this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders;
    });

    // Cargar estadísticas
    this.orderService.getOrderStats().then(stats => {
      this.stats = stats;
    });
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    try {
      await this.orderService.updateOrderStatus(orderId, newStatus);
      alert('Estado actualizado exitosamente');
      this.loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
    }
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    try {
      await this.productService.updateStock(productId, newStock);
      alert('Stock actualizado exitosamente');
      this.loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el stock');
    }
  }
}
```

## Notas Importantes

1. **Manejo de Errores**: Siempre maneja los errores en las suscripciones
2. **Loading States**: Muestra estados de carga para mejor UX
3. **Unsubscribe**: En componentes que no son standalone o que hacen múltiples suscripciones, recuerda hacer unsubscribe
4. **Optimistic Updates**: Considera actualizar la UI antes de confirmar con el servidor para mejor UX
5. **Caché**: Considera implementar caché para reducir lecturas de Firestore
6. **Paginación**: Para listas grandes, implementa paginación usando `startAfter()` y `limit()`
