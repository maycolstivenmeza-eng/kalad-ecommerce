export const environment = {
  production: true,
  useStorageUploadProxy: false,

  // Configuracion de Firebase para produccion
  firebase: {
    apiKey: "AIzaSyDY4hRh6LriMeNn6QI3pdeHdZXPzGnU2ug",
    authDomain: "kalad3-8a000.firebaseapp.com",
    projectId: "kalad3-8a000",
    storageBucket: "kalad3-8a000.firebasestorage.app",
    messagingSenderId: "776478537902",
    appId: "1:776478537902:web:83f2fd94f1ad18ec48d53f",
    measurementId: "G-34LYXS0EGQ"
  },

  // Analiticas
  analytics: {
    measurementId: "G-34LYXS0EGQ",
    gtmId: "GTM-PVRCQD6M",
    loadGa4Script: true
  },

  // Configuracion de Wompi para produccion
  wompi: {
    publicKey: 'TU_CLAVE_PUBLICA_PRODUCCION_AQUI',
    integritySecret: 'TU_CLAVE_INTEGRIDAD_PRODUCCION_AQUI',
    currency: 'COP',
    redirectUrl: 'https://tudominio.com',
    apiBase: 'https://production.wompi.co',
    feePercent: 0,
    feeFixed: 0
  }
};
