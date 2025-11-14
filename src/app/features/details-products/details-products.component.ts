import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../shared/services/products.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-details-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-products.component.html',
  styleUrl: './details-products.component.css'
})
export class DetailsProductsComponent implements OnInit {
  product: Product | undefined;
  selectedColor: string = '';
  quantity: number = 1;
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(id: string): void {
    this.productsService.getProductById(id).subscribe(product => {
      if (product) {
        this.product = product;
        this.selectedImage = product.imagen;
        this.selectedColor = product.colores[0] || '';
      } else {
        this.router.navigate(['/products']);
      }
    });
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  increment(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrement(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      console.log('Agregando al carrito:', {
        product: this.product,
        color: this.selectedColor,
        quantity: this.quantity
      });
      alert(`${this.quantity} x ${this.product.nombre} (${this.selectedColor}) agregado al carrito`);
    }
  }

  buyNow(): void {
    if (this.product) {
      // TODO: Implementar lógica de compra directa
      console.log('Compra directa:', {
        product: this.product,
        color: this.selectedColor,
        quantity: this.quantity
      });
      this.router.navigate(['/checkout']);
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}
