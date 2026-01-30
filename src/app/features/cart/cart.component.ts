import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Observable, Subscription, map, take } from "rxjs";
import { CartService, CartItem } from "../../shared/services/cart.service";
import { Product } from "../../shared/models/product.model";
import { ProductService } from "../../shared/services/product.service";
import { CouponService } from "../../shared/services/coupon.service";
import { Ga4Service } from "../../shared/services/ga4.service";
import { calculateShippingCost } from "../../shared/utils/shipping-utils";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./cart.component.html",
  styleUrl: "./cart.component.css"
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems$: Observable<CartItem[]> = this.cartService.items$;
  totalItems$ = this.cartService.items$.pipe(
    map((items) => items.reduce((acc, item) => acc + item.qty, 0))
  );
  totalAmount$ = this.cartService.items$.pipe(
    map((items) => items.reduce((acc, item) => acc + item.qty * item.precio, 0))
  );
  couponCode = "";
  discount = 0;
  shipping = 0;
  couponMessage: string | null = null;
  shippingBadgeText = "Envío GRATIS en el Área Metropolitana de Barranquilla";
  shippingNote = "El costo se actualizará automáticamente al ingresar tu dirección.";
  recommendedProducts: Product[] = [];
  private sub?: Subscription;
  private cartViewed = false;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private couponService: CouponService,
    private analytics: Ga4Service,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.sub = this.cartItems$.subscribe((items) => {
      this.loadRecommendations(items);
      const subtotal = items.reduce((acc, i) => acc + i.precio * i.qty, 0);
      this.computeShipping(subtotal);
      if (!this.cartViewed && items.length) {
        this.analytics.trackViewCart(items, subtotal, this.shipping, this.discount);
        this.cartViewed = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  decrease(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.qty - 1, item.color);
  }

  increase(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.qty + 1, item.color);
  }

  remove(item: CartItem) {
    this.analytics.trackRemoveFromCart(item, item.qty, 'Carrito', 'direct');
    this.cartService.removeItem(item.id, item.color);
  }

  clear() {
    this.cartItems$.pipe(take(1)).subscribe((items) => {
      items.forEach((item) => this.analytics.trackRemoveFromCart(item, item.qty, 'Carrito', 'direct'));
    });
    this.cartService.clear();
  }

  async applyCoupon(total: number) {
    const code = this.couponCode.trim().toUpperCase();
    if (!code) {
      this.discount = 0;
      this.couponMessage = null;
      return;
    }
    try {
      this.discount = await this.couponService.validate(code, total);
      this.couponMessage = this.discount
        ? `Cupón aplicado: -${this.discount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : 'Este cupón no genera descuento para el total actual.';
    } catch (e) {
      this.discount = 0;
      const msg = (e as any)?.message || "Cupón inválido o no aplicable.";
      this.couponMessage = msg;
    }
  }

  resetDiscount() {
    this.couponCode = "";
    this.discount = 0;
    this.couponMessage = null;
  }

  computeShipping(subtotal: number) {
    // Envio gratis desde 200.000 y coste especial para el area metropolitana
    this.shipping = calculateShippingCost(
      subtotal,
      undefined,
      undefined,
      (environment as any).shipping,
      { requireAddress: true }
    );
  }

  private loadRecommendations(items: CartItem[]) {
    const coleccion = items[0]?.coleccion ?? null;
    if (coleccion) {
      this.productService
        .getProductsByCollection(coleccion)
        .pipe(take(1))
        .subscribe((productos) => {
          this.recommendedProducts = productos
            .filter((p) => !items.some((item) => item.id === p.id))
            .slice(0, 4);
        });
    } else {
      this.productService
        .getFeaturedProducts()
        .pipe(take(1))
        .subscribe((productos) => {
          this.recommendedProducts = productos.slice(0, 4);
        });
    }
  }

  addSuggested(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addProduct(product, 1);
    this.analytics.trackAddToCart(product, 1, 'Sugerido en carrito', 'recommended');
  }

  goToCheckout() {
    this.router.navigate(["/checkout"]);
  }
}

