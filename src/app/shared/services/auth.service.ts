import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup
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
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /** Login con Google */
  async loginWithGoogle(): Promise<any> {
    const authMod = await import('firebase/auth');
    const provider = new (authMod as any).GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(this.auth, provider as any);
  }

  /** Logout */
  logout() {
    return signOut(this.auth);
  }
}
