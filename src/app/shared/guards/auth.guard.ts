import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/admin/login']);
        return of(false);
      }
      return from(user.getIdTokenResult(true)).pipe(
        map((token: any) => {
          const isAdmin = !!token?.claims?.admin;
          if (!isAdmin) {
            router.navigate(['/admin/login']);
          }
          return isAdmin;
        })
      );
    })
  );
};
