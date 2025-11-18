export const environment = {
  production: false,
  useStorageUploadProxy: true,

  // Configuración de Firebase
  // ⚠️ IMPORTANTE: Obtén estos valores desde Firebase Console
  // https://console.firebase.google.com/ > Tu Proyecto > Configuración del Proyecto > General
  firebase: {
    apiKey: "AIzaSyDY4hRh6LriMeNn6QI3pdeHdZXPzGnU2ug",
    authDomain: "kalad3-8a000.firebaseapp.com",
    projectId: "kalad3-8a000",
    storageBucket: "kalad3-8a000.firebasestorage.app",
    messagingSenderId: "776478537902",
    appId: "1:776478537902:web:83f2fd94f1ad18ec48d53f",
    measurementId: "G-34LYXS0EGQ"
  },

  // Configuración de Wompi
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
