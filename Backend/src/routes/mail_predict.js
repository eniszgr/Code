const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');


// google auth
const credentials = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../mail/credentials.json"))
);

const token = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../mail/token.json"))
);

const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

oAuth2Client.setCredentials(token);

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

function decodeBase64(data) {
  if (!data) return "";
  data = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(data, 'base64').toString('utf8');
}

//son maili okuma
async function readLatestMail() {
  try {
    const list = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1
    });

    if (!list.data.messages || list.data.messages.length === 0) {
      throw new Error("Inbox boş veya erişilemiyor.");
    }

    const id = list.data.messages[0].id;

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full'
    });

    const payload = msg.data.payload;
    const headers = payload.headers;

    const from = headers.find(h => h.name === "From")?.value || "Gönderen bulunamadı";
    const subject = headers.find(h => h.name === "Subject")?.value || "Başlık bulunamadı";

    let body = "";

    if (payload.parts) {
      const plain = payload.parts.find(p => p.mimeType === "text/plain");
      const html = payload.parts.find(p => p.mimeType === "text/html");

      body = decodeBase64(
        plain?.body?.data ||
        html?.body?.data ||
        ""
      );
    } else {
      body = decodeBase64(payload.body.data);
    }

    return { from, subject, body };

  } catch (err) {
    console.error("Mail okuma hatası:", err);
    throw new Error("Mail okunamadı");
  }
}


router.get('/', async (req, res) => {
  try {
    // 1) Gmail’den mail oku
    const lastMail = await readLatestMail();

    // 2) Python servisine gönder
    const response = await axios.post(
      process.env.PYTHON_SERVICE_URL + "/siniflandirma/",
      { text: lastMail.body }
    );

    // 3) Sonucu dön
    return res.json({
      mail_bilgileri: {
        gonderen: lastMail.from,
        konu: lastMail.subject,
        icerik: lastMail.body
      },
      siniflandirma: {
        kullanici_girdisi: response.data.original_text,
        duzeltilmis_metin: response.data.fixed_text,
        tahmin_departmani: response.data.department,
        duygu_durumu: response.data.duygu,
        tahmin_olasiligi: response.data.score
      }
    });

  } catch (err) {
    console.error("HTTP Hatası:", err.message);
    return res.status(500).json({
      error: "Mail okunamadı veya Python servisine ulaşılamadı"
    });
  }
});

module.exports = router;
