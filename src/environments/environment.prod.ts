export const environment = {
  production: true,

  // Configuración de Firebase para producción
  // ⚠️ IMPORTANTE: Reemplaza estos valores con los de tu proyecto de producción
  firebase: {
    apiKey: "AIzaSyDY4hRh6LriMeNn6QI3pdeHdZXPzGnU2ug",
    authDomain: "kalad3-8a000.firebaseapp.com",
    projectId: "kalad3-8a000",
    storageBucket: "kalad3-8a000.appspot.com",
    messagingSenderId: "776478537902",
    appId: "1:776478537902:web:83f2fd94f1ad18ec48d53f",
    measurementId: "G-34LYXS0EGQ"
  },

  // Configuración de Wompi para producción
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
