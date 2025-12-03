// backend/routes/classify.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Support both env names (some configs use PYTHON_SERVICES_URL)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICES_URL || process.env.PYTHON_SERVICE_URL;

// Helper: build full predict endpoint safely
function buildPredictUrl() {
  if (!PYTHON_SERVICE_URL) return null;
  try {
    // use the WHATWG URL API to join paths correctly
    const base = new URL(PYTHON_SERVICE_URL);
    // ensure trailing slash handling
    return new URL('/predict', base).toString();
  } catch (e) {
    return null;
  }
}

const PREDICT_URL = buildPredictUrl();

router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "text alanı gerekli" });
  }

  try {
    if (!PREDICT_URL) {
      console.error('Python servis URL yapılandırılmamış veya geçersiz:', process.env.PYTHON_SERVICES_URL || process.env.PYTHON_SERVICE_URL);
      return res.status(500).json({ error: 'Python servis URL yapılandırılmamış' });
    }

    // Python FastAPI servisine POST isteği
    const response = await axios.post(PREDICT_URL, { text });

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
