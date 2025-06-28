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
import { EExportFormats, ILanguage, IProject } from './interfaces/project.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { LanguageVisibilityDto } from './dto/language-visibility.dto';
import { AddMultipleLanguagesDto } from './dto/add-multiple-languages.dto';
import { MultipleLanguageVisibilityDto } from './dto/multiple-languages-visibility.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { IKey } from './interfaces/key.interface';
import { EStatusCode, IResponse } from '../interfaces';
import { GetProjectByIdDto, TSortBy, TSortDirection } from './dto/get-project-by-id.dto';

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
  getUserProjectById(
    @Query('projectId') projectId: string,
    @Query('subFolderId') subFolderId: string,
    @Query('page') page: number,
    @Query('itemsPerPage') itemsPerPage: number,
    @Query('sortBy') sortBy: TSortBy,
    @Query('sortDirection') sortDirection: TSortDirection,
    @Query('filters') filters: string,
    @Req() req,
  ): Promise<IProject> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.getUserProjectById({
      projectId,
      page,
      itemsPerPage,
      userId: session.userId,
      subFolderId,
      sortBy,
      sortDirection,
      filters: filters ? filters.split(',') : [],
    } as GetProjectByIdDto);
  }

  @Get('getKeyData')
  getKeyData(
    @Query('projectId') projectId: string,
    @Query('userId') userId: string,
    @Query('keyId') keyId: string,
    @Req() req,
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.getKeyData(projectId, userId, keyId);
  }

  @Get('getEntityContent')
  getEntityContent(
    @Query('projectId') projectId: string,
    @Query('userId') userId: string,
    @Query('componentId') componentId: string,
    @Req() req,
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.getEntityContent(projectId, userId, componentId);
  }

  @Post('createProjectEntity')
  createProjectEntity(@Body() createKeyEntity: CreateEntityDto, @Req() req) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.createProjectEntity({
      userId: session.userId,
      ...createKeyEntity,
    });
  }

  @Delete('deleteProjectEntity')
  deleteProjectEntity(@Query('id') id: string, @Req() req) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.deleteProjectEntity(id);
  }

  @Post('updateKey')
  updateKey(@Body() updateKeyDto: UpdateKeyDto) {
    return this.Service.updateProjectEntity(updateKeyDto);
  }

  @Post('addLanguage')
  addLanguage(@Body() addLanguageDto: AddLanguageDto) {
    return this.Service.addLanguage(addLanguageDto);
  }

  @Post('updateLanguage')
  updateLanguage(@Body() updateLanguageDto: UpdateLanguageDto): Promise<IProject | Error> {
    return this.Service.updateLanguage(updateLanguageDto);
  }

  @Post('addMultipleLanguages')
  addMultipleProjectLanguages(@Body() addMultipleLanguagesDto: AddMultipleLanguagesDto): Promise<IProject | Error> {
    return this.Service.addMultipleProjectLanguages(addMultipleLanguagesDto);
  }

  @Delete('deleteLanguage')
  deleteProjectLanguage(
    @Query('languageId') languageId: string,
    @Query('projectId') projectId: string,
    @Req() req,
  ): Promise<IProject | Error> {
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
  setMultipleLanguagesVisibility(
    @Body() multipleLanguageVisibilityDto: MultipleLanguageVisibilityDto,
  ): Promise<IProject> {
    return this.Service.setMultipleLanguagesVisibility(multipleLanguageVisibilityDto);
  }

  @Get('exportProject')
  async exportProject(
    @Query('projectId') projectId: string,
    @Query('format') format: EExportFormats,
    @Query('format_settings') formatSettings: any = {},
    @Req() req,
    @Res() res: Response,
  ): Promise<IResponse> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    if (format === EExportFormats.json) {
      return await this.Service.exportProjectToJson(projectId, formatSettings, session.userId, res);
    }

    if (format === EExportFormats.androidXml) {
      return await this.Service.exportProjectToAndroidXml(projectId, formatSettings, session.userId, res);
    }

    if (format === EExportFormats.appleStrings) {
      return await this.Service.exportProjectToAppleStrings(projectId, formatSettings, session.userId, res);
    }

    return {
      statusCode: EStatusCode.Not_Found,
      message: 'Format is not supported',
    };
  }

  @Post('importJsonDataToProject')
  @UseInterceptors(FilesInterceptor('files', 10))
  async importJsonDataToProject(
    @Body('projectId') projectId: string,
    @Body('metaData') metaData: string,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return await this.Service.importDataToProject({ projectId, userId: session.userId, files, metaData });
  }

  @Post('importComponentsDataToProject')
  @UseInterceptors(FilesInterceptor('files', 10))
  async importComponentsDataToProject(
    @Body('projectId') projectId: string,
    @Body('metaData') metaData: string[] | string,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[] & { code: string },
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    const metaDataParsed =
      typeof metaData === 'string'
        ? [JSON.parse(metaData as string)]
        : metaData.map((dataItem) => JSON.parse(dataItem));

    return await this.Service.importComponentsDataToProject({
      projectId,
      userId: session.userId,
      files,
      metaData: metaDataParsed,
    });
  }

  @Post('addMultipleRawLanguages')
  async addMultipleRawLanguages(@Body() data: any[], @Req() req) {
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

  @Get('getMultipleEntitiesDataByParentId')
  async getMultipleEntitiesDataByParentId(
    @Query('projectId') projectId: string,
    @Query('parentId') parentId: string,
    @Req() req,
  ): Promise<IKey[]> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.Service.getMultipleEntitiesDataByParentId(projectId, parentId);
  }
}
