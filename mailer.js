const nodemailer = require("nodemailer");
const env = require('env2')('./.env');

const { EMAIL_SERVICE, EMAIL_USER, EMAIL_PW } = process.env;

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PW
  }
});

// create reusable transporter object using ethereal,
// which catches emails before they go to the real host. View them at the website.
const testEmails = async ()=> {
  let fakeTransporter;
  await nodemailer.createTestAccount()
    .then( account=>{
      console.log('Save the account deets: ', account);
      try {
        sendMail();
      } catch(e) {
        console.log(e);
      }
      fakeTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user, // generated ethereal user
          pass: account.pass, // generated ethereal password
        },
      });

  });
  return fakeTransporter
}

const sendMail = async mailObject=> {
  console.log(mailObject);
  const toSend = {
    ...{
      from: '"Fly Fairly" <flyfairly.mailer+donotreply@gmail.com>', // sender address
      to: "flyfairly@mailnesia.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    }, ...mailObject
  };
  console.log(toSend);

  const info = await transporter.sendMail(toSend);
  console.log("Message sent: %s", info.messageId);
  return info
}

module.exports = sendMail;
