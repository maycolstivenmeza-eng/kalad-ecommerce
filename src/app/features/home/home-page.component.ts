import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  featuredProducts: Product[] = [];
  loading: boolean = true;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.loading = true;
    this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        // Limitar a los primeros 4 productos destacados
        this.featuredProducts = products.slice(0, 4);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos destacados:', err);
        // Si hay error, cargar todos los productos como fallback
        this.productService.getAllProducts().subscribe({
          next: (products) => {
            this.featuredProducts = products.slice(0, 4);
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    });
  }

  viewProductDetails(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}
