import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  getAuth
} from '@angular/fire/auth';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);

  /** Usuario crudo de Firebase */
  user$ = authState(this.auth);

  /** Estado booleano */
  isLoggedIn$: Observable<boolean> = this.user$.pipe(
    map(user => !!user && !(user as any).isAnonymous)
  );

  /** Email del usuario admin */
  adminEmail$: Observable<string | null> = this.user$.pipe(
    map(u => u?.email ?? null)
  );

  /** Login */
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await cred.user.getIdToken(true);
    return cred;
  }

  /** Login con Google */
  async loginWithGoogle(): Promise<any> {
    const authMod = await import('firebase/auth');
    const provider = new (authMod as any).GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(this.auth, provider as any);
    await cred.user.getIdToken(true);
    return cred;
  }

  /** Logout */
  logout() {
    return signOut(this.auth);
  }

  /** Forzar refresh del token (para claims nuevos) */
  async refreshIdToken(): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) return;
    await user.getIdToken(true);
  }

  async getIdTokenResult(forceRefresh = false): Promise<any | null> {
    const user = getAuth().currentUser;
    if (!user) return null;
    return await user.getIdTokenResult(forceRefresh);
  }

  getCurrentUserEmail(): string | null {
    const user = getAuth().currentUser;
    return user?.email ?? null;
  }

}
