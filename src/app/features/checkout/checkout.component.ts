import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { WompiService } from "../../shared/services/wompi.service";
import { CartService, CartItem } from "../../shared/services/cart.service";
import { AuthService } from "../../shared/services/auth.service";
import { PedidosService } from "../../shared/services/pedidos.service";
import { UserDataService } from "../../shared/services/user-data.service";
import { ProductService } from "../../shared/services/product.service";
import { firstValueFrom, merge, of, Subscription, take } from "rxjs";
import { CouponService } from "../../shared/services/coupon.service";
import { environment } from "../../../environments/environment";
import { FormsModule } from "@angular/forms";
import { AnalyticsService } from "../../shared/services/analytics.service";
import { Product } from "../../shared/models/product.model";
import {
  calculateShippingCost,
  isMetroAreaBarranquilla
} from "../../shared/utils/shipping-utils";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./checkout.component.html",
  styleUrl: "./checkout.component.css"
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
  isLoggedIn$ = this.authService.isLoggedIn$;
  isProcessing = false;
  cartItems: CartItem[] = [];
  couponCode = "";
  discount = 0;
  shipping = 0;
  couponMessage: string | null = null;
  statusMessage: string | null = null;
  suggestions: Product[] = [];
  private purchaseTracked = false;
  private abandonTracked = false;
  shippingBadgeText = "Envío GRATIS en el Área Metropolitana de Barranquilla";
  shippingMessageDetail =
    "El costo se actualizará automáticamente cuando termines de completar la dirección.";
  metroRecommendation = false;
  private shippingWatcher?: Subscription;
  private cartSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private wompiService: WompiService,
    private cartService: CartService,
    private authService: AuthService,
    private pedidosService: PedidosService,
    private userDataService: UserDataService,
    private couponService: CouponService,
    private productService: ProductService,
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.initializeForm();
    this.setupShippingWatcher();
    this.cartSub = this.cartService.items$.subscribe((items) => {
      this.cartItems = items;
      this.loadSuggestions();
      this.refreshShipping();
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.shippingWatcher?.unsubscribe();
    if (!this.purchaseTracked && !this.abandonTracked && this.cartItems.length) {
      this.analytics.trackCartAbandoned(this.cartItems, this.getTotal(), "checkout_exit");
      this.abandonTracked = true;
    }
  }

  initializeForm(): void {
    this.checkoutForm = this.fb.group({
      fullName: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      phone: ["", [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      documentType: ["CC", Validators.required],
      documentNumber: ["", [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      address: ["", Validators.required],
      city: ["", Validators.required],
      department: ["", Validators.required],
      notes: [""]
    });
  }

  get f() {
    return this.checkoutForm.controls;
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.precio * item.qty, 0);
  }

  getCommission(): number {
    const cfg = environment.wompi as any;
    const pct = Math.max(0, Number(cfg.feePercent ?? 0));
    const fixed = Math.max(0, Number(cfg.feeFixed ?? 0));
    const base = this.getTotal();
    return Math.round(base * pct + fixed);
  }

  getTotal(): number {
    return Math.max(0, this.getSubtotal() + this.shipping - this.discount);
  }

  getTotalInCents(): number {
    return this.getTotal() * 100;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  async applyCoupon(): Promise<void> {
    const code = this.couponCode.trim().toUpperCase();
    const subtotal = this.getSubtotal();
    if (!code) {
      this.discount = 0;
      this.couponMessage = null;
      return;
    }
    try {
      this.discount = await this.couponService.validate(code, subtotal);
      this.couponMessage = this.discount
        ? `Cupón aplicado correctamente.`
        : 'Este cupón no genera descuento para el total actual.';
    } catch (e) {
      this.discount = 0;
      const msg = (e as any)?.message || "Cupón inválido o no aplicable.";
      this.couponMessage = msg;
    }
  }

  computeShipping(subtotal: number, city?: string, department?: string): void {
    const shippingConfig = (environment as any).shipping || {};
    const defaultCost = shippingConfig?.defaultCost ?? 12000;
    const threshold = shippingConfig?.freeThreshold ?? 200000;
    const cityValue = city?.toString().trim();
    const departmentValue = department?.toString().trim();

    if (!cityValue || !departmentValue) {
      this.shipping = 0;
      this.shippingMessageDetail =
        "Completa tu ciudad y departamento para calcular el envío. El costo se actualizará automáticamente cuando termines de completar la dirección.";
      this.metroRecommendation = false;
      return;
    }

    this.shipping = calculateShippingCost(
      subtotal,
      cityValue,
      departmentValue,
      shippingConfig
    );

    const isMetro = isMetroAreaBarranquilla(
      cityValue,
      departmentValue,
      shippingConfig
    );
    this.metroRecommendation = isMetro;

    if (this.shipping === 0) {
      if (subtotal >= threshold && subtotal > 0) {
        this.shippingMessageDetail = "Tu envío ya está incluido en el total.";
      } else if (isMetro) {
        this.shippingMessageDetail =
          "Ya estás dentro del Área Metropolitana de Barranquilla, el envío es gratis.";
      } else {
        this.shippingMessageDetail =
          "Tu pedido califica para envío gratis. Gracias por comprar con nosotros.";
      }
    } else {
      this.shippingMessageDetail = "Entrega rápida y segura (envío fijo dentro de Colombia).";
    }
  }

  resetCoupon(): void {
    this.couponCode = "";
    this.discount = 0;
    this.couponMessage = null;
  }

  private loadSuggestions(): void {
    const baseCollection = this.cartItems[0]?.coleccion ?? null;
    const source$ = baseCollection
      ? this.productService.getProductsByCollection(baseCollection)
      : this.productService.getFeaturedProducts();

    source$.pipe(take(1)).subscribe((products) => {
      this.suggestions = products
        .filter((p) => !this.cartItems.some((item) => item.id === p.id))
        .slice(0, 4);
    });
  }

  private setupShippingWatcher(): void {
    const cityControl = this.checkoutForm.get("city");
    const departmentControl = this.checkoutForm.get("department");
    const cityChanges = cityControl?.valueChanges ?? of(cityControl?.value);
    const departmentChanges =
      departmentControl?.valueChanges ?? of(departmentControl?.value);

    this.shippingWatcher = merge(cityChanges, departmentChanges).subscribe(() => {
      this.refreshShipping();
    });
  }

  private refreshShipping(): void {
    const subtotal = this.getSubtotal();
    const city = this.checkoutForm.get("city")?.value;
    const department = this.checkoutForm.get("department")?.value;
    this.computeShipping(subtotal, city, department);
  }

  addSuggested(product: Product) {
    this.cartService.addProduct(product, 1);
    this.refreshShipping();
  }

  async processPayment(): Promise<void> {
    this.statusMessage = null;

    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      this.statusMessage = "Por favor completa todos los campos requeridos correctamente.";
      return;
    }

    if (!this.cartItems.length) {
      this.statusMessage = "Tu carrito está vacío.";
      return;
    }


    this.isProcessing = true;

    try {
      const formValue = this.checkoutForm.value;
      const isLoggedIn = await firstValueFrom(this.authService.isLoggedIn$);

      // Validar stock antes de cobrar
      const sinStock = await this.validateStock();
      if (sinStock.length) {
        this.statusMessage = `No hay stock suficiente para: ${sinStock
          .map((p) => p.nombre)
          .join(", ")}. Ajusta el carrito e intenta de nuevo.`;
        return;
      }

      // Guardar perfil y direccion
      if (isLoggedIn) {
      await this.userDataService.saveAuthProfile();
      const addressPayload: any = {
        label: formValue.address || "Envio",
        line1: formValue.address,
        city: formValue.city,
        region: formValue.department
      };
      if (formValue.postalCode) {
        addressPayload.postal = formValue.postalCode;
      }
      await this.userDataService.addAddress(addressPayload);
      }

      const subtotal = this.getSubtotal();
      this.computeShipping(subtotal, formValue.city, formValue.department);
      await this.applyCoupon();
      const commission = this.getCommission();
      const totals = {
        subtotal,
        shipping: this.shipping,
        discount: this.discount,
        total: this.getTotal(),
        coupon: this.discount ? this.couponCode.trim().toUpperCase() : undefined
      };

      this.analytics.trackBeginCheckout(this.cartItems, totals, this.couponCode);

      // Crear pedido
      const pedidoId = await this.pedidosService.crearPedido(
        this.cartItems.map((i) => ({
          productId: i.id,
          nombre: i.nombre,
          qty: i.qty,
          precio: i.precio,
          color: i.color
        })),
        this.getTotal(),
        "creado",
        {
          // Totales
          subtotal,
          envio: this.shipping,
          descuento: this.discount,
          ...(this.discount
            ? { cupon: this.couponCode.trim().toUpperCase() }
            : {}),
          comision: commission,
          comisionPorcentaje: Number((environment.wompi as any).feePercent ?? 0),
          comisionFija: Number((environment.wompi as any).feeFixed ?? 0),
          // Datos de contacto y envío (siempre, logueado o invitado)
          nombreCliente: formValue.fullName,
          emailCliente: formValue.email,
          telefonoCliente: formValue.phone,
          tipoDocumento: formValue.documentType,
          numeroDocumento: formValue.documentNumber,
          direccionEnvio: formValue.address,
          ciudadEnvio: formValue.city,
          departamentoEnvio: formValue.department,
          notasCliente: formValue.notes
        }
      );

      const checkoutConfig = {
        customerData: {
          email: formValue.email,
          fullName: formValue.fullName,
          phoneNumber: formValue.phone,
          phoneNumberPrefix: "+57",
          legalId: formValue.documentNumber,
          legalIdType: formValue.documentType
        },
        shippingAddress: {
          addressLine1: formValue.address,
          city: formValue.city,
          region: formValue.department,
          country: "CO",
          phoneNumber: formValue.phone
        }
      };

      let finalStatus: string = "error";

      await this.wompiService.openCheckoutFromBackend(pedidoId, checkoutConfig, async (tx) => {
        const txId = tx?.id;
        let status = tx?.status?.toLowerCase?.() || "error";

        // Verificar contra API de Wompi para evitar pagos fantasma
        if (txId) {
          try {
            const verified = await this.wompiService.verifyTransaction(txId);
            const verifiedStatus = verified?.status?.toLowerCase?.();
            if (verifiedStatus) {
              status = verifiedStatus;
            }
          } catch (err) {
            console.error("No se pudo verificar la transaccion en Wompi", err);
          }
        }

        // Si se aprueba, reportar compra (el stock se descuenta en el backend)
        if (status === "approved") {
          this.analytics.trackPurchase(
            pedidoId,
            txId || null,
            this.cartItems,
            {
              subtotal: totals.subtotal,
              shipping: totals.shipping,
              discount: totals.discount,
              total: totals.total,
              coupon: totals.coupon
            }
          );
          this.purchaseTracked = true;

          // Guardar un resumen básico del último pedido en localStorage
          try {
            const lastOrder = {
              id: pedidoId,
              total: totals.total,
              estado: "pagado",
              createdAt: new Date().toISOString()
            };
            localStorage.setItem("kalad-last-order", JSON.stringify(lastOrder));
          } catch (e) {
            console.warn("No se pudo guardar el resumen del último pedido", e);
          }
        } else if (!this.abandonTracked) {
          this.analytics.trackCartAbandoned(this.cartItems, totals.total, `checkout_${status}`);
          this.abandonTracked = true;
        }

        finalStatus = status;
      });

      // Navegación según resultado final
      if (finalStatus === "approved") {
        this.cartService.clear();
        this.cartItems = [];
        this.router.navigate(["/confirmation"], { queryParams: { id: pedidoId, status: "APPROVED" } });
      } else if (finalStatus === "pending") {
        this.statusMessage = "Tu pago quedó en estado pendiente. Te avisaremos por correo electrónico.";
      } else if (finalStatus === "cancelled" || finalStatus === "declined") {
        this.statusMessage = "El pago fue cancelado o rechazado. No se ha realizado ningún cargo.";
      } else {
        this.statusMessage = "No se pudo completar el pago. Por favor intenta de nuevo.";
      }
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      this.statusMessage = "Ocurrió un error al procesar el pago. Por favor intenta de nuevo.";
    } finally {
      this.isProcessing = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  continueShopping(): void {
    this.router.navigate(["/products"]);
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
    } catch (e) {
      console.warn("Login cancelado o fallido", e);
    }
  }
  private async validateStock(): Promise<{ id: string; nombre: string }[]> {
    const sinStock: { id: string; nombre: string }[] = [];
    for (const item of this.cartItems) {
      try {
        const product = await firstValueFrom(this.productService.getProductById(item.id));
        const disponible = Number(product.stock ?? 0);
        if (disponible < item.qty) {
          sinStock.push({ id: item.id, nombre: item.nombre });
        }
      } catch (e) {
        console.error("Error consultando stock", e);
        sinStock.push({ id: item.id, nombre: item.nombre });
      }
    }
    return sinStock;
  }
  trackCartItem(_index: number, item: CartItem): string {
    return `${item.id}_${item.color ?? "default"}`;
  }

  trackProduct(_index: number, product: Product): string {
    return product?.id ?? "";
  }
}
