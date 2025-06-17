import app from './app.js';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';

// Use built-in fetch if available, otherwise require node-fetch
const fetch = global.fetch || require('node-fetch');

dotenv.config();

const PORT = process.env.PORT || 4000;

// Configure CORS and body parser
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(bodyParser.json());

// Gemini AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ reply: 'No message provided.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: userMessage }] }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini AI.";
    res.json({ reply });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ reply: 'Error communicating with Gemini API.' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server startup errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});