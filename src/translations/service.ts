import * as archiver from 'archiver';

import { Model } from 'mongoose';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';

import { ILanguage, ILanguageMap, IProject, IProjectLanguage } from './interfaces/project.interface';
import { IKey } from './interfaces/key.interface';

import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { AddKeyDto } from './dto/add-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { LanguageVisibilityDto } from './dto/language-visibility.dto';
import { AddMultipleLanguagesDto } from './dto/add-multiple-languages.dto';
import { MultipleLanguageVisibilityDto } from './dto/multiple-languages-visibility.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { IRawLanguage } from './interfaces/rawLanguage.interface';
import { IKeyValue } from './interfaces/keyValue.interface';

@Injectable()
export class Service {
  constructor(
    @Inject('PROJECT_MODEL')
    private projectModel: Model<IProject>,
    @Inject('KEY_MODEL')
    private keyModel: Model<IKey>,
    @Inject('KEY_VALUE_MODEL')
    private keyValueModel: Model<IKeyValue>,
    @Inject('RAW_LANGUAGE_MODEL')
    private rawLanguageModel: Model<IRawLanguage>,
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

  async createProjectKey(addKeyDto: AddKeyDto) {
    const { id, userId, projectId, values } = addKeyDto;

    const createdKey = new this.keyModel(addKeyDto);

    const keyValuesData = values.map((value) => ({
      id: Math.random().toString(16).substring(2),
      userId,
      projectId,
      keyId: id,
      ...value,
    }));

    const valuesInsertResult = await this.keyValueModel.insertMany(keyValuesData);

    const keyCreateResult = await createdKey.save();

    return {
      valuesInsertResult,
      keyCreateResult,
    };
  }

  async getAggregatedValues(userId: string, projectId: string, parentId: string) {
    const aggregatedValues = await this.keyValueModel.aggregate([
      {
        $match: {
          userId,
          projectId,
          parentId,
        },
      },
      {
        $group: {
          _id: '$keyId',
          items: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          parentId: '$_id',
          items: 1,
        },
      },
      {
        $project: {
          parentId: 1,
          items: {
            $arrayToObject: {
              $map: {
                input: '$items',
                as: 'item',
                in: ['$$item.languageId', '$$item'],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          result: { $push: { k: '$parentId', v: '$items' } },
        },
      },
      {
        $project: {
          result: { $arrayToObject: '$result' },
        },
      },
      {
        $replaceRoot: { newRoot: '$result' },
      },
    ]);

    return aggregatedValues;
  }

  async updateProjectKey(updateKeyDto: UpdateKeyDto) {
    const {
      id,
      label,
      description,
      values,
      userId,
      projectId,
      parentId,
    } = updateKeyDto;

    const result = await this.keyModel.updateOne(
      {
        id,
      },
      {
        label,
        description,
      },
    );
    const bulkOps = values.map((item) => {
      const $setOnInsert = {};

      if (!item.userId) {
        $setOnInsert['userId'] = userId;
      }

      if (!item.id) {
        $setOnInsert['id'] = Math.random().toString(16).substring(2);
      }

      return {
        updateOne: {
          filter: { id: item.id },
          update: {
            $set: item,
            $setOnInsert,
          },
          upsert: true,
        },
      };
    });

    await this.keyValueModel.bulkWrite(bulkOps);

    const key = await this.keyModel.find({ id });

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, parentId);

    return {
      ...key[0].toObject(),
      values: aggregatedValues.length > 0 && aggregatedValues[0][id] ? aggregatedValues[0][id] : [],
    };
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

    const keys: IKey[] = await this.keyModel.find({
      userId,
      projectId,
      parentId: projectId, //Project level keys only
    });

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, projectId);

    return {
      ...project.toObject(),
      keys,
      values: aggregatedValues[0],
    } as IProject;
  }

  async getComponentData(projectId: string, userId: string, componentId: string) {
    const keys = await this.keyModel.find({
      projectId,
      userId,
      parentId: componentId,
    });

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, componentId);

    return {
      keys,
      values: aggregatedValues[0],
    };
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

    return result;
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

  async addMultipleProjectLanguages(addMultipleLanguagesDto: AddMultipleLanguagesDto): Promise<IProject | Error> {
    const { projectId, languages } = addMultipleLanguagesDto;

    const result = await this.projectModel
      .findOneAndUpdate({ projectId }, { $push: { languages: { $each: languages } } }, { new: true })
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

  async exportProjectToJson(projectId: string, userId: string, res) {
    /*
    const project = await this.projectModel
      .findOne({
        userId,
        projectId,
      })
      .exec();

    const { languages } = project;

    const languagesMap: ILanguageMap = {};
    const destinations = {} as { [key: string]: any };

    for (let i = 0; i < languages.length; i++) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      languagesMap[id] = {
        id,
        code,
        customCode,
        customCodeEnabled,
      };

      destinations[`${customCodeEnabled ? customCode : code}`] = {};
    }

    const projectKeys = (await this.keyModel.find({ userId, projectId })) as [IKey];

    for (let i = 0; i < projectKeys.length; i++) {
      const { values, label } = projectKeys[i] as IKey;

      for (let j = 0; j < values.length; j++) {
        const { languageId, value } = values[j];

        if (!languagesMap[languageId]) {
          continue;
        }

        const { code, customCode, customCodeEnabled } = languagesMap[languageId];

        const destination = customCodeEnabled ? customCode : code;

        destinations[destination][label] = value;
      }
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const [fileName, data] of Object.entries(destinations)) {
      const jsonContent = JSON.stringify(data, null, 2);
      archive.append(jsonContent, { name: `${fileName}.json` });
    }

    await archive.finalize();
    */
  }

  async addMultipleRawLanguages(data: any) {
    return await this.rawLanguageModel.insertMany(data);
  }

  async getAppLanguagesData(): Promise<ILanguage[]> {
    const result = await this.rawLanguageModel.find({});

    return result.map(({ id, code, label }) => ({ id, code, label }));
  }

  async importDataToProject(data: any) {
    const { projectId, userId, files } = data;

    const project: IProject = await this.projectModel
      .findOne({
        projectId,
      })
      .exec();

    const { languages: projectLanguages } = project;

    const appLanguages = await this.getAppLanguagesData();

    const localesToCreate = [];
    const localesToUpdate = [];
    const keysToAdd = {};

    for (let i = 0; i < files.length; i++) {
      const { originalname, buffer } = files[i];

      const lastDotIndex = originalname.lastIndexOf('.');

      const filename = originalname.slice(0, lastDotIndex);

      const newLanguageFromFilename = appLanguages.find((language: ILanguage) => language.code === filename);

      if (newLanguageFromFilename) {
        localesToCreate.push({
          baseLanguage: false,
          visible: true,
          customCodeEnabled: false,
          customLabelEnabled: false,
          customCode: '',
          customLabel: '',
          ...newLanguageFromFilename,
        });
      }

      const projectLanguageFromFilename = projectLanguages.find(
        (language: IProjectLanguage) => language.code === filename,
      );

      if (projectLanguageFromFilename) {
        localesToUpdate.push(projectLanguageFromFilename);
      }

      const languageFromFilename = newLanguageFromFilename || projectLanguageFromFilename;

      const fileContent = buffer.toString('utf-8');

      let data = null;

      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        console.error('ERROR DECODING JSON FILE', e);
      }

      Object.entries(data).forEach(([key, value]) => {
        if (keysToAdd[key] === undefined) {
          keysToAdd[key] = {
            userId,
            projectId,
            id: Math.random().toString(16).substring(2),
            label: key,
            values: [],
            description: '',
          };
        }

        keysToAdd[key].values.push({
          languageId: languageFromFilename.id,
          value,
        });
      });
    }

    const projectUpdateResult = await this.projectModel
      .findOneAndUpdate({ projectId }, { $push: { languages: { $each: localesToCreate } } }, { new: true })
      .exec();

    const keysToAddArray = [];

    Object.entries(keysToAdd).forEach(([key, value]) => {
      keysToAddArray.push(value);
    });

    return await this.keyModel.insertMany(keysToAddArray);
  }
}
