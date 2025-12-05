const { google } = require('googleapis');
const fs = require('fs');

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const token = JSON.parse(fs.readFileSync('token.json'));

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

async function readLatestMail() {
  try {
    const list = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1
    });

    const id = list.data.messages[0].id;

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full'
    });

    const payload = msg.data.payload;

    // ✔️ FROM (Gönderen)
    const headers = payload.headers;
    const fromHeader = headers.find(h => h.name === "From")?.value || "Gönderen bulunamadı";
    const subjectHeader = headers.find(h => h.name === "Subject")?.value || "Başlık bulunamadı";

    // ✔️ BODY (Mail içeriği)
    let body = "";

    if (payload.parts) {
      // text/plain varsa direkt al
      const plainPart = payload.parts.find(p => p.mimeType === "text/plain");
      const htmlPart = payload.parts.find(p => p.mimeType === "text/html");

      if (plainPart?.body?.data) {
        body = decodeBase64(plainPart.body.data);
      } else if (htmlPart?.body?.data) {
        body = decodeBase64(htmlPart.body.data);
      }
    } else {
      // fallback
      body = decodeBase64(payload.body.data);
    }

    console.log("\n---- SON MAIL ----");
    console.log("Kimden:", fromHeader);
    console.log("Konu:", subjectHeader);
    console.log("\nİçerik:\n");
    console.log(body);
    console.log("\n------------------\n");

  } catch (err) {
    console.error("Hata:", err);
  }
}

readLatestMail();
