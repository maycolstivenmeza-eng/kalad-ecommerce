import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  sortOrder: string = 'A-Z';
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
        this.sortProducts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.error = 'Error al cargar los productos. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  sortProducts(): void {
    switch (this.sortOrder) {
      case 'A-Z':
        this.filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'Z-A':
        this.filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'Precio: Menor a Mayor':
        this.filteredProducts.sort((a, b) => a.precio - b.precio);
        break;
      case 'Precio: Mayor a Menor':
        this.filteredProducts.sort((a, b) => b.precio - a.precio);
        break;
    }
  }

  changeSortOrder(): void {
    const orders = ['A-Z', 'Z-A', 'Precio: Menor a Mayor', 'Precio: Mayor a Menor'];
    const currentIndex = orders.indexOf(this.sortOrder);
    this.sortOrder = orders[(currentIndex + 1) % orders.length];
    this.sortProducts();
  }

  viewProductDetails(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    // TODO: Implementar lógica de carrito
    console.log('Producto agregado al carrito:', product);
    alert(`${product.nombre} agregado al carrito`);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}
