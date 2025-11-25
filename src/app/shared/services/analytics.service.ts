import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product.model';
import { CartItem } from './cart.service';
import { environment } from '../../../environments/environment';

type AnalyticsProduct = Product | CartItem;

interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
  item_list_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private initialized = false;
  private readonly measurementId =
    (environment as any)?.analytics?.measurementId || environment.firebase?.measurementId;
  private readonly gtmId = (environment as any)?.analytics?.gtmId;
  private readonly loadGa4Script =
    (environment as any)?.analytics?.loadGa4Script ?? true;
  private readonly currency = (environment as any)?.wompi?.currency || 'COP';

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.initialized || !this.isEnabled()) {
      return;
    }

    this.initialized = true;

    const start = () => {
      this.ensureDataLayer();
      this.loadTagManager();
      this.loadGa4();
    };

    const win = this.document.defaultView as any;
    if (win && typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(start, { timeout: 5000 });
    } else {
      setTimeout(start, 3000);
    }
  }

  trackPageView(url: string, title?: string): void {
    this.dispatch('page_view', {
      page_location: this.resolveUrl(url),
      page_title: title || this.document.title
    });
  }

  trackViewItemList(name: string, products: Product[]): void {
    const items = products.map((product, index) => this.toItem(product, 1, name, index + 1));
    this.dispatch('view_item_list', {
      item_list_name: name,
      currency: this.currency,
      items
    });
  }

  trackSelectItem(product: Product, listName?: string): void {
    const items = [this.toItem(product, 1, listName)];
    this.dispatch('select_item', {
      item_list_name: listName,
      currency: this.currency,
      items
    });
  }

  trackViewItem(product: Product): void {
    const items = [this.toItem(product)];
    this.dispatch('view_item', {
      currency: this.currency,
      items
    });
  }

  trackAddToCart(product: AnalyticsProduct, quantity = 1, listName?: string): void {
    const items = [this.toItem(product, quantity, listName)];
    this.dispatch('add_to_cart', {
      currency: this.currency,
      value: this.roundCurrency(product.precio * quantity),
      items
    });
  }

  trackViewCart(items: CartItem[], subtotal: number, shipping: number, discount: number): void {
    if (!items.length) return;
    this.dispatch('view_cart', {
      currency: this.currency,
      value: this.roundCurrency(Math.max(0, subtotal - discount)),
      shipping,
      discount,
      items: items.map((item) => this.toItem(item, item.qty))
    });
  }

  trackBeginCheckout(items: CartItem[], totals: { subtotal: number; shipping: number; discount: number }, coupon?: string): void {
    if (!items.length) return;
    this.dispatch('begin_checkout', {
      currency: this.currency,
      value: this.roundCurrency(Math.max(0, totals.subtotal + totals.shipping - totals.discount)),
      shipping: totals.shipping,
      discount: totals.discount,
      coupon: coupon?.trim() || undefined,
      items: items.map((item) => this.toItem(item, item.qty))
    });
  }

  trackPurchase(
    orderId: string | null,
    transactionId: string | null,
    items: CartItem[],
    totals: { subtotal: number; shipping: number; discount: number; total: number; coupon?: string }
  ): void {
    if (!items.length) return;
    this.dispatch('purchase', {
      transaction_id: transactionId || orderId || `order-${Date.now()}`,
      affiliation: 'Kalad Online',
      currency: this.currency,
      value: this.roundCurrency(Math.max(0, totals.total)),
      shipping: totals.shipping,
      discount: totals.discount,
      coupon: totals.coupon?.trim() || undefined,
      items: items.map((item) => this.toItem(item, item.qty))
    });
  }

  trackCartAbandoned(items: CartItem[], total: number, reason: string): void {
    if (!items.length) return;
    this.dispatch('cart_abandoned', {
      currency: this.currency,
      value: this.roundCurrency(Math.max(0, total)),
      reason,
      items: items.map((item) => this.toItem(item, item.qty))
    });
  }

  private dispatch(eventName: string, params: Record<string, any>): void {
    if (!isPlatformBrowser(this.platformId) || !this.isEnabled()) return;

    this.init();
    const win = this.document.defaultView as any;
    if (!win || !win.dataLayer) return;

    if (this.shouldLoadGa4()) {
      this.gtag('event', eventName, params);
    }

    win.dataLayer.push({ event: eventName, ...params });
  }

  private toItem(product: AnalyticsProduct, quantity = 1, listName?: string, index?: number): AnalyticsItem {
    return {
      item_id: product.id,
      item_name: product.nombre,
      item_brand: 'Kalad',
      item_category: (product as Product)?.categoria || undefined,
      item_category2: (product as Product)?.coleccion || undefined,
      item_variant: (product as any)?.color || undefined,
      price: this.roundCurrency(product.precio),
      quantity,
      index,
      item_list_name: listName
    };
  }

  private ensureDataLayer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const win = this.document.defaultView as any;
    if (!win.dataLayer) {
      win.dataLayer = [];
    }
  }

  private loadGa4(): void {
    if (!this.shouldLoadGa4()) return;
    const id = this.measurementId;
    if (!id || this.document.querySelector(`script[data-ga-measurement="${id}"]`)) return;

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.setAttribute('data-ga-measurement', id);
    this.document.head.appendChild(script);

    this.gtag('js', new Date());
    this.gtag('config', id, { send_page_view: false });
  }

  private loadTagManager(): void {
    if (!this.shouldLoadGtm()) return;
    const id = this.gtmId as string;
    if (this.document.querySelector(`script[data-gtm-id="${id}"]`)) return;

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    script.setAttribute('data-gtm-id', id);
    this.document.head.appendChild(script);
  }

  private gtag(...args: any[]): void {
    if (!isPlatformBrowser(this.platformId) || !this.shouldLoadGa4()) return;
    const win = this.document.defaultView as any;
    if (!win) return;
    this.ensureDataLayer();
    win.dataLayer.push(args);
  }

  private isEnabled(): boolean {
    return this.shouldLoadGa4() || this.shouldLoadGtm();
  }

  private shouldLoadGa4(): boolean {
    return !!this.measurementId && this.loadGa4Script;
  }

  private shouldLoadGtm(): boolean {
    return !!this.gtmId && !/xxxx/i.test(this.gtmId);
  }

  private resolveUrl(url: string): string {
    if (!isPlatformBrowser(this.platformId)) return url;
    const win = this.document.defaultView;
    if (!win) return url;
    if (url.startsWith('http')) return url;
    return `${win.location.origin}${url}`;
  }

  private roundCurrency(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
}
