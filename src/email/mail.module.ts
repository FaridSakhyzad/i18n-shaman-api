import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailTemplateService } from './template.service';
import { MailController } from './mail.controller';

@Module({
  providers: [MailService, EmailTemplateService],
  controllers: [MailController],
})
export class MailModule {}
