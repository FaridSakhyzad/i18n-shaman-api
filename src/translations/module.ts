import { Module } from '@nestjs/common';
import { CatsController } from './controller';
import { Service } from './service';
import { Providers } from '../dbModule/providers';
import { DatabaseModule } from '../dbModule/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [Service, ...Providers],
})
export class TranslationsModule {}
