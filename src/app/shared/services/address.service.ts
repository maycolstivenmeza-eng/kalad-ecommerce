import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SavedAddress = {
  id: string;
  label: string;
  line1: string;
  city: string;
  region: string;
  postal?: string;
};

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly storageKey = 'kalad-addresses';
  private readonly maxAddresses = 3;
  private subject = new BehaviorSubject<SavedAddress[]>(this.load());
  addresses$ = this.subject.asObservable();

  private load(): SavedAddress[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(list: SavedAddress[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    this.subject.next(list);
  }

  add(address: Omit<SavedAddress, 'id'>) {
    const current = this.subject.getValue();

    const norm = (v: string | undefined) => (v || '').trim().toLowerCase();
    const isSame = (a: SavedAddress, b: Omit<SavedAddress, 'id'>) =>
      norm(a.label) === norm(b.label) &&
      norm(a.line1) === norm(b.line1) &&
      norm(a.city) === norm(b.city) &&
      norm(a.region) === norm(b.region) &&
      norm(a.postal) === norm(b.postal);

    // Si ya existe exactamente la misma dirección, no agregamos otra.
    if (current.some((a) => isSame(a, address))) {
      this.persist(current);
      return;
    }

    const id = crypto.randomUUID();
    const updated = [...current, { ...address, id }];

    // Limitar a un máximo de direcciones por cliente (ej. 3)
    const trimmed =
      updated.length > this.maxAddresses ? updated.slice(updated.length - this.maxAddresses) : updated;

    this.persist(trimmed);
  }

  remove(id: string) {
    this.persist(this.subject.getValue().filter((a) => a.id !== id));
  }

  clear() {
    this.persist([]);
  }
}
