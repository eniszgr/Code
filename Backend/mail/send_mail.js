require("dotenv").config({
  path: __dirname + "/../.env"
});

const nodemailer = require("nodemailer");
console.log("mail gönderme")


async function sendMail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: "zgr.enis@gmail.com",
    subject: "Test Maili",
    html: `<div style="background:#94B4C1; padding:20px;">

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
              <b>Kimden:</b> musteri01@gmail.com <br/>
              <b>Tahmin Edilen Departman:</b> Lojistik <br/>
              <b>Konu:</b> Kargo <br/>
              <b>Özet Mail:</b> Kargom kırık geldi. <br/>

              <b>Orijinal Mail:</b><br/>
              Ne biçim bir firmasınız, kargom kırık geldi.<br/>
              12 gün kargo bekledim ve elime geçen kargo paramparça olmuş.<br/>
              Bunu geri alın ya da sizi tüketici mahkemesine vereceğim.<br/>
              
              <b>Duygu Durumu:</b> Şikayetçi
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>


  `

    // html: "<b>HTML içerik</b>"
  };

  await transporter.sendMail(mailOptions);
  console.log("Mail gönderildi");
}

sendMail();
