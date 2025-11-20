import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Product } from '../../../shared/models/product.model';
import { ProductService } from '../../../shared/services/product.service';
import { CartService } from '../../../shared/services/cart.service';

type OrderOption = 'az' | 'za' | 'priceAsc' | 'priceDesc' | 'new';

@Component({
  selector: 'app-essencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './essencia.component.html',
  styleUrl: './essencia.component.css'
})
export class EssenciaComponent implements OnInit, OnDestroy {
  productos: Product[] = [];
  productosFiltrados: Product[] = [];
  orden: OrderOption = 'az';
  ordenOpciones: OrderOption[] = ['az', 'za', 'priceAsc', 'priceDesc', 'new'];
  filtroColor = '';
  filtroCategoria = '';
  colores = [
    { id: 'beige', label: 'Beige', hex: '#d8c8a8' },
    { id: 'cafe', label: 'Cafe', hex: '#6a4e3a' },
    { id: 'negro', label: 'Negro', hex: '#000' },
    { id: 'arena', label: 'Arena', hex: '#e8e0c8' }
  ];
  categorias: string[] = ['Mochilas', 'Bolsos'];
  open = [false, false];
  private sub?: Subscription;

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.productService
      .getProductsByCollection('kalad-essencia')
      .subscribe((items) => {
        this.productos = [...items];
        this.aplicarFiltros();
      });
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

    this.productosFiltrados = this.ordenarLista(lista);
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
      default:
        return lista;
    }
  }

  addToCart(producto: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addProduct(producto, 1);
  }
}
