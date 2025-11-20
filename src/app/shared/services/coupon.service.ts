import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

export type Coupon = {
  codigo: string;
  activo: boolean;
  porcentaje: number; // ej: 10 -> 10%
  minSubtotal?: number;
};

@Injectable({ providedIn: 'root' })
export class CouponService {
  constructor(private firestore: Firestore) {}

  async validate(code: string, subtotal: number): Promise<number> {
    const ref = doc(this.firestore, `cupones/${code}`);
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
