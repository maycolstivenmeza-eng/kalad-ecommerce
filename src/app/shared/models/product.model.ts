export interface Product {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  descripcion: string;
  categoria: string;
  coleccion: string;
  colores: string[];
  stock: number;
  caracteristicas?: string;
  dimensiones?: {
    alto: string;
    ancho: string;
    profundidad: string;
    capacidad: string;
  };
  badge?: 'Nuevo' | 'Oferta' | 'Limitada' | null;
}
