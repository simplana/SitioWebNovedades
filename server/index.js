import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Usar un puerto diferente al de Vite

// Middleware
app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use(express.json()); // Para parsear cuerpos de solicitud JSON

// Rutas de proxy para Loyverse OAuth
app.post('/api/loyverse/exchange-token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    const body = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect_uri || process.env.VITE_LOYVERSE_REDIRECT_URL,
      client_id: process.env.VITE_LOYVERSE_CLIENT_ID,
      client_secret: process.env.VITE_LOYVERSE_CLIENT_SECRET
    };

    console.log('🔄 Server proxy: Exchanging code for tokens with Loyverse...');
    console.log('📋 Request body to Loyverse:', {
      ...body,
      client_secret: body.client_secret ? '[PRESENT]' : '[MISSING]'
    });

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text();
      console.error('❌ Server proxy: Loyverse token exchange failed:', errorText);
      return res.status(loyverseResponse.status).json({ error: errorText });
    }

    const data = await loyverseResponse.json();
    console.log('✅ Server proxy: Loyverse token exchange successful');
    res.json(data);
  } catch (error) {
    console.error('❌ Server proxy: Error in /api/loyverse/exchange-token:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loyverse/refresh-token', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    const body = {
      grant_type: "refresh_token",
      refresh_token,
      client_id: process.env.VITE_LOYVERSE_CLIENT_ID,
      client_secret: process.env.VITE_LOYVERSE_CLIENT_SECRET
    };

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    });

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text();
      return res.status(loyverseResponse.status).json({ error: errorText });
    }

    const data = await loyverseResponse.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Server proxy: Error in /api/loyverse/refresh-token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API proxy is working!' });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Loyverse OAuth proxy server running on port ${port}`);
});