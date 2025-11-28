/* Utilidad local para marcar un usuario como admin en Firebase Auth.
 *
 * Uso:
 * 1. En Firebase Console -> Configuración del proyecto -> Cuentas de servicio,
 *    genera una clave privada y guárdala como serviceAccount.json (NO la subas a git).
 * 2. En tu terminal, exporta la ruta:
 *      Linux/macOS:  export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
 *      Windows PS:  $env:GOOGLE_APPLICATION_CREDENTIALS=\"C:\\ruta\\serviceAccount.json\"
 * 3. Ejecuta:
 *      npm run set-admin -- tu-correo-admin@ejemplo.com
 *
 * Esto añadirá customClaims { admin: true } a ese usuario.
 */

const admin = require("firebase-admin");

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Uso: node scripts/set-admin-claim.js <email-admin>");
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      "Falta GOOGLE_APPLICATION_CREDENTIALS.\n" +
        "Apunta esta variable a tu serviceAccount.json antes de ejecutar el script."
    );
    process.exit(1);
  }

  admin.initializeApp();

  try {
    const user = await admin.auth().getUserByEmail(email);
    const currentClaims = user.customClaims || {};

    await admin
      .auth()
      .setCustomUserClaims(user.uid, { ...currentClaims, admin: true });

    console.log(
      `Marcado como admin: ${email} (uid=${user.uid}). Claims actuales:`,
      { ...currentClaims, admin: true }
    );
  } catch (err) {
    console.error("No se pudo asignar el claim admin:", err);
    process.exit(1);
  }
}

main();

