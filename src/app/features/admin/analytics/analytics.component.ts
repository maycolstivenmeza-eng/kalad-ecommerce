import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import {
  Firestore,
  collectionGroup,
  getDocs,
  query,
  where
} from '@angular/fire/firestore';

import { Product } from '../../../shared/models/product.model';
import { ProductService } from '../../../shared/services/product.service';
import { AuthService } from '../../../shared/services/auth.service';
import {
  AggregatedStatsRow,
  ProductDailyStats
} from '../../../shared/models/product-analytics.model';

interface RangeOption {
  value: string;
  label: string;
  days?: number;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['../productos/productos.component.css', './analytics.component.css'],
})
export class AdminAnalyticsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  adminDebug: { email: string | null; isAdmin: boolean } | null = null;

  rangeOptions: RangeOption[] = [
    { value: '7', label: 'Últimos 7 días', days: 7 },
    { value: '30', label: 'Últimos 30 días', days: 30 },
    { value: '90', label: 'Últimos 90 días', days: 90 },
    { value: 'custom', label: 'Personalizado' }
  ];

  selectedRange = '7';
  customStart = '';
  customEnd = '';
  selectedCollection = '';
  selectedSource = '';

  collections: { value: string; label: string }[] = [{ value: '', label: 'Todas' }];
  sources: { value: string; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'catalog', label: 'Catálogo' },
    { value: 'collection', label: 'Colección' },
    { value: 'search', label: 'Búsqueda' },
    { value: 'recommended', label: 'Recomendados' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'direct', label: 'Directo' },
    { value: 'other', label: 'Otros' }
  ];

  rows: AggregatedStatsRow[] = [];
  topViews: AggregatedStatsRow[] = [];
  topAddToCart: AggregatedStatsRow[] = [];
  topPurchases: AggregatedStatsRow[] = [];
  topIntention: AggregatedStatsRow[] = [];
  topConversion: AggregatedStatsRow[] = [];
  topLowConversion: AggregatedStatsRow[] = [];
  sourceTotals: { source: string; views: number; addToCart: number; purchases: number; conversion: number }[] = [];

  kpis = {
    views: 0,
    addToCart: 0,
    removeFromCart: 0,
    beginCheckout: 0,
    purchases: 0,
  };
  prevKpis = {
    views: 0,
    addToCart: 0,
    removeFromCart: 0,
    beginCheckout: 0,
    purchases: 0,
  };

  private productsIndex = new Map<string, Product>();
  private startDateKey = '';
  private endDateKey = '';
  private prevStartDateKey = '';
  private prevEndDateKey = '';

  constructor(
    private firestore: Firestore,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bootstrapAnalytics();
  }

  private async bootstrapAnalytics(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.authService.user$.pipe(filter(Boolean), take(1))
      );
      await user?.getIdToken(true);
    } catch {
      // ignore
    }

    const token = await this.authService.getIdTokenResult(true).catch(() => null);
    const isAdmin = !!token?.claims?.admin;
    this.adminDebug = {
      email: this.authService.getCurrentUserEmail(),
      isAdmin
    };
    if (!isAdmin) {
      this.error = 'Tu cuenta no tiene permisos de administrador.';
      return;
    }
    this.loadProductsIndex().then(() => this.loadAnalytics());
  }

  get dateRangeLabel(): string {
    if (!this.startDateKey || !this.endDateKey) return '';
    return `${this.startDateKey} al ${this.endDateKey}`;
  }

  async refresh(): Promise<void> {
    await this.loadAnalytics();
  }

  resetFilters(): void {
    this.selectedRange = '7';
    this.customStart = '';
    this.customEnd = '';
    this.selectedCollection = '';
    this.selectedSource = '';
    this.refresh();
  }

  exportCsv(): void {
    if (!this.rows.length) return;
    const generatedAt = new Date().toISOString();
    const header = [
      'productId',
      'name',
      'collection',
      'views',
      'addToCart',
      'removeFromCart',
      'beginCheckout',
      'purchases',
      'intentionRate',
      'conversionRate',
      'dateRangeStart',
      'dateRangeEnd',
      'generatedAt'
    ];

    const lines = [header.join(',')];
    for (const row of this.rows) {
      const line = [
        row.productId,
        this.escapeCsv(row.nombre),
        this.escapeCsv(row.coleccion || ''),
        row.views,
        row.addToCart,
        row.removeFromCart,
        row.beginCheckout,
        row.purchases,
        row.tasaIntencion.toFixed(4),
        row.tasaConversion.toFixed(4),
        this.startDateKey,
        this.endDateKey,
        generatedAt
      ];
      lines.push(line.join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateKey = this.formatDateKeyForFile(new Date());
    link.href = url;
    link.download = `kalad-analytics-${dateKey}-range.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async loadProductsIndex(): Promise<void> {
    try {
      const products = await firstValueFrom(this.productService.getAllProducts());
      const collectionSet = new Set<string>();
      this.productsIndex.clear();

      for (const product of products || []) {
        if (product?.id) {
          this.productsIndex.set(product.id, product);
        }
        const col = (product?.coleccion ?? '').toString().trim();
        if (col) collectionSet.add(col);
      }

      this.collections = [
        { value: '', label: 'Todas' },
        ...Array.from(collectionSet)
          .sort((a, b) => a.localeCompare(b))
          .map((col) => ({ value: col, label: col }))
      ];
    } catch (error) {
      console.warn('No se pudo cargar el índice de productos', error);
    }
  }

  private async loadAnalytics(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.computeDateRange();

      const aggregated = await this.fetchRangeAggregates(this.startDateKey, this.endDateKey);

      this.rows = Array.from(aggregated.values()).map((row) => ({
        ...row,
        tasaIntencion: row.views > 0 ? row.addToCart / row.views : 0,
        tasaConversion: row.views > 0 ? row.purchases / row.views : 0
      }));

      this.kpis = this.rows.reduce(
        (acc, row) => {
          acc.views += row.views;
          acc.addToCart += row.addToCart;
          acc.removeFromCart += row.removeFromCart;
          acc.beginCheckout += row.beginCheckout;
          acc.purchases += row.purchases;
          return acc;
        },
        { views: 0, addToCart: 0, removeFromCart: 0, beginCheckout: 0, purchases: 0 }
      );

      this.topViews = [...this.rows]
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      this.topAddToCart = [...this.rows]
        .sort((a, b) => b.addToCart - a.addToCart)
        .slice(0, 10);

      this.topPurchases = [...this.rows]
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 10);

      this.topIntention = [...this.rows]
        .sort((a, b) => b.tasaIntencion - a.tasaIntencion)
        .slice(0, 10);

      this.topConversion = [...this.rows]
        .sort((a, b) => b.tasaConversion - a.tasaConversion)
        .slice(0, 10);

      this.topLowConversion = [...this.rows]
        .filter((r) => r.views >= 50)
        .sort((a, b) => a.tasaConversion - b.tasaConversion)
        .slice(0, 10);

      await this.loadSourceTotals();

      if (this.prevStartDateKey && this.prevEndDateKey) {
        const prevAgg = await this.fetchRangeAggregates(this.prevStartDateKey, this.prevEndDateKey);
        this.prevKpis = Array.from(prevAgg.values()).reduce(
          (acc, row) => {
            acc.views += row.views;
            acc.addToCart += row.addToCart;
            acc.removeFromCart += row.removeFromCart;
            acc.beginCheckout += row.beginCheckout;
            acc.purchases += row.purchases;
            return acc;
          },
          { views: 0, addToCart: 0, removeFromCart: 0, beginCheckout: 0, purchases: 0 }
        );
      } else {
        this.prevKpis = { views: 0, addToCart: 0, removeFromCart: 0, beginCheckout: 0, purchases: 0 };
      }
    } catch (error) {
      console.error('Error cargando analítica', error);
      this.error = 'No se pudieron cargar los datos de analítica.';
      this.rows = [];
      this.topViews = [];
      this.topAddToCart = [];
      this.topPurchases = [];
      this.topIntention = [];
      this.topConversion = [];
      this.topLowConversion = [];
      this.sourceTotals = [];
      this.kpis = { views: 0, addToCart: 0, removeFromCart: 0, beginCheckout: 0, purchases: 0 };
      this.prevKpis = { views: 0, addToCart: 0, removeFromCart: 0, beginCheckout: 0, purchases: 0 };
    } finally {
      this.loading = false;
    }
  }

  private computeDateRange(): void {
    if (this.selectedRange === 'custom' && this.customStart && this.customEnd) {
      const start = this.customStart;
      const end = this.customEnd;
      if (start <= end) {
        this.startDateKey = start;
        this.endDateKey = end;
      } else {
        this.startDateKey = end;
        this.endDateKey = start;
      }
      const days = this.countDaysBetween(this.startDateKey, this.endDateKey);
      this.prevEndDateKey = this.subtractDays(this.startDateKey, 1);
      this.prevStartDateKey = this.subtractDays(this.startDateKey, days);
      return;
    }

    const option = this.rangeOptions.find((r) => r.value === this.selectedRange);
    const days = option?.days ?? 7;
    const todayKey = this.getBogotaDateKey();
    const daysBack = Math.max(0, days - 1);
    const startKey = this.subtractDays(todayKey, daysBack);
    this.startDateKey = startKey;
    this.endDateKey = todayKey;
    this.prevEndDateKey = this.subtractDays(startKey, 1);
    this.prevStartDateKey = this.subtractDays(startKey, days);
  }

  private async fetchRangeAggregates(start: string, end: string): Promise<Map<string, AggregatedStatsRow>> {
    const constraints = [
      where('date', '>=', start),
      where('date', '<=', end)
    ];

    if (this.selectedCollection) {
      constraints.push(where('collection', '==', this.selectedCollection));
    }

    const qy = query(collectionGroup(this.firestore, 'productDays'), ...constraints);
    const snapshot = await getDocs(qy);

    const aggregated = new Map<string, AggregatedStatsRow>();

    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data() as ProductDailyStats;
      const productId = data?.productId;
      if (!productId) return;

      const sourceData = this.selectedSource
        ? (data.sources?.[this.selectedSource] ?? {})
        : null;

      const views = this.selectedSource ? Number(sourceData?.views) || 0 : Number(data.views) || 0;
      const addToCart = this.selectedSource
        ? Number(sourceData?.addToCart) || 0
        : Number(data.addToCart) || 0;
      const removeFromCart = this.selectedSource
        ? Number(sourceData?.removeFromCart) || 0
        : Number(data.removeFromCart) || 0;
      const beginCheckout = this.selectedSource
        ? Number(sourceData?.beginCheckout) || 0
        : Number(data.beginCheckout) || 0;
      const purchases = this.selectedSource
        ? Number(sourceData?.purchases) || 0
        : Number(data.purchases) || 0;

      const baseProduct = this.productsIndex.get(productId);
      const existing = aggregated.get(productId) || {
        productId,
        nombre: baseProduct?.nombre || 'Producto sin nombre',
        coleccion: data.collection ?? baseProduct?.coleccion ?? null,
        imagen: baseProduct?.imagen ?? null,
        views: 0,
        addToCart: 0,
        removeFromCart: 0,
        beginCheckout: 0,
        purchases: 0,
        tasaIntencion: 0,
        tasaConversion: 0,
      };

      existing.views += views;
      existing.addToCart += addToCart;
      existing.removeFromCart += removeFromCart;
      existing.beginCheckout += beginCheckout;
      existing.purchases += purchases;
      aggregated.set(productId, existing);
    });

    return aggregated;
  }

  private async loadSourceTotals(): Promise<void> {
    const baseSources = ['catalog', 'collection', 'search', 'recommended', 'instagram', 'direct', 'other'];
    const totals = baseSources.map((source) => ({ source, views: 0, addToCart: 0, purchases: 0, conversion: 0 }));

    if (this.selectedSource) {
      this.sourceTotals = totals;
      return;
    }

    const constraints = [
      where('date', '>=', this.startDateKey),
      where('date', '<=', this.endDateKey)
    ];
    if (this.selectedCollection) {
      constraints.push(where('collection', '==', this.selectedCollection));
    }
    const qy = query(collectionGroup(this.firestore, 'productDays'), ...constraints);
    const snapshot = await getDocs(qy);

    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data() as ProductDailyStats;
      if (!data?.sources) return;
      for (const source of baseSources) {
        const bucket = data.sources?.[source];
        if (!bucket) continue;
        const row = totals.find((t) => t.source === source);
        if (!row) continue;
        row.views += Number(bucket.views) || 0;
        row.addToCart += Number(bucket.addToCart) || 0;
        row.purchases += Number(bucket.purchases) || 0;
      }
    });

    totals.forEach((row) => {
      row.conversion = row.views > 0 ? row.purchases / row.views : 0;
    });

    this.sourceTotals = totals;
  }

  private subtractDays(dateKey: string, days: number): string {
    const [year, month, day] = dateKey.split('-').map((v) => Number(v));
    const base = new Date(Date.UTC(year, month - 1, day));
    base.setUTCDate(base.getUTCDate() - days);
    return this.formatDateKey(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
  }

  private getBogotaDateKey(date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const map: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        map[part.type] = part.value;
      }
    }
    return `${map['year']}-${map['month']}-${map['day']}`;
  }

  private formatDateKey(year: number, month: number, day: number): string {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  private formatDateKeyForFile(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  private countDaysBetween(start: string, end: string): number {
    const [y1, m1, d1] = start.split('-').map((v) => Number(v));
    const [y2, m2, d2] = end.split('-').map((v) => Number(v));
    const startDate = new Date(Date.UTC(y1, m1 - 1, d1));
    const endDate = new Date(Date.UTC(y2, m2 - 1, d2));
    const diff = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
    return diff + 1;
  }

  deltaPercent(current: number, previous: number): string {
    if (!previous && !current) return '0%';
    if (!previous && current > 0) return '∞';
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  }

  private escapeCsv(value: string): string {
    const safe = (value || '').replace(/"/g, '""');
    return `"${safe}"`;
  }

  irADashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  irAProductos(): void {
    this.router.navigate(['/admin/productos']);
  }

  irAPedidos(): void {
    this.router.navigate(['/admin/pedidos']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
