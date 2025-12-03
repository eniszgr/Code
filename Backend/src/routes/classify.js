const express = require('express');
const router = express.Router();
const axios = require('axios');

// pull from .env
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL;

// build the full predict URL
function buildPredictUrl() {
  if (!PYTHON_SERVICE_URL) return null;
  try {
    // convert String to URL object to validate
    const base = new URL(PYTHON_SERVICE_URL);
    // Add /predict path
    return new URL('/predict', base).toString();
  } catch (e) {
    return null;
  }
}

const PREDICT_URL = buildPredictUrl();

router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "text bodyden alınamadı" });
  }

  try {
    if (!PREDICT_URL) {
      console.error('Python servis URL yapılandırılmamış veya geçersiz:', process.env.PYTHON_SERVICES_URL || process.env.PYTHON_SERVICE_URL);
      return res.status(500).json({ error: 'Python servis URL yapılandırılmamış' });
    }

    // POST request to Python service
    const response = await axios.post(PREDICT_URL, { text });
    console.log('Python servisinden cevap alındı:', response.data);

    // Send response from Python directly to frontend
    res.json({
      input_text: text,
      label: response.data.Department,
      score: response.data.Predict_Score
    });

  } catch (error) {
    console.error("Python servise bağlanırken hata:", error.message);
    res.status(500).json({ error: "Python servise bağlanılamadı" });
  }
});

module.exports = router;
