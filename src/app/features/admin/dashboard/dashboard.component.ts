import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { PedidosService, Pedido } from '../../../shared/services/pedidos.service';
import { ProductService } from '../../../shared/services/product.service';
import { AuthService } from '../../../shared/services/auth.service';

interface VentaPorColeccion {
  coleccion: string;
  ingresos: number;
  unidades: number;
}

interface VentaPorProducto {
  productId: string;
  nombre: string;
  coleccion?: string | null;
  ingresos: number;
  unidades: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../productos/productos.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  ventasPorColeccion: VentaPorColeccion[] = [];
  topProductos: VentaPorProducto[] = [];

  totalPedidos = 0;
  totalIngresos = 0;

  cargando = false;
  toastActivo: { tipo: 'error' | 'exito'; texto: string } | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private pedidosSub?: any;

  private productosIndex = new Map<
    string,
    { nombre: string; coleccion?: string | null }
  >();

  constructor(
    private pedidosService: PedidosService,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.pedidosSub?.unsubscribe?.();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;

    // Index de productos para obtener nombre / colecci��n
    this.productService.getAllProducts().subscribe({
      next: (prods) => {
        (prods || []).forEach((p) => {
          if (p.id) {
            this.productosIndex.set(p.id, {
              nombre: p.nombre,
              coleccion: p.coleccion,
            });
          }
        });
        // Si ya hay pedidos cargados, recalcular con colecciones actualizadas
        if (this.pedidos.length) {
          this.recalcularMetricas();
        }
      },
    });

    try {
      const obs = await this.pedidosService.obtenerPedidosAdmin();
      this.pedidosSub = obs.subscribe({
        next: (lista) => {
          this.pedidos = lista || [];
          this.recalcularMetricas();
          this.cargando = false;
        },
        error: (err) => {
          console.error('No se pudieron cargar pedidos para dashboard', err);
          this.mostrarToast('error', 'No se pudieron cargar los datos de ventas.');
          this.cargando = false;
        },
      });
    } catch (e) {
      console.error('Error al inicializar dashboard', e);
      this.mostrarToast('error', 'No se pudieron cargar los datos de ventas.');
      this.cargando = false;
    }
  }

  private recalcularMetricas(): void {
    const ventasValidas = this.pedidos.filter((p) =>
      ['pagado', 'enviado', 'entregado'].includes(p.estado)
    );

    this.totalPedidos = ventasValidas.length;
    this.totalIngresos = ventasValidas.reduce((acc, p) => acc + (p.total || 0), 0);

    const porColeccion = new Map<string, VentaPorColeccion>();
    const porProducto = new Map<string, VentaPorProducto>();

    for (const pedido of ventasValidas) {
      for (const item of pedido.items || []) {
        const info = this.productosIndex.get(item.productId) || {
          nombre: item.nombre,
          coleccion: undefined,
        };
        const ingresosItem = (item.precio || 0) * (item.qty || 0);
        const coleccionKey = info.coleccion || 'sin-coleccion';
        const coleccionLabel = info.coleccion || 'Sin colección';

        const aggCol = porColeccion.get(coleccionKey) || {
          coleccion: coleccionLabel,
          ingresos: 0,
          unidades: 0,
        };
        aggCol.ingresos += ingresosItem;
        aggCol.unidades += item.qty || 0;
        porColeccion.set(coleccionKey, aggCol);

        const prodKey = item.productId;
        const aggProd = porProducto.get(prodKey) || {
          productId: prodKey,
          nombre: info.nombre,
          coleccion: info.coleccion,
          ingresos: 0,
          unidades: 0,
        };
        aggProd.ingresos += ingresosItem;
        aggProd.unidades += item.qty || 0;
        porProducto.set(prodKey, aggProd);
      }
    }

    this.ventasPorColeccion = Array.from(porColeccion.values()).sort(
      (a, b) => b.ingresos - a.ingresos
    );

    this.topProductos = Array.from(porProducto.values())
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10);
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

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
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

