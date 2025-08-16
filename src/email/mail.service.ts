import { readFileSync } from 'fs';
import { join } from 'path';
import * as mjml2html from 'mjml';
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

  private async renderMjml(templateName: string, vars: Record<string, string>) {
    let src = readFileSync(join('./src/emailTemplates', `${templateName}.mjml`), 'utf8');

    // Простейшие плейсхолдеры {{var}}
    for (const [k, v] of Object.entries(vars)) {
      src = src.replaceAll(`{{${k}}}`, v ?? '');
    }

    const { html, errors } = mjml2html(src, { minify: true });

    if (errors?.length) {
      console.error(errors);
    }

    return html;
  }

  async sendHelloWorld(to: string) {
    const html = await this.tpl.render('welcome', {
      productName: 'i18 Shaman',
      logoUrl: 'https://your.cdn/logo.png',
      companyAddress: 'Calgary, AB',
      unsubscribeUrl: 'https://app.example.com/unsub',
      preferencesUrl: 'https://app.example.com/preferences',
      ctaUrl: 'https://app.example.com/cta',
    });

    const mailOptions = {
      from: `"i18 Shaman" <no-reply@i18shaman.io>`,
      to,
      subject: 'Добро пожаловать 👋',
      html,
    };

    console.log('mailOptions', mailOptions);

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (err) {
      throw err;
    }
  }
}
