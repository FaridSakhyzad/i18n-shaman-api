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

  async sendHelloWorld(to: string) {
    const html = await this.tpl.render(
      {
        templateName: 'welcome',
      },
      {
        productName: 'i18 Shaman',
        logoUrl: 'https://your.cdn/logo.png',
        companyAddress: 'Calgary, AB',
        unsubscribeUrl: 'https://app.example.com/unsub',
        preferencesUrl: 'https://app.example.com/preferences',
        ctaUrl: 'https://app.example.com/cta',
      },
    );

    const mailOptions = {
      from: `"i18 Shaman" <no-reply@i18shaman.io>`,
      to,
      subject: 'Добро пожаловать 👋',
      html,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (err) {
      throw err;
    }
  }
}
