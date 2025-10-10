import { EmailTemplateService } from './template.service';

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly tpl: EmailTemplateService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendResetPasswordEmail(to: string, resetToken: string) {
    const html = await this.tpl.render(
      {
        templateName: 'resetPassword',
      },
      {
        resetPasswordUrl: `${process.env.FRONTENT_URL}/reset-password/${resetToken}`,
      },
    );

    const mailOptions = {
      from: `"i18 Shaman" <no-reply@i18shaman.io>`,
      to,
      subject: 'Password Reset',
      html,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (err) {
      throw err;
    }
  }

  async sendEmailVerification(to: string, verificationLinkToken: string) {
    const html = await this.tpl.render(
      {
        templateName: 'verifyUserEmail',
      },
      {
        verificationUrl: `${process.env.FRONTENT_URL}/verify-email/${verificationLinkToken}`,
      },
    );

    const mailOptions = {
      from: `"i18 Shaman" <no-reply@i18shaman.io>`,
      to,
      subject: 'Account Activation',
      html,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (err) {
      throw err;
    }
  }
}
