import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ProductService } from '../../../shared/services/product.service';
import { Product } from '../../../shared/models/product.model';

type AdminProductForm = {
  nombre: string;
  precio: number | null;
  descripcion: string;
  categoria: string;
  coleccion: string;
  badge: Product['badge'];
  stock: number | null;
  coloresTexto: string;
  imagen: string;
};

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent {
  producto: AdminProductForm = this.obtenerEstadoInicial();
  imagenSeleccionada: File | null = null;

  readonly categorias = ['Mochilas', 'Bolsas', 'Morrales', 'Zapatos'];
  readonly colecciones = [
    { id: 'kalad-origen', label: 'Kalad Origen' },
    { id: 'kalad-essencia', label: 'Kalad Essencia' }
  ];
  readonly badges: Product['badge'][] = ['Nuevo', 'Oferta', 'Limitada', null];

  constructor(private productService: ProductService) {}

  obtenerEstadoInicial(): AdminProductForm {
    return {
      nombre: '',
      precio: null,
      descripcion: '',
      categoria: '',
      coleccion: 'kalad-origen',
      badge: null,
      stock: null,
      coloresTexto: '',
      imagen: ''
    };
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    this.imagenSeleccionada = input.files?.[0] ?? null;
  }

  async guardarProducto(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    try {
      if (this.imagenSeleccionada) {
        this.producto.imagen = await this.productService.subirImagen(this.imagenSeleccionada);
      }

      const colores = this.producto.coloresTexto
        .split(',')
        .map(color => color.trim())
        .filter(Boolean);

      const payload: Omit<Product, 'id'> = {
        nombre: this.producto.nombre.trim(),
        precio: Number(this.producto.precio ?? 0),
        descripcion: this.producto.descripcion.trim(),
        categoria: this.producto.categoria,
        coleccion: this.producto.coleccion,
        imagen: this.producto.imagen,
        colores,
        stock: Number(this.producto.stock ?? 0),
        badge: this.producto.badge
      };

      await this.productService.createProduct(payload);

      alert('Producto agregado correctamente.');
      form.resetForm(this.obtenerEstadoInicial());
      this.imagenSeleccionada = null;
    } catch (error) {
      console.error(error);
      alert('Error al guardar el producto');
    }
  }
}
