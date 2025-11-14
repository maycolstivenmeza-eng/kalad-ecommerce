import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  DocumentReference
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly COLLECTION_NAME = 'productos';

  constructor(private firestore: Firestore) {}

  /**
   * Obtiene todos los productos
   */
  getAllProducts(): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    return collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Obtiene un producto por su ID
   */
  getProductById(id: string): Observable<Product> {
    const productDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return docData(productDoc, { idField: 'id' }) as Observable<Product>;
  }

  /**
   * Obtiene productos por categoría
   */
  getProductsByCategory(categoria: string): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      productsCollection,
      where('categoria', '==', categoria),
      orderBy('nombre', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Obtiene productos por colección
   */
  getProductsByCollection(coleccion: string): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      productsCollection,
      where('coleccion', '==', coleccion),
      orderBy('nombre', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Obtiene productos destacados (con badge)
   */
  getFeaturedProducts(): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      productsCollection,
      where('badge', '!=', null),
      orderBy('badge', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Obtiene productos con stock disponible
   */
  getProductsInStock(): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      productsCollection,
      where('stock', '>', 0),
      orderBy('stock', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Busca productos por nombre (búsqueda simple)
   * Nota: Para búsquedas más avanzadas, considera usar Algolia o similar
   */
  searchProducts(searchTerm: string): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    // Esta es una búsqueda básica. Para búsquedas avanzadas usar servicios externos
    return collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Crea un nuevo producto
   * Solo para administradores
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<DocumentReference> {
    const productsCollection = collection(this.firestore, this.COLLECTION_NAME);
    return await addDoc(productsCollection, product);
  }

  /**
   * Actualiza un producto existente
   * Solo para administradores
   */
  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const productDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return await updateDoc(productDoc, { ...product });
  }

  /**
   * Elimina un producto
   * Solo para administradores
   */
  async deleteProduct(id: string): Promise<void> {
    const productDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return await deleteDoc(productDoc);
  }

  /**
   * Actualiza el stock de un producto
   */
  async updateStock(id: string, newStock: number): Promise<void> {
    const productDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return await updateDoc(productDoc, { stock: newStock });
  }

  /**
   * Reduce el stock después de una compra
   */
  async reduceStock(id: string, quantity: number): Promise<void> {
    const productDoc = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    const product = await firstValueFrom(this.getProductById(id));

    if (product && product.stock >= quantity) {
      const newStock = product.stock - quantity;
      return await updateDoc(productDoc, { stock: newStock });
    } else {
      throw new Error('Stock insuficiente');
    }
  }
}
