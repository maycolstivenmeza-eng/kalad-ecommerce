import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart.service';
import { Observable, firstValueFrom, map } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  cartItems$: Observable<CartItem[]> = this.cartService.items$;
  cartCount$ = this.cartService.items$.pipe(
    map((items) => items.reduce((acc, item) => acc + item.qty, 0))
  );
  cartTotal$ = this.cartService.items$.pipe(
    map((items) => items.reduce((acc, item) => acc + item.qty * item.precio, 0))
  );
  favorites$ = this.favoritesService.favorites$;
  favoritesCount$ = this.favoritesService.favorites$.pipe(
    map((items) => items.length)
  );
  isLoggedIn$ = this.authService.isLoggedIn$;

  cartOpen = false;
  favoritesOpen = false;
  authMenuOpen = false;

  constructor(
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router
  ) {}

  toggleCart(event: Event) {
    event.stopPropagation();
    this.cartOpen = !this.cartOpen;
    if (this.cartOpen) {
      this.favoritesOpen = false;
      this.authMenuOpen = false;
    }
  }

  toggleFavorites(event: Event) {
    event.stopPropagation();
    this.favoritesOpen = !this.favoritesOpen;
    if (this.favoritesOpen) {
      this.cartOpen = false;
      this.authMenuOpen = false;
    }
  }

  toggleAuthMenu(event: Event) {
    event.stopPropagation();
    this.authMenuOpen = !this.authMenuOpen;
    if (this.authMenuOpen) {
      this.cartOpen = false;
      this.favoritesOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header-cart') && !target.closest('.header-fav') && !target.closest('.header-auth')) {
      this.cartOpen = false;
      this.favoritesOpen = false;
      this.authMenuOpen = false;
    }
  }

  goToCart() {
    this.cartOpen = false;
    this.router.navigate(['/cart']);
  }

  async goToCheckout() {
    this.cartOpen = false;
    const logged = await this.ensureLoggedIn();
    if (!logged) return;
    this.router.navigate(['/checkout']);
  }

  removeItem(item: CartItem) {
    this.cartService.removeItem(item.id, item.color);
  }

  async removeFavorite(id?: string) {
    const logged = await this.ensureLoggedIn();
    if (!logged) return;
    this.favoritesService.remove(id);
  }

  goToProduct(id?: string) {
    if (!id) return;
    this.favoritesOpen = false;
    this.router.navigate(['/products', id]);
  }

  private async ensureLoggedIn(): Promise<boolean> {
    const already = await firstValueFrom(this.authService.isLoggedIn$);
    if (already) return true;
    try {
      await this.authService.loginWithGoogle();
      return true;
    } catch (e) {
      console.warn('Login cancelado o fallido', e);
      return false;
    }
  }

  async loginWithGoogle(event?: Event) {
    event?.stopPropagation();
    try {
      await this.authService.loginWithGoogle();
      this.authMenuOpen = false;
    } catch (e) {
      console.warn('Login cancelado o fallido', e);
    }
  }

  async logout(event?: Event) {
    event?.stopPropagation();
    await this.authService.logout();
    this.authMenuOpen = false;
  }
}

