export const environment = {
  production: true,
  wompi: {
    // Reemplaza con tu clave pública de producción de Wompi
    publicKey: 'TU_CLAVE_PUBLICA_PRODUCCION_AQUI', // pub_prod_xxxxxxxxx
    // ⚠️ NUNCA expongas el integrity secret en producción
    // Esto debe manejarse en el backend
    integritySecret: 'TU_CLAVE_INTEGRIDAD_PRODUCCION_AQUI',
    currency: 'COP',
    redirectUrl: 'https://tudominio.com'
  }
};
