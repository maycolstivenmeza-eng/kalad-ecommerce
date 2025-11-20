import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { AddressService, SavedAddress } from '../../shared/services/address.service';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  user$ = this.authService.user$;
  favorites$ = this.favoritesService.favorites$;
  addresses$ = this.addressService.addresses$;

  newAddress: Omit<SavedAddress, 'id'> = {
    label: '',
    line1: '',
    city: '',
    region: '',
    postal: ''
  };

  constructor(
    private authService: AuthService,
    private favoritesService: FavoritesService,
    private addressService: AddressService,
    private router: Router
  ) {}

  async ngOnInit() {
    const logged = await firstValueFrom(this.authService.isLoggedIn$);
    if (!logged) {
      await this.authService.loginWithGoogle().catch(() => {
        this.router.navigate(['/home']);
      });
    }
  }

  async loginGoogle() {
    await this.authService.loginWithGoogle();
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/home']);
  }

  addAddress() {
    if (!this.newAddress.line1 || !this.newAddress.city) return;
    this.addressService.add(this.newAddress);
    this.newAddress = { label: '', line1: '', city: '', region: '', postal: '' };
  }

  removeAddress(id: string) {
    this.addressService.remove(id);
  }
}
