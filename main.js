import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import * as fs from 'fs';

// Ruta al archivo de credenciales
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

// Token de registro de FCM
const token = "c7v6OzoGTL-DuS2ach_ZAh:APA91bH_bSIGUnpSFFl9anwnHEnfLirPARf5Z_ZTOZ6sIYAcN2fpAmqO9UzSXSY05RM9saoCPDQrCLMkd4t8SYoG5mhLxP89VdbXfiIe70wEgb9WOBxjtGThrVaUQVroZWBGANfsLfeD";

const message = {
  notification: {
    title: "Capacitor Firebase Messaging",
    body: "Hello world!",
  },
  token: token,
};

// Enviar el mensaje al dispositivo correspondiente al token de FCM proporcionado
getMessaging()
  .send(message)
  .then((response) => {
    console.log("Successfully sent message: ", response);
  })
  .catch((error) => {
    console.log("Error sending message: ", error);
  });