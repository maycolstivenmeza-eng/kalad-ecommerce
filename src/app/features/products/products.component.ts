import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/product.model';
import { CartService } from '../../shared/services/cart.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { AuthService } from '../../shared/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { Title, Meta } from '@angular/platform-browser';
import { Ga4Service } from '../../shared/services/ga4.service';

type OrderOption = 'az' | 'za' | 'priceAsc' | 'priceDesc' | 'new' | 'featured';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {

  // ======== Datos desde Firebase ========
  products: Product[] = [];
  productosFiltrados: Product[] = [];

  // ======== Ordenamiento ========
  orden: OrderOption = 'az';
  ordenOpciones: OrderOption[] = ['az', 'za', 'priceAsc', 'priceDesc', 'new', 'featured'];
  filtroOrden: OrderOption = this.orden;

  // ======== Filtros ========
  filtroCategoria: string = '';
  filtroColor: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  open: boolean[] = [false, false, false];
  
  colores = [
    { id: 'beige', label: 'Beige', hex: '#d8c8a8' },
    { id: 'cafe', label: 'Cafe', hex: '#6a4e3a' },
    { id: 'negro', label: 'Negro', hex: '#000' },
    { id: 'arena', label: 'Arena', hex: '#e8e0c8' }
  ];

  categorias = ['Mochilas', 'Bolsas'];

  loading = true;
  error: string | null = null;
  private placeholderImage = 'assets/images/Producto_1.jpg';
  private listTracked = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    public favorites: FavoritesService,
    private authService: AuthService,
    private title: Title,
    private meta: Meta,
    private analytics: Ga4Service
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.title.setTitle('Productos | Kalad');
    this.meta.updateTag({
      name: 'description',
      content: 'Catálogo de mochilas artesanales Kalad: filtra por colección, color y precio para encontrar tu pieza única perfecta.'
    });
    this.loadProducts();
  }

  // =======================
  //      CARGAR DATA
  // =======================
  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.productosFiltrados = [...products];
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.error = 'Error al cargar los productos.';
        this.loading = false;
      }
    });
  }

  // =======================
  //      ORDENAR
  // =======================
  onOrderChange(order: OrderOption) {
    this.orden = order;
    this.filtroOrden = order;
    this.aplicarFiltros();
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
        return copia;
    }
  }

  // =======================
  //      APLICAR FILTROS
  // =======================
  aplicarFiltros() {
    let lista = [...this.products];

    if (this.filtroCategoria) {
      lista = lista.filter((p) => p.categoria === this.filtroCategoria);
    }

    if (this.filtroColor) {
      lista = lista.filter((p) => p.colores?.includes(this.filtroColor));
    }

    if (this.minPrice != null) {
      lista = lista.filter((p) => p.precio >= this.minPrice!);
    }
    if (this.maxPrice != null) {
      lista = lista.filter((p) => p.precio <= this.maxPrice!);
    }

    lista = this.ordenarLista(lista);

    this.productosFiltrados = lista;

    if (!this.listTracked && this.productosFiltrados.length) {
      this.analytics.trackViewItemList('Productos', this.productosFiltrados);
      this.listTracked = true;
    }
  }

  // =======================
  //    SETTERS DE FILTROS
  // =======================
  setFiltroCategoria(categoria: string) {
    this.filtroCategoria = this.filtroCategoria === categoria ? '' : categoria;
    this.aplicarFiltros();
  }

  setFiltroColor(color: string) {
    this.filtroColor = this.filtroColor === color ? '' : color;
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

  seleccionarCategoria(categoria: string) {
    this.setFiltroCategoria(categoria);
  }

  seleccionarColeccion(colorId: string) {
    this.setFiltroColor(colorId);
  }

  toggle(index: number) {
    this.open[index] = !this.open[index];
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

  viewProductDetails(productId: string): void {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      this.analytics.trackSelectItem(product, 'Productos');
    }
    this.analytics.setLastProductSource('catalog');
    this.router.navigate(['/products', productId]);
  }

  setProductSource(): void {
    this.analytics.setLastProductSource('catalog');
  }

  addToCart(product: Product) {
    this.cartService.addProduct(product, 1);
    this.analytics.trackAddToCart(product, 1, 'Productos', 'catalog');
  }

  toggleFavorite(product: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.ensureLoggedInAndToggle(product);
  }

  private async ensureLoggedInAndToggle(product: Product) {
    const logged = await firstValueFrom(this.authService.isLoggedIn$);
    try {
      if (!logged) {
        await this.authService.loginWithGoogle();
      }
      const nowLogged = await firstValueFrom(this.authService.isLoggedIn$);
      if (nowLogged) {
        this.favorites.toggle(product);
      }
    } catch (e) {
      console.warn('No se pudo iniciar sesion para favoritos', e);
    }
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}



