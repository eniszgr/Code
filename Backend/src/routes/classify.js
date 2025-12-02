// backend/routes/classify.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL; // Python servisi URL

router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "text alanı gerekli" });
  }

  try {
    // Python FastAPI servisine POST isteği
    const response = await axios.post(PYTHON_SERVICE_URL, { text });

    // Python'dan gelen cevabı direkt frontend'e gönder
    res.json({
      input_text: text,
      label: response.data.label,
      score: response.data.score
    });

  } catch (error) {
    console.error("Python servise bağlanırken hata:", error.message);
    res.status(500).json({ error: "Python servise bağlanılamadı" });
  }
});

module.exports = router;
