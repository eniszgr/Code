const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "text alanı gerekli" });
  }

  // Şimdilik basit bir sahte sınıflandırma yapıyoruz
  const lower = text.toLowerCase();
  let label = "Genel";

  if (lower.includes("sipariş")) label = "Müşteri Hizmetleri";
  if (lower.includes("hata")) label = "Teknik Destek";

  res.json({
    input_text: text,
    label,
    score: 0.5,
    note: "Bu yanıt placeholder’dır. Python model bağlanınca gerçek sonuç dönecek."
  });
});

module.exports = router;

