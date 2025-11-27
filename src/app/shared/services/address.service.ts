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
  private subject = new BehaviorSubject<SavedAddress[]>(this.load());
  addresses$ = this.subject.asObservable();

  private load(): SavedAddress[] {
    // Por privacidad ya no persistimos direcciones completas en localStorage.
    // La fuente de verdad de las direcciones es Firestore (UserDataService).
    return [];
  }

  private persist(list: SavedAddress[]) {
    this.subject.next(list);
  }

  add(address: Omit<SavedAddress, 'id'>) {
    const current = this.subject.getValue();
    const id = crypto.randomUUID();
    const updated = [...current, { ...address, id }];
    this.persist(updated);
  }

  remove(id: string) {
    this.persist(this.subject.getValue().filter((a) => a.id !== id));
  }

  clear() {
    this.persist([]);
  }
}

