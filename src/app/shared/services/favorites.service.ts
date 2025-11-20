import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly storageKey = 'kalad-favorites';
  private favoritesSubject = new BehaviorSubject<Product[]>(this.loadFromStorage());
  favorites$ = this.favoritesSubject.asObservable();

  private loadFromStorage(): Product[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(list: Product[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    this.favoritesSubject.next(list);
  }

  toggle(product: Product) {
    const current = this.favoritesSubject.getValue();
    const exists = current.find((p) => p.id === product.id);
    if (exists) {
      this.persist(current.filter((p) => p.id !== product.id));
    } else {
      this.persist([...current, product]);
    }
  }

  remove(id?: string) {
    if (!id) return;
    const current = this.favoritesSubject.getValue();
    this.persist(current.filter((p) => p.id !== id));
  }

  clear() {
    this.persist([]);
  }

  isFavorite(id?: string): boolean {
    if (!id) return false;
    return this.favoritesSubject.getValue().some((p) => p.id === id);
  }
}
