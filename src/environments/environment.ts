export const environment = {
  production: false,
  useStorageUploadProxy: true,

  // Configuracion de Firebase
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

  // Configuracion de Wompi
  wompi: {
    publicKey: 'pub_test_BdzugKP1hhQ7K2oXBQcc5KNKXLfjtFc5',
    integritySecret: 'test_integrity_g7dwHkOG1WJf78VADux02AjruMvsu4vG',
    currency: 'COP',
    redirectUrl: 'http://localhost:4200',
    apiBase: 'https://sandbox.wompi.co',
    // Comision estimada (referencial, no se cobra al cliente)
    feePercent: 0.0349,
    feeFixed: 900
  }
};
