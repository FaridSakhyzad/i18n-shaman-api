import { Controller, Get } from '@nestjs/common';
import { Service } from './service';
import { IProject } from './interfaces/project.interface';

@Controller()
export class CatsController {
  constructor(private readonly Service: Service) {}

  @Get('findAll')
  findAll(): Promise<IProject[]> {
    return this.Service.findAll();
  }

  @Get('getProjects')
  getProjects(): object {
    return {
      project: 'Hello cats world!',
    };
  }
}
