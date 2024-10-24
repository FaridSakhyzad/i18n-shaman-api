import { Controller, Get, Post, Body, Query, Delete, Req, UnauthorizedException } from '@nestjs/common';

import { Service } from './service';
import { IProject } from './interfaces/project.interface';
import { IKey } from './interfaces/key.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { AddKeyDto } from './dto/add-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { LanguageVisibilityDto } from './dto/language-visibility.dto';
import { AddMultipleLanguagesDto } from './dto/add-multiple-languages.dto';
import { MultipleLanguageVisibilityDto } from './dto/multiple-languages-visibility.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller()
export class TransController {
  constructor(private readonly Service: Service) {}

  @Post('createProject')
  createProject(@Body() createProjectDto: CreateProjectDto): Promise<IProject[]> {
    return this.Service.createProject(createProjectDto);
  }

  @Post('updateProject')
  updateProject(@Body() projectData, @Req() req): Promise<IProject | Error> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.updateProject(projectData);
  }

  @Delete('deleteProject')
  deleteProject(@Query('projectId') projectId: string, @Req() req): Promise<IProject[] | Error> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.deleteProject(projectId, session.userId);
  }

  @Get('getUserProjects')
  getUserProjects(@Query('userId') userId: string): Promise<IProject[]> {
    return this.Service.getUserProjects({ userId });
  }

  @Get('getUserProjectById')
  getUserProjectById(@Query('projectId') projectId: string, @Req() req): Promise<IProject> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.getUserProjectById(projectId, session.userId);
  }

  @Post('addProjectKey')
  addProjectKey(@Body() addKeyDto: AddKeyDto, @Req() req): Promise<IKey> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.addProjectKey({
      userId: session.userId,
      ...addKeyDto,
    });
  }

  @Post('updateKey')
  updateKey(@Body() updateKeyDto: UpdateKeyDto) {
    return this.Service.updateProjectKey(updateKeyDto);
  }

  @Post('addLanguage')
  addLanguage(@Body() addLanguageDto: AddLanguageDto): Promise<string> {
    return this.Service.addLanguage(addLanguageDto);
  }

  @Post('updateLanguage')
  updateLanguage(@Body() updateLanguageDto: UpdateLanguageDto): Promise<IProject | Error> {
    return this.Service.updateLanguage(updateLanguageDto);
  }

  @Post('addMultipleLanguages')
  addMultipleProjectLanguages(@Body() addMultipleLanguagesDto: AddMultipleLanguagesDto): Promise<IProject | Error> {
    return this.Service.addMultipleProjectLanguage(addMultipleLanguagesDto);
  }

  @Delete('deleteLanguage')
  deleteProjectLanguage(@Query('languageId') languageId: string, @Query('projectId') projectId: string, @Req() req): Promise<IProject | Error> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.deleteProjectLanguage(projectId, languageId);
  }

  @Post('setLanguageVisibility')
  setLanguageVisibility(@Body() languageVisibilityDto: LanguageVisibilityDto): Promise<IProject> {
    return this.Service.setLanguageVisibility(languageVisibilityDto);
  }

  @Post('setMultipleLanguagesVisibility')
  setMultipleLanguagesVisibility(@Body() multipleLanguageVisibilityDto: MultipleLanguageVisibilityDto): Promise<IProject> {
    return this.Service.setMultipleLanguagesVisibility(multipleLanguageVisibilityDto);
  }
}
