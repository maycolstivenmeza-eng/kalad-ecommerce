import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Order, OrderStatus, PaymentStatus } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly COLLECTION_NAME = 'orders';

  constructor(private firestore: Firestore) {}

  /**
   * Crea un nuevo pedido
   */
  async createOrder(order: Omit<Order, 'id'>) {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);

    // Convertir fechas a Timestamp de Firestore
    const orderData = {
      ...order,
      orderDate: Timestamp.fromDate(order.orderDate),
      createdAt: Timestamp.fromDate(order.createdAt),
      updatedAt: Timestamp.fromDate(order.updatedAt),
      paymentInfo: order.paymentInfo
        ? {
            ...order.paymentInfo,
            paymentDate: order.paymentInfo.paymentDate
              ? Timestamp.fromDate(order.paymentInfo.paymentDate)
              : null
          }
        : undefined
    };

    return await addDoc(ordersCollection, orderData);
  }

  /**
   * Obtiene todos los pedidos
   */
  getAllOrders(): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /**
   * Obtiene un pedido por su ID
   */
  getOrderById(id: string): Observable<Order> {
    const orderDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return docData(orderDoc, { idField: 'id' }) as Observable<Order>;
  }

  /**
   * Obtiene un pedido por su referencia
   */
  getOrderByReference(reference: string): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(ordersCollection, where('reference', '==', reference));
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /**
   * Obtiene pedidos por email del cliente
   */
  getOrdersByEmail(email: string): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      ordersCollection,
      where('customerInfo.email', '==', email),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /**
   * Obtiene pedidos por estado
   */
  getOrdersByStatus(status: OrderStatus): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      ordersCollection,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /**
   * Obtiene pedidos por estado de pago
   */
  getOrdersByPaymentStatus(paymentStatus: PaymentStatus): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      ordersCollection,
      where('paymentStatus', '==', paymentStatus),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /**
   * Obtiene pedidos recientes (últimos 30 días)
   */
  getRecentOrders(days: number = 30): Observable<Order[]> {
    const ordersCollection = collection(this.firestore, this.COLLECTION_NAME);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      ordersCollection,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /**
   * Actualiza el estado de un pedido
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const orderDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return await updateDoc(orderDoc, {
      status,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Actualiza el estado de pago de un pedido
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentInfo?: {
      transactionId?: string;
      paymentMethod?: string;
      paymentDate?: Date;
    }
  ): Promise<void> {
    const orderDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);

    const updateData: any = {
      paymentStatus,
      updatedAt: Timestamp.now()
    };

    if (paymentInfo) {
      updateData.paymentInfo = {
        ...paymentInfo,
        paymentDate: paymentInfo.paymentDate
          ? Timestamp.fromDate(paymentInfo.paymentDate)
          : Timestamp.now()
      };
    }

    return await updateDoc(orderDoc, updateData);
  }

  /**
   * Actualiza un pedido completo
   */
  async updateOrder(id: string, order: Partial<Order>): Promise<void> {
    const orderDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);

    const updateData: any = {
      ...order,
      updatedAt: Timestamp.now()
    };

    // Convertir fechas si existen
    if (order.orderDate) {
      updateData.orderDate = Timestamp.fromDate(order.orderDate);
    }

    return await updateDoc(orderDoc, updateData);
  }

  /**
   * Cancela un pedido
   */
  async cancelOrder(id: string): Promise<void> {
    return await this.updateOrderStatus(id, OrderStatus.CANCELLED);
  }

  /**
   * Elimina un pedido (solo para administradores)
   */
  async deleteOrder(id: string): Promise<void> {
    const orderDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return await deleteDoc(orderDoc);
  }

  /**
   * Obtiene estadísticas de pedidos
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }> {
    // Esta es una implementación básica
    // Para mejor rendimiento, considera usar Cloud Functions
    const orders = await this.getAllOrders().toPromise();

    if (!orders) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };
    }

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      processing: orders.filter((o) => o.status === OrderStatus.PROCESSING).length,
      shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length
    };
  }
}
