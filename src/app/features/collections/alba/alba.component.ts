import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { Product } from '../../../shared/models/product.model';
import { ProductService } from '../../../shared/services/product.service';
import { CartService } from '../../../shared/services/cart.service';
import { FavoritesService } from '../../../shared/services/favorites.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Title, Meta } from '@angular/platform-browser';
import { Ga4Service } from '../../../shared/services/ga4.service';

type OrderOption = 'az' | 'za' | 'priceAsc' | 'priceDesc' | 'new' | 'featured';

@Component({
  selector: 'app-alba',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './alba.component.html',
  styleUrl: './alba.component.css'
})
export class AlbaComponent implements OnInit, OnDestroy {
  productos: Product[] = [];
  productosFiltrados: Product[] = [];
  orden: OrderOption = 'az';
  ordenOpciones: OrderOption[] = ['az', 'za', 'priceAsc', 'priceDesc', 'new', 'featured'];
  filtroColor = '';
  filtroCategoria = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  open = [false, false, false];

  colores = [
    { id: 'beige', label: 'Beige', hex: '#d8c8a8' },
    { id: 'cafe', label: 'Cafe', hex: '#6a4e3a' },
    { id: 'negro', label: 'Negro', hex: '#000' },
    { id: 'arena', label: 'Arena', hex: '#e8e0c8' }
  ];
  categorias: string[] = ['Mochilas', 'Bolsas'];
  private sub?: Subscription;
  private placeholderImage = 'assets/images/Producto_1.jpg';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public favorites: FavoritesService,
    private authService: AuthService,
    private title: Title,
    private meta: Meta,
    private analytics: Ga4Service
  ) {}

  async ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.title.setTitle('Colección Alba | Kalad');
    this.meta.updateTag({
      name: 'description',
      content: 'Colección Alba: mochilas artesanales Kalad inspiradas en la claridad del amanecer, tonos suaves y tejidos delicados.'
    });
    this.sub = this.productService
      .getProductsByCollection('kalad-alba')
      .subscribe((items) => {
        this.productos = [...items];
        this.aplicarFiltros();
      });
  }

  resolveImage(product: Product): string {
    return product.imagen && product.imagen.trim().length > 0
      ? product.imagen
      : this.placeholderImage;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement | null;
    if (target && !target.src.includes(this.placeholderImage)) {
      target.src = this.placeholderImage;
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(i: number) {
    this.open[i] = !this.open[i];
  }

  onOrderChange(order: OrderOption) {
    this.orden = order;
    this.aplicarFiltros();
  }

  setFiltroColor(color: string) {
    this.filtroColor = this.filtroColor === color ? '' : color;
    this.aplicarFiltros();
  }

  setFiltroCategoria(categoria: string) {
    this.filtroCategoria = this.filtroCategoria === categoria ? '' : categoria;
    this.aplicarFiltros();
  }

  setPriceRange() {
    if (this.minPrice != null && this.maxPrice != null && this.minPrice > this.maxPrice) {
      const tmp = this.minPrice;
      this.minPrice = this.maxPrice;
      this.maxPrice = tmp;
    }
    this.aplicarFiltros();
  }

  resetPrice() {
    this.minPrice = null;
    this.maxPrice = null;
    this.aplicarFiltros();
  }

  getOrderLabel(option: OrderOption): string {
    switch (option) {
      case 'az':
        return 'A - Z';
      case 'za':
        return 'Z - A';
      case 'priceAsc':
        return 'Menor precio';
      case 'priceDesc':
        return 'Mayor precio';
      case 'new':
        return 'Nuevos';
      case 'featured':
        return 'Destacados';
      default:
        return option;
    }
  }

  aplicarFiltros() {
    let lista = [...this.productos];

    if (this.filtroColor) {
      lista = lista.filter((p) => p.colores?.includes(this.filtroColor));
    }

    if (this.filtroCategoria) {
      lista = lista.filter((p) => p.categoria === this.filtroCategoria);
    }

    if (this.minPrice != null) {
      lista = lista.filter((p) => p.precio >= this.minPrice!);
    }
    if (this.maxPrice != null) {
      lista = lista.filter((p) => p.precio <= this.maxPrice!);
    }

    lista = this.ordenarLista(lista);

    this.productosFiltrados = lista;
  }

  private ordenarLista(lista: Product[]) {
    const copia = [...lista];
    switch (this.orden) {
      case 'az':
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'za':
        return copia.sort((a, b) => b.nombre.localeCompare(a.nombre));
      case 'priceAsc':
        return copia.sort((a, b) => a.precio - b.precio);
      case 'priceDesc':
        return copia.sort((a, b) => b.precio - a.precio);
      case 'new':
        return copia.sort((a, b) => {
          const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          return dateB - dateA;
        });
      case 'featured':
        return copia.sort((a, b) => {
          const aFeat = a.badge ? 1 : 0;
          const bFeat = b.badge ? 1 : 0;
          return bFeat - aFeat;
        });
      default:
        return lista;
    }
  }

  addToCart(producto: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addProduct(producto, 1);
    this.analytics.trackAddToCart(producto, 1, 'Coleccion Alba', 'collection');
  }

  setProductSource(): void {
    this.analytics.setLastProductSource('collection');
  }

  toggleFavorite(producto: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.ensureLoggedInAndToggle(producto);
  }

  private async ensureLoggedInAndToggle(producto: Product) {
    const logged = await firstValueFrom(this.authService.isLoggedIn$);
    try {
      if (!logged) {
        await this.authService.loginWithGoogle();
      }
      const now = await firstValueFrom(this.authService.isLoggedIn$);
      if (now) this.favorites.toggle(producto);
    } catch (e) {
      console.warn('No se pudo iniciar sesion para favoritos', e);
    }
  }
}



