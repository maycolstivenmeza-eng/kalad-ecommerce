import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { ProductService } from "../../../shared/services/product.service";
import { Product } from "../../../shared/models/product.model";
import { Subscription } from "rxjs";
import { AuthService } from "../../../shared/services/auth.service";
import { Router } from "@angular/router";
import { CouponService, CouponDoc, Coupon } from "../../../shared/services/coupon.service";

// Tipos
 type AdminProductForm = {
  nombre: string;
  precio: number | string | null;
  descripcion: string;
  caracteristicas: string;
  categoria: string;
  coleccion: string;
  badge: Product["badge"];
  stock: number | null;
  coloresTexto: string;
  imagen: string;
  imagenes: string[];
  dimensiones: {
    alto: string;
    ancho: string;
    profundidad: string;
    capacidad: string;
  };
  activo: boolean;
};

@Component({
  selector: "app-productos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./productos.component.html",
  styleUrls: ["./productos.component.css"],
})
export class ProductosComponent implements OnInit, OnDestroy {
  producto: AdminProductForm = this.obtenerEstadoInicial();

  // Imagen principal
  imagenSeleccionada: File | null = null;
  previewUrl: string | null = null;

  // Imagenes secundarias
  imagenesSeleccionadas: File[] = [];
  previewImagenes: string[] = [];

  // Listado
  productos: Product[] = [];
  productosFiltrados: Product[] = [];
  private productosSub?: Subscription;

  // Cupones
  cupones: CouponDoc[] = [];
  cuponEnEdicion: Coupon = { codigo: "", activo: true, porcentaje: 10, minSubtotal: undefined };
  editandoCupon = false;
  guardandoCupon = false;

  // Filtros
  filtroNombre = "";
  filtroCategoria = "";
  filtroColeccion = "";
  filtroBadge: Product["badge"] | "" = "";

  // Edicion
  modoEdicion = false;
  idProductoEdicion: string | null = null;

  // Catalogos
  readonly categorias = ["Mochilas", "Bolsas"]; // se retiraron Morrales y Zapatos
  readonly colecciones = [
    { id: "kalad-origen", label: "Kalad Origen" },
    { id: "kalad-essencia", label: "Kalad Essencia" },
    { id: "ediciones-especiales", label: "Ediciones especiales" }
  ];
  readonly badges: Product["badge"][] = ["Nuevo", "Oferta", "Limitada", null];
  private imagenCache = new Map<string, string>();
  private imagenResolviendo = new Set<string>();
  guardando = false;
  mensajeSistema: { tipo: "error" | "exito"; texto: string } | null = null;
  toastActivo: { tipo: "error" | "exito"; texto: string } | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  get textoBotonAccion(): string {
    const enEdicion = this.modoEdicion || !!this.idProductoEdicion;
    return enEdicion ? "Actualizar producto" : "Guardar producto nuevo";
  }

  get textoBotonProcesando(): string {
    return this.modoEdicion ? "Actualizando..." : "Guardando...";
  }

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private couponService: CouponService
  ) {}

  // ==========================================================
  // INIT
  // ==========================================================
  ngOnInit() {
    this.cargarProductos();
    this.cargarCupones();
  }

  ngOnDestroy() {
    this.productosSub?.unsubscribe();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  // ==========================================================
  // CARGAR LISTA
  // ==========================================================
  cargarProductos() {
    this.productosSub?.unsubscribe();
    this.productosSub = this.productService.getAllProducts().subscribe((data) => {
      this.productos = data ?? [];
      this.aplicarFiltros();
    });
  }

  cargarCupones() {
    this.couponService.getAll().subscribe((lista) => {
      this.cupones = lista ?? [];
    });
  }

  obtenerEstadoInicial(): AdminProductForm {
    return {
      nombre: "",
      precio: "",
      descripcion: "",
      caracteristicas: "",
      categoria: "",
      coleccion: "kalad-origen",
      badge: null,
      stock: null,
      coloresTexto: "",
      imagen: "",
      imagenes: [],
      dimensiones: {
        alto: "",
        ancho: "",
        profundidad: "",
        capacidad: "",
      },
      activo: true,
    };
  }

  // ==========================================================
  // IMAGEN PRINCIPAL
  // ==========================================================
  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(archivo);

    this.imagenSeleccionada = archivo;
  }

  limpiarImagen() {
    this.imagenSeleccionada = null;
    this.previewUrl = null;
    if (this.modoEdicion) this.producto.imagen = "";
  }

  faltaImagenPrincipal() {
    return !this.modoEdicion && !this.previewUrl;
  }

  // ==========================================================
  // MULTI IMAGEN
  // ==========================================================
  seleccionarMultiplesImagenes(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files) return;

    for (let file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImagenes.push(reader.result as string);
        this.imagenesSeleccionadas.push(file);
      };
      reader.readAsDataURL(file);
    }

    input.value = "";
  }

  eliminarImagenSecundaria(index: number) {
    const guardadas = this.producto.imagenes ?? [];

    if (index < guardadas.length) {
      guardadas.splice(index, 1);
      this.producto.imagenes = [...guardadas];
    } else {
      this.imagenesSeleccionadas.splice(index - guardadas.length, 1);
    }

    this.previewImagenes.splice(index, 1);
  }

  // ==========================================================
  // GUARDAR / ACTUALIZAR
  // ==========================================================
  async guardarProducto(form: NgForm) {
    if (this.guardando) return;

    if (form.invalid || this.faltaImagenPrincipal()) {
      form.control.markAllAsTouched();
      this.mensajeSistema = {
        tipo: "error",
        texto: "Revisa que todos los campos obligatorios esten completos."
      };
      this.mostrarToast('error', this.mensajeSistema.texto);
      return;
    }

    const precioNormalizado = this.parsearPrecioEntrada(this.producto.precio);
    if (precioNormalizado === null || isNaN(precioNormalizado) || precioNormalizado < 0) {
      this.mensajeSistema = {
        tipo: "error",
        texto: "Ingresa un precio valido en COP (solo numeros y separadores)."
      };
      this.mostrarToast('error', this.mensajeSistema.texto);
      return;
    }

    this.mensajeSistema = null;
    this.guardando = true;

    try {
      if (this.imagenSeleccionada) {
        this.producto.imagen = await this.productService.subirImagen(
          this.imagenSeleccionada,
          this.producto.coleccion
        );
      }

      const nuevasUrls: string[] = [];
      for (let archivo of this.imagenesSeleccionadas) {
        nuevasUrls.push(
          await this.productService.subirImagen(archivo, this.producto.coleccion)
        );
      }

      const imagenesFinales = this.modoEdicion
        ? [...(this.producto.imagenes ?? []), ...nuevasUrls]
        : nuevasUrls;

      const colores = this.normalizarColores(this.producto.coloresTexto);
      const dimensiones = this.sanitizarDimensiones(this.producto.dimensiones);

      const payload: Omit<Product, "id"> = {
        nombre: this.producto.nombre.trim(),
        precio: precioNormalizado,
        descripcion: this.producto.descripcion.trim(),
        caracteristicas: this.producto.caracteristicas.trim(),
        categoria: this.producto.categoria,
        coleccion: this.producto.coleccion,
        imagen: this.producto.imagen,
        colores,
        color: colores[0] ?? "",
        stock: Number(this.producto.stock),
        badge: this.producto.badge,
        imagenes: imagenesFinales,
        dimensiones,
        activo: this.producto.activo,
      };

      if (this.modoEdicion && this.idProductoEdicion) {
        await this.productService.updateProduct(this.idProductoEdicion, payload);
        this.mensajeSistema = { tipo: "exito", texto: "Producto actualizado correctamente." };
        this.mostrarToast('exito', this.mensajeSistema.texto);
      } else {
        await this.productService.createProduct(payload);
        this.mensajeSistema = { tipo: "exito", texto: "Producto creado correctamente." };
        this.mostrarToast('exito', this.mensajeSistema.texto);
      }

      form.resetForm(this.obtenerEstadoInicial());
      this.previewUrl = null;
      this.previewImagenes = [];
      this.imagenesSeleccionadas = [];
      this.imagenSeleccionada = null;
      this.modoEdicion = false;

      this.cargarProductos();
    } catch (e) {
      console.error(e);
      const texto = e instanceof Error ? e.message : "Error guardando el producto";
      this.mensajeSistema = { tipo: "error", texto };
      this.mostrarToast('error', texto);
    } finally {
      this.guardando = false;
    }
  }
  // ==========================================================
  // EDITAR
  // ==========================================================
  editarProducto(producto: Product) {
    this.modoEdicion = true;
    this.idProductoEdicion = producto.id ?? null;

    const colores = this.normalizarColores(
      producto.colores?.join(', ') || producto.color || ''
    );

    this.producto = {
      nombre: producto.nombre,
      precio: this.formatearPrecioParaInput(producto.precio),
      descripcion: producto.descripcion,
      caracteristicas: producto.caracteristicas ?? '',
      categoria: producto.categoria,
      coleccion: producto.coleccion,
      badge: producto.badge,
      stock: producto.stock,
      coloresTexto: colores.join(', '),
      imagen: producto.imagen,
      imagenes: [...(producto.imagenes ?? [])],
      dimensiones: {
        alto: producto.dimensiones?.alto ?? '',
        ancho: producto.dimensiones?.ancho ?? '',
        profundidad: producto.dimensiones?.profundidad ?? '',
        capacidad: producto.dimensiones?.capacidad ?? '',
      },
      activo: producto.activo ?? true,
    };

    this.imagenSeleccionada = null;
    this.previewUrl = producto.imagen
      ? this.esUrlPublica(producto.imagen)
        ? producto.imagen
        : null
      : null;
    this.previewImagenes = [...(producto.imagenes ?? [])];
    this.imagenesSeleccionadas = [];

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================
  // ELIMINAR
  // ==========================================================
  async eliminarProducto(id?: string) {
    if (!id) return;

    if (!confirm('Seguro que deseas eliminarlo?')) return;

    await this.productService.deleteProduct(id);
    this.cargarProductos();
  }

  async toggleActivo(prod: Product) {
    if (!prod.id) return;
    const nuevo = !(prod.activo ?? true);
    await this.productService.updateProduct(prod.id, { activo: nuevo });
  }

  // ==========================================================
  // CUPONES
  // ==========================================================
  nuevoCupon() {
    this.editandoCupon = false;
    this.cuponEnEdicion = { codigo: "", activo: true, porcentaje: 10, minSubtotal: undefined };
  }

  editarCupon(c: CouponDoc) {
    this.editandoCupon = true;
    this.cuponEnEdicion = {
      codigo: c.codigo,
      activo: c.activo,
      porcentaje: c.porcentaje,
      minSubtotal: c.minSubtotal,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async guardarCupon(form: NgForm) {
    if (form.invalid || this.guardandoCupon) return;
    this.guardandoCupon = true;
    try {
      await this.couponService.save(this.cuponEnEdicion);
      this.mostrarToast('exito', 'Cupón guardado correctamente.');
      this.nuevoCupon();
      form.resetForm(this.cuponEnEdicion);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'No se pudo guardar el cupón';
      this.mostrarToast('error', msg);
    } finally {
      this.guardandoCupon = false;
    }
  }

  async eliminarCupon(c: CouponDoc) {
    if (!confirm(`¿Eliminar el cupón ${c.codigo}?`)) return;
    try {
      await this.couponService.delete(c.codigo);
      this.mostrarToast('exito', 'Cupón eliminado correctamente.');
    } catch (e) {
      console.error(e);
      this.mostrarToast('error', 'No se pudo eliminar el cupón');
    }
  }

  // ==========================================================
  // FILTROS
  // ==========================================================
  aplicarFiltros() {
    const nombre = this.filtroNombre.toLowerCase();

    this.productosFiltrados = this.productos.filter((p) =>
      (!nombre || p.nombre.toLowerCase().includes(nombre)) &&
      (!this.filtroCategoria || p.categoria === this.filtroCategoria) &&
      (!this.filtroColeccion || p.coleccion === this.filtroColeccion) &&
      (!this.filtroBadge || p.badge === this.filtroBadge)
    );
  }

  resetFiltros() {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.filtroColeccion = '';
    this.filtroBadge = '';
    this.aplicarFiltros();
  }

  obtenerImagenProducto(producto: Product): string | null {
    const candidata = producto.imagen || producto.imagenes?.[0] || null;
    if (!candidata) return null;

    if (this.esUrlPublica(candidata)) return candidata;

    if (this.imagenCache.has(candidata)) {
      return this.imagenCache.get(candidata)!;
    }

    if (!this.imagenResolviendo.has(candidata)) {
      this.imagenResolviendo.add(candidata);
      this.productService.obtenerUrlDescarga(candidata)
        .then((url) => {
          if (url) {
            this.imagenCache.set(candidata, url);
            producto.imagen = url;
            this.productos = this.productos.map((p) =>
              p.id === producto.id ? { ...p, imagen: url } : p
            );
            this.aplicarFiltros();
          }
        })
        .catch((err) => console.warn('No se pudo cargar la imagen', err))
        .finally(() => this.imagenResolviendo.delete(candidata));
    }

    return null;
  }

  private esUrlPublica(valor: string): boolean {
    return /^https?:\//i.test(valor) || valor.startsWith('data:');
  }

  // ==========================================================
  // NAVEGACION ADMIN
  // ==========================================================
  irAPedidos(): void {
    this.router.navigate(['/admin/pedidos']);
  }

  irADashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  irAReviews(): void {
    this.router.navigate(['/admin/reviews']);
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================
  async logout() {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  private sanitizarDimensiones(
    dimensiones?: AdminProductForm['dimensiones']
  ): Product['dimensiones'] | undefined {
    if (!dimensiones) return undefined;

    const limpio = {
      alto: dimensiones.alto?.trim() ?? '',
      ancho: dimensiones.ancho?.trim() ?? '',
      profundidad: dimensiones.profundidad?.trim() ?? '',
      capacidad: dimensiones.capacidad?.trim() ?? '',
    };

    const tieneDatos = Object.values(limpio).some((valor) => valor.length > 0);
    return tieneDatos ? limpio : undefined;
  }

  private normalizarColores(valor: string | string[]): string[] {
    if (Array.isArray(valor)) {
      return valor.map((c) => c.trim()).filter((c) => c.length > 0);
    }
    return (valor || '')
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  private mostrarToast(tipo: 'error' | 'exito', texto: string) {
    this.toastActivo = { tipo, texto };
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastActivo = null;
    }, 4000);
  }

  private parsearPrecioEntrada(valor: AdminProductForm['precio']): number | null {
    if (valor === null || valor === undefined) return null;
    if (typeof valor === 'number') return valor;

    const limpio = valor.replace(/\s+/g, '');
    if (!limpio) return null;

    const ultimoSeparador = Math.max(limpio.lastIndexOf('.'), limpio.lastIndexOf(','));
    if (ultimoSeparador !== -1) {
      const decimales = limpio.slice(ultimoSeparador + 1);
      const parteEntera = limpio.slice(0, ultimoSeparador);
      const usaDecimales = decimales.length > 0 && decimales.length <= 2;

      if (usaDecimales) {
        const enterosSinSep = parteEntera.replace(/[.,]/g, '');
        const normalizado = `${enterosSinSep}.${decimales}`;
        const numero = Number(normalizado);
        return isNaN(numero) ? null : numero;
      }
    }

    const sinSeparadores = limpio.replace(/[.,]/g, '');
    const numero = Number(sinSeparadores);
    return isNaN(numero) ? null : numero;
  }

  private formatearPrecioParaInput(precio: number | null | undefined): string {
    if (precio === null || precio === undefined || isNaN(Number(precio))) return '';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(precio));
  }
}
