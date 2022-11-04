const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports = async ({ from, to, subject, text, html }) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTPHOST,
    port: process.env.SMTPPORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTPMAIL, // generated ethereal user
      pass: process.env.SMTPPASS, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `inShare <${from}>`, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html, // html body
  });
};
