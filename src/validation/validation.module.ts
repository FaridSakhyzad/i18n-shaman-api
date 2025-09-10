import { Module } from '@nestjs/common';
import { ValidationService } from './validation.servise';

@Module({
  imports: [],
  controllers: [],
  providers: [ValidationService],
})
export class ValidationModule {}
