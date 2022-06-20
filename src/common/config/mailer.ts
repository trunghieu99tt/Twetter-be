import * as nodemailer from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');
import SMTPTransport = require('nodemailer/lib/smtp-transport');
import { Logger } from '@nestjs/common';
import { MAILER_EMAIL_ID, MAILER_PASSWORD } from './env';

class Mailer {
  private readonly logger = new Logger('Mailer');
  private readonly transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: MAILER_EMAIL_ID,
      pass: MAILER_PASSWORD,
    },
  });

  sendMail(
    receiver: string,
    subject: string,
    text: string,
    senderName = 'Tweeter Support',
  ): void {
    const mailOptions: Mail.Options = {
      from: `"${senderName}" ${MAILER_EMAIL_ID}`,
      to: receiver,
      subject,
      html: text,
    };
    this.transporter.sendMail(
      mailOptions,
      (err: Error, info: SMTPTransport.SentMessageInfo) => {
        if (err) {
          console.error(err);
        } else {
          this.logger.verbose(`Message sent: ${info.messageId}`);
          this.logger.verbose(
            `Preview URL: ${nodemailer.getTestMessageUrl(info)}`,
          );
        }
      },
    );
  }

  async sendMails(
    receivers: string[],
    subject: string,
    text: string,
  ): Promise<void> {
    const mailOptions: Mail.Options = {
      from: MAILER_EMAIL_ID,
      bcc: receivers,
      subject,
      html: text,
    };
    const info = (await this.transporter.sendMail(
      mailOptions,
    )) as SMTPTransport.SentMessageInfo;
    this.logger.verbose(`Message sent: ${info.messageId}`);
    this.logger.verbose(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

export const SMTPMailer = new Mailer();
