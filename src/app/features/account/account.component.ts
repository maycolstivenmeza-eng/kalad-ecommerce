import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { SavedAddress } from '../../shared/services/address.service';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { PedidosService, Pedido } from '../../shared/services/pedidos.service';
import { UserDataService } from '../../shared/services/user-data.service';

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
  addresses$?: Observable<SavedAddress[]>;
  pedidos$?: Observable<Pedido[]>;

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
    private userDataService: UserDataService,
    private pedidosService: PedidosService,
    private router: Router
  ) {}

  async ngOnInit() {
    const logged = await firstValueFrom(this.authService.isLoggedIn$);
    if (!logged) {
      await this.authService.loginWithGoogle().catch(() => {
        this.router.navigate(['/home']);
      });
    }
    this.addresses$ = await this.userDataService.listAddresses$();
    this.pedidos$ = await this.pedidosService.misPedidos$();
    await this.userDataService.saveAuthProfile();
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
    this.userDataService.addAddress(this.newAddress);
    this.newAddress = { label: '', line1: '', city: '', region: '', postal: '' };
  }

  removeAddress(id: string) {
    this.userDataService.deleteAddress(id);
  }
}
