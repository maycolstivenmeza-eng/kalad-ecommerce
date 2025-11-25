import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class NewsletterService {
  private readonly COLLECTION_NAME = 'newsletter_subscriptions';

  constructor(private firestore: Firestore) {}

  async subscribe(email: string, source: string = 'footer'): Promise<void> {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Correo vacío');
    }

    const colRef = collection(this.firestore, this.COLLECTION_NAME);
    await addDoc(colRef, {
      email: cleanEmail,
      source,
      createdAt: new Date().toISOString(),
    });
  }
}

