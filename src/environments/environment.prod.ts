export const environment = {
  production: true,
  useStorageUploadProxy: false,

  // Configuracion de Firebase para produccion
  firebase: {
    apiKey: "AIzaSyDY4hRh6LriMeNn6QI3pdeHdZXPzGnU2ug",
    authDomain: "kalad.com.co",
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
    publicKey: 'pub_prod_iR7U8YBjqm46AjHLCcqZCiHZthHiPZue',
    currency: 'COP',
    redirectUrl: 'https://kalad.com.co',
    apiBase: 'https://production.wompi.co',
    functionsBase: 'https://us-central1-kalad3-8a000.cloudfunctions.net',
    // Comision estimada (referencial, no se cobra al cliente)
    feePercent: 0.0349,
    feeFixed: 900
  }
};
