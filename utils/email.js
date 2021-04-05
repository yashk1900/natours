const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
//new Email(user,url).sendWelcome()

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Yash Kothekar <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //SENDGRID
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
      //YET TO IMPLEMENT
    }

    return nodemailer.createTransport({
      //if you want to use gmail
      // service: 'Gmail',
      // auth: {
      //   user: process.env.EMAIL_USERNAME,
      //   pass: process.env.EMAIL_PASSWORD,
      // },
      //activate in gmail "less secure app" option

      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //send actual email

    //1)RENDER HTML BASED ON PUG TEMPLATE

    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2)DEFINE EMAIL OPTIONS
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };
    //3)CREATE TRANSPORT AND SEND MAIL
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(valid for 10 minutes)'
    );
  }
};
