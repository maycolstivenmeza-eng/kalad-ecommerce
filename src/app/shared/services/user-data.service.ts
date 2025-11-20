import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  docData,
  collection,
  addDoc,
  collectionData,
  deleteDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { SavedAddress } from './address.service';

export type UserProfile = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  createdAt?: any;
};

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  private async requireUid(): Promise<string> {
    const user = (this.auth as any).currentUser || (await firstValueFrom((this.auth as any).authState ?? []));
    if (!user) throw new Error('Debes iniciar sesión.');
    return user.uid;
  }

  profileDoc(uid: string) {
    return doc(this.firestore, `usuarios/${uid}`);
  }

  async saveProfile(partial: Partial<UserProfile>) {
    const uid = await this.requireUid();
    const profile: UserProfile = {
      id: uid,
      ...partial,
      createdAt: serverTimestamp()
    };
    await setDoc(this.profileDoc(uid), profile, { merge: true });
  }

  async saveAuthProfile() {
    const user = (this.auth as any).currentUser || (await firstValueFrom((this.auth as any).authState ?? []));
    if (!user) return;
    const payload: Partial<UserProfile> = {
      id: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      createdAt: serverTimestamp()
    };
    await setDoc(this.profileDoc(user.uid), payload, { merge: true });
  }

  async getProfile$() {
    const uid = await this.requireUid();
    return docData(this.profileDoc(uid), { idField: 'id' }) as any;
  }

  // Direcciones
  private addrCollection(uid: string) {
    return collection(this.firestore, `usuarios/${uid}/direcciones`);
  }

  async addAddress(address: Omit<SavedAddress, 'id'>) {
    const uid = await this.requireUid();
    const col = this.addrCollection(uid);
    return await addDoc(col, { ...address, createdAt: serverTimestamp() });
  }

  async listAddresses$() {
    const uid = await this.requireUid();
    return collectionData(this.addrCollection(uid), { idField: 'id' }) as any;
  }

  async deleteAddress(id: string) {
    const uid = await this.requireUid();
    await deleteDoc(doc(this.firestore, `usuarios/${uid}/direcciones/${id}`));
  }
}
