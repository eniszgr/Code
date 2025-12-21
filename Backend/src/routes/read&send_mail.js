require("dotenv").config({
  path: __dirname + "/../.env"
});

const express = require("express");
const router = express.Router();
const axios = require("axios");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

/* ---------------- GOOGLE AUTH ---------------- */

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

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

/* ---------------- HELPERS ---------------- */

function decodeBase64(data) {
  if (!data) return "";
  data = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(data, "base64").toString("utf8");
}

/* ---------------- READ LATEST VALID MAIL ---------------- */

async function readLatestMail() {
  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10 // tek mail değil, filtreleyeceğiz
  });

  if (!list.data.messages || list.data.messages.length === 0) {
    throw new Error("Inbox boş");
  }

  for (const item of list.data.messages) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: item.id,
      format: "full"
    });

    const payload = msg.data.payload;
    const headers = payload.headers;

    const from =
      headers.find(h => h.name === "From")?.value || "";

    const subject =
      headers.find(h => h.name === "Subject")?.value || "";

    /* ❌ KENDİ GÖNDERDİĞİN MAİL */
    if (from.includes(process.env.MAIL_USER)) continue;

    /* ❌ BOUNCE / SYSTEM MAİLLERİ */
    const lowerFrom = from.toLowerCase();
    if (
      lowerFrom.includes("mailer-daemon") ||
      lowerFrom.includes("mail delivery subsystem")
    ) continue;

    /* ✅ GERÇEK MAİL BULUNDU */
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
      body = decodeBase64(payload.body?.data);
    }

    return {
      from,
      subject,
      body: body.slice(0, 3000) // şişmeyi önle
    };
  }

  throw new Error("Uygun yeni mail yok");
}

/* ---------------- SEND MAIL ---------------- */

async function sendMail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html
  });
}

/* ---------------- ROUTE ---------------- */

router.get("/", async (req, res) => {
  try {
    /* 1️⃣ MAIL OKU */
    const lastMail = await readLatestMail();

    /* 2️⃣ PYTHON API */
    const response = await axios.post(
      process.env.PYTHON_SERVICE_URL + "/siniflandirma/",
      { text: lastMail.body },
      {
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false // self-signed fix
        })
      }
    );

    console.log("----------------------------");
    console.log("Python API response:", response.data);
    console.log("Gelen mail:", lastMail);
    console.log("----------------------------");

    const department = response.data.department;

    const DEPARTMENT_MAIL_MAP = {
      "Lojistik": process.env.lojistik_mail,
      "Müşteri Hizmetleri": process.env.musteri_hizmetleri_mail,
      "Finans": process.env.finans_mail,
      "Teknik Destek": process.env.teknik_destek_mail
    };

    const targetEmail = DEPARTMENT_MAIL_MAP[department];
    if (!targetEmail) {
      return res.status(400).json({ error: "Departman maili yok" });
    }

    /* 3️⃣ MAIL GÖNDER */
    await sendMail(
      targetEmail,
      lastMail.subject,
      `
      <div style="background:#94B4C1; padding:20px;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#547792; border-radius:12px;">
          <tr>
            <td align="center" style="background:#213448;color:#FFFCFB;padding:24px;font-size:26px;font-weight:600;letter-spacing:1px;font-family: 'Trebuchet MS', Arial, sans-serif; border-radius:12px 12px 0 0;">
              AKILLI MAIL SİSTEMİ
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:24px;color:#F5F5F5; line-height:24px;font-size:15px;font-family:'Times New Roman', Times, serif;">
              <b>Kimden:</b> ${lastMail.from} <br/>
              <b>Tahmin Edilen Departman:</b> ${department} <br/>
              <b>Konu:</b> ${lastMail.subject} <br/>
              <b>Düzeltilmiş/Özet Mail:</b> ${response.data.fixed_text} <br/>

              <b>Orijinal Mail:</b>${lastMail.body}<br/>
              
              <b>Duygu Durumu:</b> ${response.data.duygu}<br/>
              <b>Olasılık:</b> ${response.data.score.toFixed(2)}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>
      `
    );

    res.json({
      status: "OK",
      okunan_mail: lastMail.from,
      departman: department,
      gonderilen_adres: targetEmail,
      mail: lastMail,
      pyton_response: response.data

    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
