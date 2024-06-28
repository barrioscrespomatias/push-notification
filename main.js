import express from 'express';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import bodyParser from 'body-parser';
import cors from 'cors';

// Initialize Express
const app = express();
const port = process.env.PORT || 4000;

// Ruta al archivo de credenciales
const serviceAccount = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));

// Inicializar Firebase Admin si no está ya inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const corsOptions = {
  origin: 'http://localhost:8100', // Cambia a la URL de tu aplicación Angular
  optionsSuccessStatus: 200 // para compatibilidad con algunos navegadores antiguos
};

// Obtener la instancia de Firestore
const db = getFirestore(getApp());

// app.use(cors(corsOptions)); // Habilita CORS para todas las rutas
// Middleware para parsear JSON
app.use(bodyParser.json());

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Body:`, req.body);
  next();
});

// Endpoint to send a notification
app.get('/send-notification', (req, res) => {
  const { token, title, body } = req.query;

  if (!token) {
    return res.status(400).send('Token is required');
  }

  const message = {
    notification: {
      title: title || 'Default Title',
      body: body || 'Default Body',
    },
    token: token,
  };

  getMessaging()
    .send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
      res.status(200).send('Notification sent successfully');
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      res.status(500).send('Error sending notification');
    });
});

app.post("/send-notification-rol", async (req, res) => {
  const { title, body, rol } = req.body;

  if (!rol) {
    return res.status(400).json({ error: 'Rol is required' });
  }

  try {
    const usuariosTokens = [];
    const querySnapshot = await db
      .collection("usuarios")
      .where("rol", "==", rol)
      .get();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) {
        usuariosTokens.push(data.token);
      }
    });

    if (usuariosTokens.length === 0) {
      return res.status(404).json({ error: "No hay usuarios a los que enviar un mensaje" });
    }

    const message = {
      notification: {
        title: title || 'Default Title',
        body: body || 'Default Body',
      },
      tokens: usuariosTokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    res.status(200).json({ message: `Mensajes enviados: ${response.successCount}` });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: `Error al enviar mensaje: ${error.message}` });
  }
});

app.get('/', (req, res) => {
  res.send('Push Notification API - Sabor Digital');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});