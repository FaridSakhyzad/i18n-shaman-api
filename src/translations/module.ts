import { Module } from '@nestjs/common';
import { TransController } from './controller';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Service } from './service';
import { Providers } from '../dbModule/providers';
import { DatabaseModule } from '../dbModule/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TransController, SearchController],
  providers: [Service, SearchService, ...Providers],
})
export class TranslationsModule {}
