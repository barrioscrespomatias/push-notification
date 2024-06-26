import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';

// Initialize Express
const app = express();
const port = process.env.PORT || 4000;

// Ruta al archivo de credenciales
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
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

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
