Pasos para desplegar el webhook Wompi:

1) En functions/: npm install

2) Asegura archivo functions/.env con:
   WOMPI_INTEGRITY=test_integrity_g7dwHkOG1WJf78VADux02AjruMvsu4vG

3) Desde la raíz del proyecto: firebase deploy --only functions
   (ya está el proyecto kalad3-8a000 seleccionado)

Webhook URL resultante:
https://us-central1-kalad3-8a000.cloudfunctions.net/wompiWebhook

En Wompi sandbox, pega esa URL en Seguimiento de transacciones (URL de eventos) y guarda.
