import { Injectable } from "@angular/core";
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  serverTimestamp,
  query,
  where,
  orderBy,
  updateDoc
} from '@angular/fire/firestore';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export type PedidoItem = {
  productId: string;
  nombre: string;
  qty: number;
  precio: number;
  color?: string;
};

export type Pedido = {
  id?: string;
  userId: string;
  items: PedidoItem[];
  total: number;
  // Totales y costos
  subtotal?: number;
  envio?: number;
  descuento?: number;
  cupon?: string;
  comision?: number;
  comisionPorcentaje?: number;
  comisionFija?: number;
  // Datos de contacto / envío
  nombreCliente?: string;
  emailCliente?: string;
  telefonoCliente?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  direccionEnvio?: string;
  ciudadEnvio?: string;
  departamentoEnvio?: string;
  codigoPostal?: string;
  notasCliente?: string;
  // Gestión interna
  guiaEnvio?: string;
  notaAdmin?: string;
  estado: 'creado' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';
  transaccionId?: string;
  createdAt?: any;
};

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private collectionName = 'pedidos';

  constructor(private firestore: Firestore, private auth: Auth) {}

  private async requireUid(): Promise<string> {
    let user = (this.auth as any).currentUser;
    if (!user) {
      const cred = await signInAnonymously(this.auth);
      user = cred.user;
    }
    return user.uid;
  }

  async crearPedido(
    items: PedidoItem[],
    total: number,
    estado: Pedido['estado'] = 'creado',
    extra: Partial<Pedido> = {}
  ): Promise<string> {
    const uid = await this.requireUid();
    const col = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(col, {
      userId: uid,
      items,
      total,
      estado,
      ...extra,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  async misPedidos$(): Promise<Observable<Pedido[]>> {
    const uid = await this.requireUid();
    const col = collection(this.firestore, this.collectionName);
    const q = query(col, where('userId', '==', uid), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
  }

  obtenerPedido(id: string): Observable<Pedido | undefined> {
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<Pedido | undefined>;
  }

  async obtenerPedidosAdmin(): Promise<Observable<Pedido[]>> {
    const col = collection(this.firestore, this.collectionName);
    const q = query(col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
  }

  async actualizarPedido(id: string, data: Partial<Pedido>) {
    if (!id) throw new Error('Pedido invalido');
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    const payload: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        (payload as any)[key] = value;
      }
    });
    await updateDoc(ref, payload);
  }
}
