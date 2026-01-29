import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product.model';
import { CartItem } from './cart.service';
import { environment } from '../../../environments/environment';
import { Functions, httpsCallable } from '@angular/fire/functions';

type AnalyticsProduct = Product | CartItem;

type AnalyticsEventType =
  | 'view_product'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase';

type AnalyticsSource =
  | 'catalog'
  | 'collection'
  | 'search'
  | 'recommended'
  | 'instagram'
  | 'direct'
  | 'other';

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
  private readonly viewDedupeMs = 30 * 60 * 1000;
  private readonly checkoutDedupeMs = 30 * 60 * 1000;
  private readonly sourceTtlMs = 5 * 60 * 1000;
  private readonly allowedSources: AnalyticsSource[] = [
    'catalog',
    'collection',
    'search',
    'recommended',
    'instagram',
    'direct',
    'other'
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document,
    private functions: Functions
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
      this.ensureSessionId();
      this.cacheAttributionSource();
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

  trackView(product: Product, source?: AnalyticsSource): void {
    if (!product?.id) return;
    if (!this.shouldTrackView(product.id)) return;
    const resolvedSource = this.resolveSource(source);
    this.trackViewItem(product);
    this.sendProductEvent('view_product', product, 1, resolvedSource);
  }

  trackAddToCart(
    product: AnalyticsProduct,
    quantity = 1,
    listName?: string,
    source?: AnalyticsSource
  ): void {
    if (product?.id) {
      const resolvedSource = this.resolveSource(source);
      this.sendProductEvent('add_to_cart', product, quantity, resolvedSource);
    }
    const items = [this.toItem(product, quantity, listName)];
    this.dispatch('add_to_cart', {
      currency: this.currency,
      value: this.roundCurrency(product.precio * quantity),
      items
    });
  }

  trackRemoveFromCart(
    product: AnalyticsProduct,
    quantity = 1,
    listName?: string,
    source?: AnalyticsSource
  ): void {
    if (product?.id) {
      const resolvedSource = this.resolveSource(source);
      this.sendProductEvent('remove_from_cart', product, quantity, resolvedSource);
    }
    const items = [this.toItem(product, quantity, listName)];
    this.dispatch('remove_from_cart', {
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

  trackBeginCheckout(
    items: CartItem[],
    totals: { subtotal: number; shipping: number; discount: number },
    source?: AnalyticsSource,
    coupon?: string
  ): void {
    if (!items.length) return;
    if (!this.shouldTrackBeginCheckout()) return;

    const resolvedSource = this.resolveSource(source);

    for (const item of items) {
      if (item?.id) {
        this.sendProductEvent('begin_checkout', item, 1, resolvedSource);
      }
    }

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
    totals: { subtotal: number; shipping: number; discount: number; total: number; coupon?: string },
    source?: AnalyticsSource
  ): void {
    if (!items.length) return;
    const resolvedSource = this.resolveSource(source);
    for (const item of items) {
      if (item?.id) {
        this.sendProductEvent('purchase', item, item.qty || 1, resolvedSource);
      }
    }

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

  setLastProductSource(source: AnalyticsSource): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.allowedSources.includes(source)) return;
    try {
      sessionStorage.setItem('kalad_last_source', source);
      sessionStorage.setItem('kalad_last_source_ts', String(Date.now()));
    } catch {
      // ignore
    }
  }

  resolveSource(fallback?: AnalyticsSource): AnalyticsSource {
    if (fallback && this.allowedSources.includes(fallback)) return fallback;
    const stored = this.getStoredSource();
    if (stored) return stored;
    const attr = this.getAttributionSource();
    return attr || 'direct';
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

  private shouldTrackView(productId: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const key = `viewed_${productId}`;
    const now = Date.now();
    try {
      const lastRaw = localStorage.getItem(key);
      const last = lastRaw ? Number(lastRaw) : 0;
      if (last && now - last < this.viewDedupeMs) {
        return false;
      }
      localStorage.setItem(key, String(now));
      return true;
    } catch {
      return true;
    }
  }

  private shouldTrackBeginCheckout(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const sessionId = this.ensureSessionId();
    const key = `checkout_started_${sessionId}`;
    const now = Date.now();
    try {
      const lastRaw = localStorage.getItem(key);
      const last = lastRaw ? Number(lastRaw) : 0;
      if (last && now - last < this.checkoutDedupeMs) {
        return false;
      }
      localStorage.setItem(key, String(now));
      return true;
    } catch {
      return true;
    }
  }

  private async sendProductEvent(
    eventType: AnalyticsEventType,
    product: AnalyticsProduct,
    quantity: number,
    source?: AnalyticsSource
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!product?.id) return;

    try {
      const sessionId = this.ensureSessionId();
      const payload = {
        productId: product.id,
        eventType,
        collection: (product as Product)?.coleccion ?? null,
        source: source || null,
        qty: quantity || 1,
        sessionId
      };

      const callable = httpsCallable(this.functions, 'trackProductEvent');
      await callable(payload);
    } catch (error) {
      console.warn('No se pudo registrar evento de analitica', error);
    }
  }

  private ensureSessionId(): string {
    if (!isPlatformBrowser(this.platformId)) return 'server';
    try {
      const existing = localStorage.getItem('kalad_session_id');
      if (existing) return existing;
      const next = this.generateUuid();
      localStorage.setItem('kalad_session_id', next);
      return next;
    } catch {
      return this.generateUuid();
    }
  }

  private generateUuid(): string {
    const win = this.document.defaultView as any;
    if (win?.crypto?.randomUUID) {
      return win.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    if (win?.crypto?.getRandomValues) {
      win.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    // RFC4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return (
      toHex(bytes[0]) +
      toHex(bytes[1]) +
      toHex(bytes[2]) +
      toHex(bytes[3]) +
      '-' +
      toHex(bytes[4]) +
      toHex(bytes[5]) +
      '-' +
      toHex(bytes[6]) +
      toHex(bytes[7]) +
      '-' +
      toHex(bytes[8]) +
      toHex(bytes[9]) +
      '-' +
      toHex(bytes[10]) +
      toHex(bytes[11]) +
      toHex(bytes[12]) +
      toHex(bytes[13]) +
      toHex(bytes[14]) +
      toHex(bytes[15])
    );
  }

  private getStoredSource(): AnalyticsSource | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const value = sessionStorage.getItem('kalad_last_source') as AnalyticsSource | null;
      const tsRaw = sessionStorage.getItem('kalad_last_source_ts');
      const ts = tsRaw ? Number(tsRaw) : 0;
      if (!value || !this.allowedSources.includes(value)) return null;
      if (ts && Date.now() - ts > this.sourceTtlMs) return null;
      return value;
    } catch {
      return null;
    }
  }

  private cacheAttributionSource(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const source = this.getAttributionSource();
    if (!source) return;
    this.setLastProductSource(source);
  }

  private getAttributionSource(): AnalyticsSource | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const win = this.document.defaultView;
      if (!win) return null;
      const params = new URLSearchParams(win.location.search || '');
      const utmSource = (params.get('utm_source') || '').toLowerCase();
      if (utmSource.includes('instagram')) return 'instagram';
      if (utmSource) return 'other';
      return null;
    } catch {
      return null;
    }
  }
}
