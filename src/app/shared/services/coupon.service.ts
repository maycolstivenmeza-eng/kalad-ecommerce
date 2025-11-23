import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  collectionData,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export type Coupon = {
  codigo: string;
  activo: boolean;
  porcentaje: number; // ej: 10 -> 10%
  minSubtotal?: number;
};

export type CouponDoc = Coupon & { id: string };

@Injectable({ providedIn: 'root' })
export class CouponService {
  constructor(private firestore: Firestore) {}

  // =====================================
  // ADMIN: CRUD de cupones globales
  // =====================================
  getAll(): Observable<CouponDoc[]> {
    const ref = collection(this.firestore, 'cupones');
    return collectionData(ref, { idField: 'id' }) as Observable<CouponDoc[]>;
  }

  async save(coupon: Coupon): Promise<void> {
    const codigo = coupon.codigo.trim().toUpperCase();
    if (!codigo) throw new Error('El código de cupón es obligatorio');

    const ref = doc(this.firestore, `cupones/${codigo}`);
    const payload: Coupon = {
      ...coupon,
      codigo,
    };

    await setDoc(ref, payload, { merge: true });
  }

  async delete(codigo: string): Promise<void> {
    const code = codigo.trim().toUpperCase();
    if (!code) return;
    const ref = doc(this.firestore, `cupones/${code}`);
    await deleteDoc(ref);
  }

  // =====================================
  // APLICACIÓN DE CUPÓN EN CARRITO/CHECKOUT
  // =====================================
  async validate(code: string, subtotal: number): Promise<number> {
    const codigo = code.trim().toUpperCase();
    const ref = doc(this.firestore, `cupones/${codigo}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Cupón no existe');
    }
    const data = snap.data() as Coupon;
    if (!data.activo) {
      throw new Error('Cupón inactivo');
    }
    if (data.minSubtotal && subtotal < data.minSubtotal) {
      throw new Error(`Mínimo ${data.minSubtotal} para este cupón`);
    }
    const porcentaje = Number(data.porcentaje || 0);
    if (porcentaje <= 0) return 0;
    return Math.round(subtotal * (porcentaje / 100));
  }
}

