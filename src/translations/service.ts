import { Model } from 'mongoose';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';

import { IProject } from './interfaces/project.interface';
import { IKey } from './interfaces/key.interface';

import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { AddKeyDto } from './dto/add-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { LanguageVisibilityDto } from './dto/language-visibility.dto';
import { AddMultipleLanguagesDto } from './dto/add-multiple-languages.dto';
import { MultipleLanguageVisibilityDto } from './dto/multiple-languages-visibility.dto';
import { UpdateLanguageDto } from "./dto/update-language.dto";

@Injectable()
export class Service {
  constructor(
    @Inject('PROJECT_MODEL')
    private projectModel: Model<IProject>,
    @Inject('KEY_MODEL')
    private keyModel: Model<IKey>,
  ) {}

  async getUserProjects(params): Promise<IProject[]> {
    return this.projectModel.find(params).exec();
  }

  async createProject(createProjectDto: CreateProjectDto): Promise<IProject[]> {
    const createdProject = new this.projectModel(createProjectDto);

    await createdProject.save();

    const userProjects = await this.projectModel.find({
      userId: createProjectDto.userId,
    });

    return userProjects;
  }

  async updateProject(data): Promise<IProject> {
    const { projectId, ...dataPatch } = data;

    await this.projectModel.updateOne(
      {
        projectId,
      },
      dataPatch,
    );

    return this.projectModel.findOne({ projectId });
  }

  async deleteProject(projectId, userId): Promise<IProject[]> {
    await this.projectModel.deleteOne({
      projectId,
      userId,
    });

    const userProjects = await this.projectModel.find({
      userId,
    });

    return userProjects;
  }

  async addProjectKey(addKeyDto: AddKeyDto) {
    const createdKey = new this.keyModel(addKeyDto);

    return await createdKey.save();
  }

  async updateProjectKey(updateKeyDto: UpdateKeyDto) {
    const { id, values } = updateKeyDto;

    return this.keyModel.updateOne(
      {
        id,
      },
      {
        values,
      },
    );
  }

  async getUserProjectById(projectId: string, userId: string): Promise<IProject> {
    const project = await this.projectModel
      .findOne({
        projectId,
        userId,
      })
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.keys = (await this.keyModel.find({ userId, projectId })) as [IKey];

    return project;
  }

  async addLanguage(addLanguageDto: AddLanguageDto) {
    const { projectId, id, label, baseLanguage, code } = addLanguageDto;

    const result = await this.projectModel.updateOne(
      { projectId },
      {
        $addToSet: {
          languages: {
            id,
            label,
            baseLanguage,
            code,
            visible: true,
          },
        },
      },
    );

    console.log('result', result);

    return 'OK';
  }

  async updateLanguage(updateLanguageDto: UpdateLanguageDto): Promise<IProject | Error> {
    const { projectId, ...language } = updateLanguageDto;

    const result = await this.projectModel.findOneAndUpdate(
      { projectId, 'languages.id': language.id },
      { $set: { 'languages.$': language } },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Project not found');
    }

    return result;
  }

  async addMultipleProjectLanguage(addMultipleLanguagesDto: AddMultipleLanguagesDto): Promise<IProject | Error> {
    const { projectId, languages } = addMultipleLanguagesDto;

    const result = await this.projectModel.findOneAndUpdate(
      { projectId },
      { $push: { languages: { $each: languages } } },
      { new: true },
    )
      .exec();

    if (!result) {
      throw new NotFoundException('Project not found');
    }

    return result;
  }

  async deleteProjectLanguage(projectId: string, languageId: string): Promise<IProject | Error> {
    const result = await this.projectModel
      .findOneAndUpdate({ projectId }, { $pull: { languages: { id: languageId } } }, { new: true })
      .exec();

    if (!result) {
      throw new NotFoundException('Project or Language not found');
    }

    return result;
  }

  async setLanguageVisibility({ projectId, languageId, visible }: LanguageVisibilityDto): Promise<IProject> {
    const result = await this.projectModel.findOneAndUpdate(
      { projectId, 'languages.id': languageId },
      { $set: { 'languages.$.visible': visible } },
      { new: true },
    );

    return result;
  }

  async setMultipleLanguagesVisibility({ projectId, data }: MultipleLanguageVisibilityDto): Promise<IProject> {
    console.log(projectId, data);

    const bulkOps = data.map(({ languageId, visible }) => {
      return {
        updateOne: {
          filter: { projectId, 'languages.id': languageId },
          update: { $set: { 'languages.$.visible': visible } },
        },
      };
    });

    await this.projectModel.bulkWrite(bulkOps);

    return await this.projectModel.findOne({ projectId });
  }
}
