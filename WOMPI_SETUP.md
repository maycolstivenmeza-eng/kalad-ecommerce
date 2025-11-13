# Configuración de Wompi para KALAD E-commerce

## 📋 Pasos para integrar Wompi

### 1. Obtener las llaves de Wompi

1. Ve a [https://comercios.wompi.co/](https://comercios.wompi.co/)
2. Crea una cuenta o inicia sesión
3. En el dashboard, busca tus llaves API:
   - **Clave pública de prueba**: `pub_test_xxxxxxxxxxxxxxxxxx`
   - **Clave pública de producción**: `pub_prod_xxxxxxxxxxxxxxxxxx`
   - **🔐 Clave de integridad de prueba**: `test_integrity_xxxxxxxxxxxxxxxxxx`
   - **🔐 Clave de integridad de producción**: `prod_integrity_xxxxxxxxxxxxxxxxxx`

> ⚠️ **IMPORTANTE**: La clave de integridad es **OBLIGATORIA** para procesar pagos. Sin ella, Wompi rechazará las transacciones.

### 2. Configurar las llaves en el proyecto

Abre los archivos de configuración y reemplaza las llaves:

#### Para desarrollo (pruebas):
**Archivo**: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  wompi: {
    publicKey: 'pub_test_TU_CLAVE_DE_PRUEBA_AQUI',
    integritySecret: 'test_integrity_TU_CLAVE_INTEGRIDAD_AQUI', // 🔐 OBLIGATORIO
    currency: 'COP',
    redirectUrl: 'http://localhost:4200'
  }
};
```

> ⚠️ **ADVERTENCIA DE SEGURIDAD**: En producción, la clave de integridad NUNCA debe estar en el frontend. Esta implementación es **SOLO PARA PRUEBAS**. En producción, la firma debe generarse en tu backend.

#### Para producción:
**Archivo**: `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  wompi: {
    publicKey: 'pub_prod_TU_CLAVE_DE_PRODUCCION_AQUI',
    integritySecret: 'MOVER_A_BACKEND', // ⚠️ NO exponer en producción
    currency: 'COP',
    redirectUrl: 'https://tudominio.com'
  }
};
```

### 3. Probar la integración

1. Ejecuta el servidor de desarrollo:
   ```bash
   ng serve
   ```

2. Abre el navegador en `http://localhost:4200`

3. Haz clic en el botón **"EXPLORAR COLECCIÓN"** en la sección hero

4. Se abrirá el widget de Wompi donde podrás probar el pago

### 4. Tarjetas de prueba

Wompi proporciona tarjetas de prueba para simular pagos:

#### ✅ Transacción APROBADA
- **Número**: `4242 4242 4242 4242`
- **CVV**: Cualquier 3 dígitos
- **Fecha**: Cualquier fecha futura
- **Cuotas**: 1

#### ❌ Transacción RECHAZADA
- **Número**: `4111 1111 1111 1111`
- **CVV**: Cualquier 3 dígitos
- **Fecha**: Cualquier fecha futura

#### ⏳ Transacción PENDIENTE
- **Número**: `5555 5555 5555 4444`
- **CVV**: Cualquier 3 dígitos
- **Fecha**: Cualquier fecha futura

### 5. Personalizar la configuración del pago

Puedes modificar la configuración del pago en:
`src/app/home/home-page.component.ts`

```typescript
openWompiCheckout(): void {
  const checkoutConfig = {
    amountInCents: 15000000, // Monto en centavos ($150,000 COP)
    reference: `KALAD-ORIGEN-${Date.now()}`,
    customerData: {
      email: 'cliente@ejemplo.com',
      fullName: 'Cliente Ejemplo',
      phoneNumber: '3001234567',
      phoneNumberPrefix: '+57'
    }
  };

  this.wompiService.openCheckout(checkoutConfig);
}
```

### 6. Firma de Integridad (Integrity Signature)

La firma de integridad es un hash HMAC SHA-256 que se genera con:
- Reference (referencia de la transacción)
- Amount in cents (monto en centavos)
- Currency (moneda)
- Integrity Secret (clave secreta)

**Ejemplo de generación:**
```
Mensaje: KALAD-123450000COP
Hash HMAC SHA-256 con clave secreta
Resultado: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d...
```

El servicio genera automáticamente esta firma usando la Web Crypto API del navegador.

### 7. Archivos creados

La integración incluye:

- ✅ `src/environments/environment.ts` - Configuración de desarrollo (incluye publicKey e integritySecret)
- ✅ `src/environments/environment.prod.ts` - Configuración de producción
- ✅ `src/app/services/wompi.service.ts` - Servicio con generación automática de firma de integridad
- ✅ `src/app/home/home-page.component.ts` - Lógica del componente actualizada
- ✅ `src/app/home/home-page.component.html` - Botón conectado al servicio

### 8. Eventos de pago

El servicio maneja automáticamente 3 estados:

1. **APPROVED** ✅ - Pago aprobado exitosamente
2. **DECLINED** ❌ - Pago rechazado
3. **ERROR** ⚠️ - Error en el proceso

Puedes personalizar estas acciones en:
`src/app/services/wompi.service.ts` → métodos `handleApprovedPayment()`, `handleDeclinedPayment()`, `handleErrorPayment()`

### 9. Consola del navegador

Cuando hagas clic en el botón, la consola mostrará:
```
Wompi script loaded successfully
✅ Firma de integridad generada: 7a8b9c0d1e2f...
📝 Configuración del checkout: {
  reference: 'KALAD-ORIGEN-1234567890',
  amount: 15000000,
  currency: 'COP',
  signature: '7a8b9c0d1e2f...'
}
```

### 10. Próximos pasos

- [ ] Configurar las llaves reales de Wompi (publicKey + integritySecret)
- [ ] **🔴 IMPORTANTE**: Mover la generación de firma al backend para producción
- [ ] Conectar con tu backend para guardar transacciones
- [ ] Implementar envío de emails de confirmación
- [ ] Crear página de confirmación de pedido
- [ ] Agregar validación de inventario antes del pago

### 📚 Documentación oficial

- [Wompi Docs](https://docs.wompi.co/)
- [Widget Checkout](https://docs.wompi.co/docs/en/widgets)
- [API Reference](https://docs.wompi.co/docs/en/api)

---

**¡Listo!** Tu integración con Wompi está configurada. Solo necesitas agregar tus llaves y empezar a probar.
