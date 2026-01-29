export interface ProductDailyStats {
  date: string;
  productId: string;
  collection?: string | null;
  views: number;
  addToCart: number;
  removeFromCart: number;
  beginCheckout?: number;
  purchases: number;
  updatedAt?: unknown;
  sources?: Record<string, { views?: number; addToCart?: number; removeFromCart?: number; beginCheckout?: number; purchases?: number }>;
}

export interface AggregatedStatsRow {
  productId: string;
  nombre: string;
  coleccion?: string | null;
  imagen?: string | null;
  views: number;
  addToCart: number;
  removeFromCart: number;
  beginCheckout: number;
  purchases: number;
  tasaIntencion: number;
  tasaConversion: number;
}
