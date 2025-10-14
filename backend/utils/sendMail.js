const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMail(to, subject, text, html) {
  try {
    const msg = {
      to,
      from: '"Bystalin Drive" <bystalindrive80@gmail.com>',
      subject,
      text,
      html,
    };
    await sgMail.send(msg);
    console.log('Email envoyé ✅');
  } catch (err) {
    console.error('Erreur envoi mail :', err.response?.body || err);
  }
}

module.exports = sendMail;