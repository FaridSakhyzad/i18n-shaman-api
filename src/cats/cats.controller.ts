import { Controller, Get, Post } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Controller('cats')
export class CatsController {
  constructor(private readonly CatsService: CatsService) {}

  @Get('findAll')
  findAll(): Promise<Cat[]> {
    return this.CatsService.findAll();
  }

  @Post('create')
  create(createCatDto: CreateCatDto): Promise<Cat> {
    console.log('CREATE CAT OLOLO');

    return this.CatsService.create(createCatDto);
  }

  @Get('catsHello')
  catsHello(): string {
    return 'Hello cats world!';
  }
}
