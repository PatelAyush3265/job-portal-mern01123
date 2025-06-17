import dotenv from 'dotenv';
dotenv.config();

// Use built-in fetch if available, otherwise require node-fetch
const fetch = global.fetch || require('node-fetch');

export const chatWithGemini = async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ reply: 'No message provided.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
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
}; 