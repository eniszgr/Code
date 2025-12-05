const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "text alanı gerekli" });
  }

  try {
    // Request to Python FastAPI service
    const response = await axios.post(
      process.env.PYTHON_SERVICES_URL +"/siniflandirma/",
      { text }
    );

    res.json({
      input_text: text,
      label: response.data.label,
      score: response.data.score
    });

  } catch (error) {
    console.error("Python servis hatası:", error.message);
    res.status(500).json({ error: "Python servise bağlanılamadı" });
  }
});

module.exports = router;
