import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Service } from './service';
import { ILanguage, IProject } from './interfaces/project.interface';
import { IKey } from './interfaces/key.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { AddKeyDto } from './dto/add-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { LanguageVisibilityDto } from './dto/language-visibility.dto';
import { AddMultipleLanguagesDto } from './dto/add-multiple-languages.dto';
import { MultipleLanguageVisibilityDto } from './dto/multiple-languages-visibility.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { get } from 'mongoose';

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
  updateKey(@Body() updateKeyDto: UpdateKeyDto): Promise<IKey> {
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

  @Get('exportProjectToJson')
  async exportProjectToJson(@Query('projectId') projectId: string, @Req() req, @Res() res: Response): Promise<void> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    await this.Service.exportProjectToJson(projectId, session.userId, res);
  }

  @Post('importJsonDataToProject')
  @UseInterceptors(FilesInterceptor('files', 10))
  async importJsonDataToProject(
    @Body('projectId') projectId: string,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return await this.Service.importDataToProject({ projectId, userId: session.userId, files });
  }

  @Post('addMultipleRawLanguages')
  async addMultipleRawLanguages(
    @Body() data: any[],
    @Req() req,
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.addMultipleRawLanguages(data);
  }

  @Get('getAppLanguagesData')
  async getAppLanguagesData(): Promise<ILanguage[]> {
    return this.Service.getAppLanguagesData();
  }
}
