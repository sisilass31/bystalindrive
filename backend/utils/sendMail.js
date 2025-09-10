const transporter = require("../config/mailer");

async function sendMail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"BystalinDrive" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log("Email envoyé :", info.messageId);
  } catch (err) {
    console.error("Erreur envoi mail :", err);
  }
}

module.exports = sendMail;