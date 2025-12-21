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
// load google credentials to use gmail api
const credentials = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../mail/credentials.json"))
);

// destructure necessary fields from credentials
const { client_secret, client_id, redirect_uris } = credentials.installed;

// access token to check user's permissions
const token = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../mail/token.json"))
);

// create oAuth2 client to authenticate requests
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// login google account with token
oAuth2Client.setCredentials(token);

// gmail api model
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

/* ---------------- HELPERS ---------------- */

// gmail api comes with base64 encoded data. We need to decode it to normal text.
function decodeBase64(data) {
  if (!data) return "";
  data = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(data, "base64").toString("utf8");
}

/* ---------------- READ LATEST VALID MAIL WITH GMAIL API---------------- */
 
async function readLatestMail() {
  const list = await gmail.users.messages.list({
    userId: "me", // user's own mailbox 
    maxResults: 10 // last 10 mails
  });
  
  //list varible have lots of mail properties. We only need messages
  if (!list.data.messages || list.data.messages.length === 0) {
    throw new Error("Empty Inbox");
  }

  for (const item of list.data.messages) { //item returns message id and thread id(thread for conversation chain id)
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: item.id,
      format: "full"
    });

    const payload = msg.data.payload;
    const headers = payload.headers; //name, email address, subject, date

    const from = headers.find(h => h.name === "From")?.value || "";

    const subject = headers.find(h => h.name === "Subject")?.value || "";

    // pass mail if it's from ourselves
    if (from.includes(process.env.MAIL_USER)) continue;

    // pass BOUNCE & SYSTEM MAILS
    const lowerFrom = from.toLowerCase();
    if (
      lowerFrom.includes("mailer-daemon") ||
      lowerFrom.includes("mail delivery subsystem")
    ) continue;

    // Other mails are valid
    let body = "";

    if (payload.parts) {
      const plain = payload.parts.find(p => p.mimeType === "text/plain"); // just text from mail
      const html = payload.parts.find(p => p.mimeType === "text/html"); // html version of mail

      body = decodeBase64(plain?.body?.data || html?.body?.data ||""); // boş değillerse decode edip body içine at
    } else {
      body = decodeBase64(payload.body?.data); // boşlarsa direkt body decode edilir.
    }

    return {
      from,
      subject,
      body: body.slice(0, 3000) // limited with 30 characters
    };
  }

  throw new Error("There is no valid mail to read");
}

/* ---------------- SEND MAIL WITH NODOMAILER ---------------- */
//definition of sendMail function
async function sendMail(to, subject, html) {
  // nodemailer transporter object
  const transporter = nodemailer.createTransport({
    //login gmail with app password
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD
    }
  });
  // send mail with parameters
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
    /* Read latest valid mail */
    const lastMail = await readLatestMail();

    /* Fix and classify with python service */
    const response = await axios.post(
      process.env.PYTHON_SERVICE_URL + "/siniflandirma/",
      { text: lastMail.body },
      {
        httpsAgent: new (require("https").Agent)({ //python service works on https but self-signed certificate NodeJS doesn't trust it by default
          rejectUnauthorized: false // don't reject self-signed certificates
        })
      }
    );
    //pull department from response
    const department = response.data.department;
    //department to mail dictionary
    const DEPARTMENT_MAIL_MAP = {
      "Lojistik": process.env.lojistik_mail,
      "Müşteri Hizmetleri": process.env.musteri_hizmetleri_mail,
      "Finans": process.env.finans_mail,
      "Teknik Destek": process.env.teknik_destek_mail
    };
    //find target mail from dictionary
    const targetEmail = DEPARTMENT_MAIL_MAP[department];
    if (!targetEmail) {
      return res.status(400).json({ error: "Empty Department Mail" });
    }

    /* usage send mail function */
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
    //chech result backend-side
    res.json({
      status: "OK",
      kimden: lastMail.from,
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
