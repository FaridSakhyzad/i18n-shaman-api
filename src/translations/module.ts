import { Module } from '@nestjs/common';
import { DatabaseModule } from '../dbModule/database.module';
import { TransController } from './controller';
import { SearchController } from './search.controller';
import { Service } from './service';
import { SearchService } from './search.service';
import { KeyHelperService } from './keyHelper.service';
import { Providers } from '../dbModule/providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TransController, SearchController],
  providers: [Service, SearchService, KeyHelperService, ...Providers],
})
export class TranslationsModule {}
