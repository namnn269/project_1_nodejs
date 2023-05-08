// @ts-nocheck
const nodeMailer = require('nodemailer');

module.exports = async (mailOptions) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD },
  });

  const options = {
    from: 'from22@example.com',
    to: mailOptions.to,
    subject: mailOptions.subject,
    text: mailOptions.text,
    html: mailOptions.html,
  };

  await transporter.sendMail(options);
};
