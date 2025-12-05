const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

async function getToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('Bu URL’yi tarayıcıda aç ve izin ver:\n', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Google’ın verdiği kodu buraya yapıştırın: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code)
      .then(({ tokens }) => {
        fs.writeFileSync('token.json', JSON.stringify(tokens, null, 2));
        console.log('token.json oluşturuldu ✔️');
      })
      .catch(err => console.error('Hata:', err));
  });
}

getToken();
