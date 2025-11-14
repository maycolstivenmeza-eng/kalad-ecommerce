# Configuración de Firebase para KALAD E-commerce

Esta guía te ayudará a configurar Firebase para tu proyecto de e-commerce.

## 1. Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa el nombre del proyecto (ej: "kalad-ecommerce")
4. Sigue los pasos del asistente

## 2. Configurar Firestore Database

1. En Firebase Console, ve a **Build > Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona el modo:
   - **Modo de prueba** (para desarrollo): Acceso abierto por 30 días
   - **Modo de producción**: Requiere reglas de seguridad
4. Selecciona la ubicación de la base de datos (ej: `us-central` o `southamerica-east1`)

## 3. Configurar Storage (Opcional para imágenes)

1. En Firebase Console, ve a **Build > Storage**
2. Haz clic en "Comenzar"
3. Configura las reglas de seguridad según tus necesidades

## 4. Obtener las Credenciales de Firebase

1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. En la pestaña "General", baja hasta "Tus apps"
3. Haz clic en el ícono de Web (`</>`)
4. Registra tu app con un nombre (ej: "kalad-web")
5. Copia la configuración que se muestra

## 5. Configurar las Variables de Entorno

Abre el archivo `src/environments/environment.ts` y reemplaza los valores con los de tu proyecto:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID",
    measurementId: "TU_MEASUREMENT_ID"
  },
  // ... resto de la configuración
};
```

Haz lo mismo para `environment.prod.ts` con las credenciales de producción.

## 6. Estructura de Datos en Firestore

### Colección: `products`

Cada documento de producto tiene la siguiente estructura:

```json
{
  "id": "auto-generado-por-firestore",
  "nombre": "Mochila KALAD ORIGEN",
  "precio": 150000,
  "imagen": "https://...",
  "descripcion": "Descripción del producto...",
  "categoria": "Mochilas",
  "coleccion": "ORIGEN",
  "colores": ["Negro", "Café", "Gris"],
  "stock": 50,
  "caracteristicas": "Material resistente...",
  "dimensiones": {
    "alto": "45 cm",
    "ancho": "30 cm",
    "profundidad": "15 cm",
    "capacidad": "20 L"
  },
  "badge": "Nuevo"
}
```

### Colección: `orders`

Cada documento de pedido tiene la siguiente estructura:

```json
{
  "id": "auto-generado-por-firestore",
  "reference": "KALAD-1234567890",
  "orderDate": "Timestamp",
  "status": "PENDING",
  "paymentStatus": "APPROVED",
  "customerInfo": {
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "3001234567",
    "documentType": "CC",
    "documentNumber": "1234567890"
  },
  "shippingAddress": {
    "address": "Calle 123 #45-67",
    "city": "Bogotá",
    "department": "Cundinamarca",
    "postalCode": "110111"
  },
  "items": [
    {
      "productId": "xyz123",
      "nombre": "Mochila KALAD ORIGEN",
      "precio": 150000,
      "cantidad": 1,
      "color": "Negro",
      "imagen": "https://...",
      "subtotal": 150000
    }
  ],
  "subtotal": 150000,
  "shippingCost": 0,
  "total": 150000,
  "paymentInfo": {
    "transactionId": "wompi-123456",
    "paymentMethod": "CARD",
    "paymentDate": "Timestamp"
  },
  "notes": "Entregar en la portería",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 7. Reglas de Seguridad de Firestore (Recomendadas)

Actualiza las reglas de seguridad en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Productos: Lectura pública, escritura solo admin
    match /products/{productId} {
      allow read: if true;
      allow write: if false; // Cambiar cuando implementes autenticación de admin
    }

    // Pedidos: Lectura y escritura según email del cliente
    match /orders/{orderId} {
      allow read: if true; // En producción, restringir por usuario
      allow create: if true; // Cualquiera puede crear un pedido
      allow update, delete: if false; // Solo admin puede actualizar/eliminar
    }
  }
}
```

## 8. Agregar Productos de Prueba

### Opción 1: Desde Firebase Console (Recomendado para iniciar)

1. Ve a Firebase Console > Firestore Database
2. Haz clic en **"Iniciar colección"** (o "+ Agregar colección" si ya tienes datos)
3. ID de colección: `products`
4. Haz clic en **"Siguiente"**
5. Agrega un documento con los siguientes campos:
   - **ID del documento**: Deja que Firebase lo genere automáticamente
   - Agrega estos campos (haz clic en "+ Agregar campo"):

   ```
   nombre (string): "Mochila KALAD ORIGEN Clásica"
   precio (number): 150000
   imagen (string): "/assets/images/Producto_1.jpg"
   descripcion (string): "Mochila tejida a mano por artesanos colombianos..."
   categoria (string): "Mochilas"
   coleccion (string): "KALAD ORIGEN"
   colores (array): ["Negro", "Beige", "Café"]
   stock (number): 15
   caracteristicas (string): "Tejido artesanal, compartimento principal amplio..."
   badge (string): "Nuevo"
   dimensiones (map):
     - alto (string): "40 cm"
     - ancho (string): "30 cm"
     - profundidad (string): "15 cm"
     - capacidad (string): "18 L"
   ```

6. Haz clic en **"Guardar"**
7. Repite el proceso para agregar más productos

### Opción 2: Usando la consola del navegador (Rápido para múltiples productos)

1. Abre tu aplicación en el navegador
2. Abre la consola del navegador (F12)
3. Copia y pega este código:

```javascript
// Importar el servicio (solo funciona si tienes acceso al componente)
// Ejemplo en la consola del navegador después de cargar la app:

const productos = [
  {
    nombre: 'Mochila KALAD ORIGEN Clásica',
    precio: 150000,
    imagen: '/assets/images/Producto_1.jpg',
    descripcion: 'Mochila tejida a mano por artesanos colombianos. Perfecta combinación de tradición y modernidad.',
    categoria: 'Mochilas',
    coleccion: 'KALAD ORIGEN',
    colores: ['Negro', 'Beige', 'Café'],
    stock: 15,
    caracteristicas: 'Tejido artesanal, compartimento principal amplio, bolsillo frontal con cierre.',
    dimensiones: { alto: '40 cm', ancho: '30 cm', profundidad: '15 cm', capacidad: '18 L' },
    badge: 'Nuevo'
  },
  // ... más productos
];

// Nota: Esta opción requiere crear un método temporal en tu componente
```

### Opción 3: Usando el ProductService (Para desarrollo)

Crea un componente temporal para agregar productos:

```typescript
import { Component } from '@angular/core';
import { ProductService } from './shared/services/product.service';

@Component({
  selector: 'app-seed-products',
  template: '<button (click)="seedProducts()">Agregar Productos</button>'
})
export class SeedProductsComponent {
  constructor(private productService: ProductService) {}

  async seedProducts() {
    const productos = [
      {
        nombre: 'Mochila KALAD ORIGEN Clásica',
        precio: 150000,
        imagen: '/assets/images/Producto_1.jpg',
        descripcion: 'Mochila tejida a mano...',
        categoria: 'Mochilas',
        coleccion: 'KALAD ORIGEN',
        colores: ['Negro', 'Beige', 'Café'],
        stock: 15,
        caracteristicas: 'Tejido artesanal...',
        dimensiones: { alto: '40 cm', ancho: '30 cm', profundidad: '15 cm', capacidad: '18 L' },
        badge: 'Nuevo' as const
      },
      // Agrega más productos aquí
    ];

    for (const producto of productos) {
      try {
        await this.productService.createProduct(producto);
        console.log(`✅ Producto agregado: ${producto.nombre}`);
      } catch (error) {
        console.error(`❌ Error al agregar ${producto.nombre}:`, error);
      }
    }

    console.log('🎉 Productos agregados exitosamente');
  }
}
```

**IMPORTANTE:**
- SSR ha sido deshabilitado para evitar conflictos con Firebase
- Todos los componentes cargan datos directamente desde Firebase en el navegador
- Asegúrate de tener productos en tu base de datos de Firestore antes de probar

## 9. Servicios Disponibles

### ProductService

- `getAllProducts()`: Obtiene todos los productos
- `getProductById(id)`: Obtiene un producto específico
- `getProductsByCategory(categoria)`: Filtra por categoría
- `getProductsByCollection(coleccion)`: Filtra por colección
- `getFeaturedProducts()`: Productos destacados
- `createProduct(product)`: Crea un producto (admin)
- `updateProduct(id, product)`: Actualiza un producto (admin)
- `deleteProduct(id)`: Elimina un producto (admin)
- `updateStock(id, stock)`: Actualiza el stock
- `reduceStock(id, quantity)`: Reduce el stock después de una compra

### OrderService

- `createOrder(order)`: Crea un nuevo pedido
- `getAllOrders()`: Obtiene todos los pedidos
- `getOrderById(id)`: Obtiene un pedido específico
- `getOrderByReference(reference)`: Busca por referencia
- `getOrdersByEmail(email)`: Pedidos de un cliente
- `getOrdersByStatus(status)`: Filtra por estado
- `getOrdersByPaymentStatus(status)`: Filtra por estado de pago
- `updateOrderStatus(id, status)`: Actualiza el estado
- `updatePaymentStatus(id, status, info)`: Actualiza el pago
- `cancelOrder(id)`: Cancela un pedido

## 10. Estados de Pedidos

### OrderStatus
- `PENDING`: Pendiente de procesamiento
- `PROCESSING`: En procesamiento
- `SHIPPED`: Enviado
- `DELIVERED`: Entregado
- `CANCELLED`: Cancelado

### PaymentStatus
- `PENDING`: Pago pendiente
- `APPROVED`: Pago aprobado
- `DECLINED`: Pago rechazado
- `VOIDED`: Pago anulado
- `ERROR`: Error en el pago

## 11. Próximos Pasos

1. Configurar autenticación de Firebase (opcional)
2. Implementar roles de usuario (cliente/admin)
3. Crear panel de administración
4. Configurar Cloud Functions para procesamiento de pedidos
5. Implementar Analytics de Firebase
6. Configurar notificaciones push (Cloud Messaging)

## Soporte

Para más información, consulta la [documentación oficial de Firebase](https://firebase.google.com/docs).
