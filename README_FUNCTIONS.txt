Pasos para desplegar el webhook Wompi:

1) En functions/: npm install

2) Asegura archivo functions/.env con las llaves que uses para pruebas locales:
   WOMPI_INTEGRITY=test_integrity_g7dwHkOG1WJf78VADux02AjruMvsu4vG
   WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxx

   (_usa tus claves de producción/QA al desplegar. El archivo `.env` sólo se usa para el emulador o tests locales_).

   Si no defines `WOMPI_PUBLIC_KEY`, el backend usará `pub_prod_iR7U8YBjqm46AjHLCcqZCiHZthHiPZue` como valor por defecto, pero es preferible que pongas tu clave específica aquí o vía `firebase functions:config:set`.

3) Antes del despliegue, configura las claves con Firebase:
   firebase functions:config:set wompi.publickey="pub_prod_xxx" wompi.integrity="prod_integrity_xxx"

4) Desde la raíz del proyecto: firebase deploy --only functions
   (ya está el proyecto kalad3-8a000 seleccionado)

Webhook URL resultante:
https://us-central1-kalad3-8a000.cloudfunctions.net/wompiWebhook

En Wompi sandbox, pega esa URL en Seguimiento de transacciones (URL de eventos) y guarda.
