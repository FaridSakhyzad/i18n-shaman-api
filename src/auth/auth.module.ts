import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { MailService } from '../email/mail.service';
import { EmailTemplateService } from '../email/template.service';
import { ValidationService } from '../validation/validation.servise';
import { DatabaseModule } from '../dbModule/database.module';
import { Providers } from '../dbModule/providers';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, MailService, EmailTemplateService, ValidationService, ...Providers],
})
export class AuthModule {}
