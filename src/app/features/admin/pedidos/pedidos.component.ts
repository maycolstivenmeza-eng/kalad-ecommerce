import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { PedidosService, Pedido } from "../../../shared/services/pedidos.service";
import { ProductService } from "../../../shared/services/product.service";
import { AuthService } from "../../../shared/services/auth.service";

@Component({
  selector: "app-admin-pedidos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./pedidos.component.html",
  styleUrls: ["../productos/productos.component.css", "./pedidos.component.css"],
})
export class PedidosComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  readonly estadosPedido: Pedido["estado"][] = [
    "creado",
    "pagado",
    "enviado",
    "entregado",
    "cancelado",
  ];
  filtroEstado: Pedido["estado"] | "" = "";

  toastActivo: { tipo: "error" | "exito"; texto: string } | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private pedidosService: PedidosService,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  get pedidosFiltrados(): Pedido[] {
    if (!this.filtroEstado) return this.pedidos;
    return this.pedidos.filter((p) => p.estado === this.filtroEstado);
  }

  async cargarPedidos(): Promise<void> {
    try {
      const obs = await this.pedidosService.obtenerPedidosAdmin();
      obs.subscribe((peds) => (this.pedidos = peds ?? []));
    } catch (e) {
      console.error("No se pudieron cargar pedidos", e);
      this.mostrarToast("error", "No se pudieron cargar los pedidos.");
    }
  }

  async cambiarEstadoPedido(pedido: Pedido, nuevoEstado: Pedido["estado"]): Promise<void> {
    if (!pedido.id || pedido.estado === nuevoEstado) return;
    const anterior = pedido.estado;
    const guia = (pedido.guiaEnvio || "").trim();
    const nota = (pedido.notaAdmin || "").trim();

    if ((nuevoEstado === "enviado" || nuevoEstado === "entregado") && !guia) {
      this.mostrarToast(
        "error",
        "Agrega una guía de envío antes de marcar como enviado/entregado"
      );
      return;
    }

    try {
      await this.pedidosService.actualizarPedido(pedido.id, {
        estado: nuevoEstado,
        guiaEnvio: guia || undefined,
        notaAdmin: nota || undefined,
      });
      pedido.estado = nuevoEstado;
      pedido.guiaEnvio = guia || undefined;
      pedido.notaAdmin = nota || undefined;

      if (nuevoEstado === "cancelado" && anterior !== "cancelado") {
        await Promise.all(
          (pedido.items || []).map((item) =>
            this.productService.increaseStock(item.productId, item.qty).catch((err) => {
              console.error("No se pudo devolver stock", err);
            })
          )
        );
      }

      this.mostrarToast("exito", "Estado del pedido actualizado.");
    } catch (e) {
      console.error("No se pudo cambiar estado del pedido", e);
      this.mostrarToast("error", "No se pudo cambiar el estado del pedido");
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(["/admin/login"]);
  }

  irAProductos(): void {
    this.router.navigate(["/admin/productos"]);
  }

  private mostrarToast(tipo: "error" | "exito", texto: string): void {
    this.toastActivo = { tipo, texto };
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastActivo = null;
    }, 4000);
  }
}
