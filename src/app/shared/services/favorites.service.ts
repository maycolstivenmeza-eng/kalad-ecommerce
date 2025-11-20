import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  setDoc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class FavoritesService implements OnDestroy {
  private favoritesSubject = new BehaviorSubject<Product[]>([]);
  favorites$ = this.favoritesSubject.asObservable();
  private authSub?: Subscription;
  private favSub?: Subscription;

  constructor(private firestore: Firestore, private auth: Auth) {
    this.authSub = authState(this.auth).subscribe((user) => {
      this.favSub?.unsubscribe();
      if (user) {
        const col = collection(this.firestore, `usuarios/${user.uid}/favoritos`);
        this.favSub = collectionData(col, { idField: 'id' }).subscribe((items) => {
          this.favoritesSubject.next(items as Product[]);
        });
      } else {
        this.favoritesSubject.next([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.favSub?.unsubscribe();
  }

  private async requireUid(): Promise<string> {
    const user =
      (this.auth as any).currentUser ||
      (await firstValueFrom(authState(this.auth)));
    if (!user) {
      throw new Error('Debes iniciar sesión para usar favoritos');
    }
    return user.uid;
  }

  async toggle(product: Product) {
    const uid = await this.requireUid();
    const exists = this.isFavorite(product.id);
    const ref = doc(this.firestore, `usuarios/${uid}/favoritos/${product.id}`);

    if (exists) {
      await deleteDoc(ref);
    } else {
      const payload = {
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen ?? product.imagenes?.[0] ?? '',
        id: product.id
      };
      await setDoc(ref, payload, { merge: true });
    }
  }

  async remove(id?: string) {
    if (!id) return;
    const uid = await this.requireUid();
    const ref = doc(this.firestore, `usuarios/${uid}/favoritos/${id}`);
    await deleteDoc(ref);
  }

  clearLocal() {
    this.favoritesSubject.next([]);
  }

  isFavorite(id?: string): boolean {
    if (!id) return false;
    return this.favoritesSubject.getValue().some((p) => p.id === id);
  }
}
