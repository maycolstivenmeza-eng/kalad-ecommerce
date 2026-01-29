import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ProductService } from '../../../shared/services/product.service';
import { AuthService } from '../../../shared/services/auth.service';

interface AdminReview {
  id: string;
  name: string;
  comment: string;
  rating: number;
  createdAt?: string;
  location?: string | null;
}

interface AdminProductLite {
  id: string;
  nombre: string;
  coleccion?: string | null;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['../productos/productos.component.css'],
})
export class ReviewsComponent implements OnInit, OnDestroy {
  productos: AdminProductLite[] = [];
  productoSeleccionadoId: string | null = null;
  reviews: AdminReview[] = [];

  cargandoProductos = false;
  cargandoReviews = false;

  toastActivo: { tipo: 'error' | 'exito'; texto: string } | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private reviewsSub?: any;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.reviewsSub?.unsubscribe?.();
  }

  async cargarProductos(): Promise<void> {
    this.cargandoProductos = true;
    this.productService.getAllProducts().subscribe({
      next: (prods) => {
        this.productos = (prods || []).map((p) => ({
          id: p.id!,
          nombre: p.nombre,
          coleccion: p.coleccion,
        }));
        this.cargandoProductos = false;
      },
      error: (err) => {
        console.error('No se pudieron cargar productos para reseñas', err);
        this.mostrarToast('error', 'No se pudieron cargar los productos.');
        this.cargandoProductos = false;
      },
    });
  }

  onSeleccionarProducto(): void {
    if (!this.productoSeleccionadoId) {
      this.reviews = [];
      return;
    }
    this.cargarReviews(this.productoSeleccionadoId);
  }

  cargarReviews(productId: string): void {
    this.cargandoReviews = true;
    this.reviewsSub?.unsubscribe?.();
    this.reviewsSub = this.productService
      .getProductReviews(productId)
      .subscribe({
        next: (res) => {
          this.reviews = (res || []) as AdminReview[];
          this.cargandoReviews = false;
        },
        error: (err) => {
          console.error('No se pudieron cargar reseñas', err);
          this.mostrarToast('error', 'No se pudieron cargar las reseñas.');
          this.cargandoReviews = false;
        },
      });
  }

  async eliminarReview(review: AdminReview): Promise<void> {
    if (!this.productoSeleccionadoId || !review?.id) return;
    const confirmar = window.confirm(
      `¿Eliminar la reseña de "${review.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      await this.productService.deleteProductReview(
        this.productoSeleccionadoId,
        review.id
      );
      this.mostrarToast('exito', 'Reseña eliminada.');
    } catch (err) {
      console.error('No se pudo eliminar reseña', err);
      this.mostrarToast('error', 'No se pudo eliminar la reseña.');
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  irAProductos(): void {
    this.router.navigate(['/admin/productos']);
  }

  irAPedidos(): void {
    this.router.navigate(['/admin/pedidos']);
  }

  irAAnalitica(): void {
    this.router.navigate(['/admin/analytics']);
  }

  private mostrarToast(tipo: 'error' | 'exito', texto: string): void {
    this.toastActivo = { tipo, texto };
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastActivo = null;
    }, 4000);
  }
}
