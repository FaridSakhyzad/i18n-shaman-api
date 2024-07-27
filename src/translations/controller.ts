import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Service } from './service';
import { IProject } from './interfaces/project.interface';
import { IKey } from './interfaces/key.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { AddKeyDto } from './dto/add-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';

const USER_ID = '1234567890abcdef';

@Controller()
export class CatsController {
  constructor(private readonly Service: Service) {}

  @Post('createProject')
  createProject(@Body() createProjectDto: CreateProjectDto): Promise<IProject> {
    const USER_ID = '1234567890abcdef';

    return this.Service.createProject({
      userId: USER_ID,
      ...createProjectDto,
    });
  }

  @Get('getUserProjects')
  getUserProjects(): Promise<IProject[]> {
    return this.Service.getUserProjects({
      userId: USER_ID,
    });
  }

  @Get('getUserProjectById')
  getUserProjectById(@Query('projectId') projectId: string): Promise<IProject> {
    return this.Service.getUserProjectById({
      userId: USER_ID,
      projectId,
    });
  }

  @Post('addProjectLanguage')
  addProjectLanguage(@Body() addLanguageDto: AddLanguageDto): Promise<string> {
    return this.Service.addProjectLanguage(addLanguageDto);
  }

  @Post('addProjectKey')
  addProjectKey(@Body() addKeyDto: AddKeyDto): Promise<IKey> {
    return this.Service.addProjectKey({
      userId: USER_ID,
      ...addKeyDto,
    });
  }

  @Post('updateKey')
  updateKey(@Body() updateKeyDto: UpdateKeyDto) {
    return this.Service.updateProjectKey({
      userId: USER_ID,
      ...updateKeyDto,
    });
  }
}
