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
    const id = crypto.randomUUID();
    this.persist([...this.subject.getValue(), { ...address, id }]);
  }

  remove(id: string) {
    this.persist(this.subject.getValue().filter((a) => a.id !== id));
  }

  clear() {
    this.persist([]);
  }
}
