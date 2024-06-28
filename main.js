import express from 'express';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import bodyParser from 'body-parser';
import fs from 'fs'; // Importar el módulo fs
import cors from 'cors';

// Initialize Express
const app = express();
const port = process.env.PORT || 4000;

const secretFilePath = '/etc/secrets/GOOGLE_APPLICATION_CREDENTIALS';

// Verificar que el archivo secreto existe
if (!fs.existsSync(secretFilePath)) {
  console.error(`File ${secretFilePath} does not exist.`);
  process.exit(1);
}

// Cargar las credenciales desde el archivo secreto
const serviceAccount = JSON.parse(fs.readFileSync(secretFilePath, 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// Configurar CORS
const corsOptions = {
  origin: ['capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://localhost:8080',
  'http://localhost:8100',], // Permitir localhost y cualquier otro origen
  optionsSuccessStatus: 200 ,// Para compatibilidad con algunos navegadores antiguos
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 1 day
};
app.use(cors(corsOptions)); // Habilita CORS para todas las rutas

// Obtener la instancia de Firestore
const db = getFirestore(getApp());

// app.use(cors(corsOptions)); // Habilita CORS para todas las rutas
// Middleware para parsear JSON
app.use(bodyParser.json());

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log('========================================');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  console.log('Origin:', req.headers.origin || 'No Origin');
  console.log('========================================');
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

app.get("/send-notification-rol", async (req, res) => {
  const { rol, title, body } = req.query;

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