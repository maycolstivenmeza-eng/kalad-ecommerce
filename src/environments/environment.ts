export const environment = {
  production: false,
  wompi: {
    // Reemplaza con tu clave pública de prueba de Wompi
    // Obtén tu clave en: https://comercios.wompi.co/
    publicKey: 'pub_test_BdzugKP1hhQ7K2oXBQcc5KNKXLfjtFc5',
    // ⚠️ IMPORTANTE: La clave de integridad (integrity secret) debe estar en el BACKEND
    // Solo para pruebas locales, reemplaza con tu integrity secret de Wompi
    // Formato: prod_integrity_xxxxxxxxxxxxxxxx o test_integrity_xxxxxxxxxxxxxxxx
    integritySecret: 'test_integrity_g7dwHkOG1WJf78VADux02AjruMvsu4vG',
    currency: 'COP',
    redirectUrl: 'http://localhost:4200' // URL de confirmación después del pago
  }
};
