export interface Order {
  id?: string;
  reference: string;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Información del cliente
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
  };

  // Dirección de envío
  shippingAddress: {
    address: string;
    city: string;
    department: string;
    postalCode?: string;
  };

  // Artículos del pedido
  items: OrderItem[];

  // Costos
  subtotal: number;
  shippingCost: number;
  total: number;

  // Información de pago
  paymentInfo?: {
    transactionId?: string;
    paymentMethod?: string;
    paymentDate?: Date;
  };

  // Notas
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  color: string;
  imagen: string;
  subtotal: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR'
}
