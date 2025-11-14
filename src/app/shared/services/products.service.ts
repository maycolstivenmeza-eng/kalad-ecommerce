import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private products: Product[] = [
    {
      id: '1',
      nombre: 'Mochila KALAD ORIGEN Clásica',
      precio: 150000,
      imagen: '/assets/images/Producto_1.jpg',
      descripcion: 'Mochila tejida a mano por artesanos colombianos. Perfecta combinación de tradición y modernidad.',
      categoria: 'Mochilas',
      coleccion: 'KALAD ORIGEN',
      colores: ['Negro', 'Beige', 'Café'],
      stock: 15,
      caracteristicas: 'Tejido artesanal, compartimento principal amplio, bolsillo frontal con cierre, correas ajustables acolchadas.',
      dimensiones: {
        alto: '40 cm',
        ancho: '30 cm',
        profundidad: '15 cm',
        capacidad: '18 L'
      },
      badge: 'Nuevo'
    },
    {
      id: '2',
      nombre: 'Mochila KALAD AIRE Premium',
      precio: 180000,
      imagen: '/assets/images/KALAD-AIRE.jpeg',
      descripcion: 'Diseño contemporáneo con materiales de alta calidad. Ideal para el día a día urbano.',
      categoria: 'Mochilas',
      coleccion: 'KALAD AIRE',
      colores: ['Azul', 'Gris', 'Negro'],
      stock: 10,
      caracteristicas: 'Material impermeable, compartimento para laptop 15", bolsillos laterales para botella, diseño ergonómico.',
      dimensiones: {
        alto: '45 cm',
        ancho: '32 cm',
        profundidad: '18 cm',
        capacidad: '25 L'
      },
      badge: 'Oferta'
    },
    {
      id: '3',
      nombre: 'Mochila KALAD NOIR Elegante',
      precio: 200000,
      imagen: '/assets/images/KALAD-NOIR.jpeg',
      descripcion: 'Elegancia en cada detalle. Diseñada para quienes buscan sofisticación.',
      categoria: 'Mochilas',
      coleccion: 'KALAD NOIR',
      colores: ['Negro', 'Gris Oscuro'],
      stock: 8,
      caracteristicas: 'Cuero sintético premium, compartimentos organizadores, puerto USB para carga, cierre de seguridad.',
      dimensiones: {
        alto: '42 cm',
        ancho: '30 cm',
        profundidad: '16 cm',
        capacidad: '20 L'
      },
      badge: 'Limitada'
    },
    {
      id: '4',
      nombre: 'Mochila KALAD ORIGEN Mini',
      precio: 120000,
      imagen: '/assets/images/Producto_1.jpg',
      descripcion: 'Versión compacta de nuestra mochila clásica. Perfecta para salidas cortas.',
      categoria: 'Mochilas',
      coleccion: 'KALAD ORIGEN',
      colores: ['Beige', 'Café', 'Terracota'],
      stock: 20,
      caracteristicas: 'Tamaño compacto, tejido artesanal, cierre principal con broche, correa ajustable.',
      dimensiones: {
        alto: '30 cm',
        ancho: '25 cm',
        profundidad: '12 cm',
        capacidad: '12 L'
      },
      badge: null
    },
    {
      id: '5',
      nombre: 'Mochila KALAD AIRE Urban',
      precio: 165000,
      imagen: '/assets/images/KALAD-AIRE.jpeg',
      descripcion: 'Diseño urbano y funcional. Lista para acompañarte en todas tus aventuras.',
      categoria: 'Mochilas',
      coleccion: 'KALAD AIRE',
      colores: ['Negro', 'Azul Marino', 'Verde Oliva'],
      stock: 12,
      caracteristicas: 'Resistente al agua, reflectores de seguridad, compartimento para laptop, múltiples bolsillos.',
      dimensiones: {
        alto: '43 cm',
        ancho: '31 cm',
        profundidad: '17 cm',
        capacidad: '22 L'
      },
      badge: 'Nuevo'
    },
    {
      id: '6',
      nombre: 'Mochila KALAD NOIR Executive',
      precio: 250000,
      imagen: '/assets/images/KALAD-NOIR.jpeg',
      descripcion: 'Diseño ejecutivo para profesionales exigentes. Máxima calidad y estilo.',
      categoria: 'Mochilas',
      coleccion: 'KALAD NOIR',
      colores: ['Negro', 'Café Oscuro'],
      stock: 5,
      caracteristicas: 'Cuero genuino, compartimento acolchado para laptop 17", organizador interno, puerto USB integrado.',
      dimensiones: {
        alto: '48 cm',
        ancho: '35 cm',
        profundidad: '20 cm',
        capacidad: '30 L'
      },
      badge: 'Limitada'
    }
  ];

  constructor() { }

  getProducts(): Observable<Product[]> {
    return of(this.products);
  }

  getProductById(id: string): Observable<Product | undefined> {
    const product = this.products.find(p => p.id === id);
    return of(product);
  }

  getProductsByCollection(collection: string): Observable<Product[]> {
    const filtered = this.products.filter(p => p.coleccion === collection);
    return of(filtered);
  }

  searchProducts(term: string): Observable<Product[]> {
    const filtered = this.products.filter(p =>
      p.nombre.toLowerCase().includes(term.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(term.toLowerCase())
    );
    return of(filtered);
  }
}
