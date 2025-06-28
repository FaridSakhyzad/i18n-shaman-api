import * as archiver from 'archiver';

import { Model, SortOrder } from 'mongoose';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { js2xml } from 'xml-js';

import {
  IStructuredProjectData,
  ILanguage,
  ILanguageMap,
  IProject,
  IProjectLanguage, EFilter,
} from './interfaces/project.interface';

import { EStatusCode, IResponse } from '../interfaces';

import { IKey } from './interfaces/key.interface';

import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { LanguageVisibilityDto } from './dto/language-visibility.dto';
import { AddMultipleLanguagesDto } from './dto/add-multiple-languages.dto';
import { MultipleLanguageVisibilityDto } from './dto/multiple-languages-visibility.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { IRawLanguage } from './interfaces/rawLanguage.interface';
import { IKeyValue } from './interfaces/keyValue.interface';
import { KeyHelperService } from './keyHelper.service';
import { GetProjectByIdDto } from './dto/get-project-by-id.dto';

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
    private readonly keyHelperService: KeyHelperService,
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

  async createProjectEntity(createEntityDto: CreateEntityDto) {
    const { id, userId, projectId } = createEntityDto;

    const createdAt = +new Date();

    const { values, ...keyData } = createEntityDto;

    const createdKey = new this.keyModel({
      ...keyData,
      updatedAt: createdAt,
      createdAt,
    });

    const keyCreateResult = await createdKey.save();

    const keyValuesData = values.map((value) => ({
      id: Math.random().toString(16).substring(2),
      userId,
      projectId,
      keyId: id,
      pathCache: `${keyCreateResult.pathCache}/${keyCreateResult.id}`,
      ...value,
    }));

    const valuesInsertResult = await this.keyValueModel.insertMany(keyValuesData);

    return {
      valuesInsertResult,
      keyCreateResult,
    };
  }

  async deleteProjectEntity(id: string) {
    const entity = await this.keyModel.findOne({ id });

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const { pathCache } = entity;

    const childrenEntitiesDeleteResult = await this.keyModel.deleteMany({
      pathCache: new RegExp(`^${pathCache}/${id}`),
    });

    const childrenValuesDeleteResult = await this.keyValueModel.deleteMany({
      pathCache: new RegExp(`^${pathCache}/${id}`),
    });

    const entityDeleteResult = await entity.deleteOne();

    return entityDeleteResult;
  }

  async getAggregatedValues(userId: string, projectId: string, parentIds: string[], keyIds?: string[]) {
    const aggregatedValues = await this.keyValueModel.aggregate([
      {
        $match: {
          userId,
          projectId,
          ...(parentIds ? { parentId: { $in: parentIds } } : {}),
          ...(keyIds ? { keyId: { $in: keyIds } } : {}),
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

  async updateProjectEntity(updateKeyDto: UpdateKeyDto) {
    const { id, label, description, values, userId, projectId, parentId } = updateKeyDto;

    const updatedAt = +new Date();

    const result = await this.keyModel.updateOne(
      {
        id,
      },
      {
        label,
        description,
        updatedAt,
      },
    );

    let key = await this.keyModel.findOne({ id });

    key = key.toObject();

    const bulkOps = values.map((item) => {
      const $setOnInsert = {};

      if (!item.userId) {
        $setOnInsert['userId'] = userId;
      }

      if (!item.id) {
        $setOnInsert['id'] = Math.random().toString(16).substring(2);
      }

      if (!item.pathCache) {
        $setOnInsert['pathCache'] = `${key.pathCache}/${key.id}`;
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

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, [parentId]);

    return {
      key,
      values: aggregatedValues.length > 0 && aggregatedValues[0][id] ? aggregatedValues[0][id] : [],
    };
  }

  async getUserProjectById(params: GetProjectByIdDto): Promise<IProject> {
    const { projectId, page, itemsPerPage, userId, subFolderId, sortBy, sortDirection = 'asc', filters } = params;

    const project = await this.projectModel
      .findOne({
        projectId,
        userId,
      })
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let upstreamParents: IKey[];
    let subfolderModel: IKey;

    if (subFolderId) {
      subfolderModel = await this.keyModel.findOne({ userId, projectId, id: subFolderId });

      const parentIds = subfolderModel.pathCache.replace('#', projectId).split('/');

      upstreamParents = await this.keyModel.find(
        { userId, projectId, id: parentIds },
        {
          id: 1,
          label: 1,
          projectId: 1,
          parentId: 1,
          pathCache: 1,
          type: 1,
          values: 1,
          _id: 0,
        },
      );
    }

    const parentId = subFolderId || projectId;

    const keysTotalCount = await this.keyModel.countDocuments({
      userId,
      projectId,
      parentId,
    });

    const sortParams: { [key: string]: SortOrder | { $meta: any } } = {
      type: 'asc',
    };

    if (!sortBy || sortBy === 'name') {
      sortParams.label = sortDirection;
    }

    if (sortBy === 'type') {
      sortParams.type = sortDirection;
    }

    if (sortBy === 'created') {
      sortParams.createdAt = sortDirection;
    }

    if (sortBy === 'updated') {
      sortParams.updatedAt = sortDirection;
    }

    const filterData = {};

    if (filters && filters.length > 0) {
      filters.forEach((item: string) => {
        filterData[item] = true;
      });
    }

    const filterParams: any = {};

    if (filterData[EFilter.hideComponents] || filterData[EFilter.hideFolders] || filterData[EFilter.hideKeys]) {
      filterParams.type = new Set(['string', 'folder', 'component']);

      if (filterData[EFilter.hideComponents]) {
        filterParams.type.delete('component');
      }

      if (filterData[EFilter.hideFolders]) {
        filterParams.type.delete('folder');
      }

      if (filterData[EFilter.hideKeys]) {
        filterParams.type.delete('string');
      }

      filterParams.type = [...filterParams.type];
    }

    const keys: IKey[] = await this.keyModel
      .find(
        {
          userId,
          projectId,
          parentId,
          ...filterParams,
        },
        null,
        {
          limit: itemsPerPage,
          skip: page * itemsPerPage,
        },
      )
      .sort(sortParams);

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, [parentId]);

    return {
      ...project.toObject(),
      keys,
      values: aggregatedValues[0],
      keysTotalCount,
      upstreamParents,
      subfolder: subfolderModel,
    } as IProject;
  }

  async getKeyData(projectId: string, userId: string, keyId: string) {
    const result = await this.keyModel.findOne({
      projectId,
      userId,
      id: keyId,
    });

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, null, [keyId]);

    return {
      key: result,
      values: aggregatedValues[0],
    };
  }

  async getEntityContent(projectId: string, userId: string, componentId: string) {
    const keys = await this.keyModel
      .find({
        projectId,
        userId,
        parentId: componentId,
      })
      .sort({ type: 'asc', label: 'asc' });

    const aggregatedValues = await this.getAggregatedValues(userId, projectId, [componentId]);

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

  getShallowFileKeyValueStructure(keys, aggregatedValues, languagesMap) {
    const result = {} as { [key: string]: any };

    for (let i = 0; i < keys.length; i++) {
      const { id, label } = keys[i] as IKey;
      let values = aggregatedValues[id];

      if (!values) {
        continue;
      }

      values = Object.entries(values).map(([key, value]) => value) as IKeyValue[];

      for (let j = 0; j < values.length; j++) {
        const { languageId, value } = values[j];

        if (!languagesMap[languageId]) {
          continue;
        }

        const { code, customCode, customCodeEnabled } = languagesMap[languageId];

        const destination = customCodeEnabled ? customCode : code;

        if (!result[destination]) {
          result[destination] = {};
        }

        result[destination][label] = value;
      }
    }

    return result;
  }

  getFolderLanguageKeyValueStructure(components, keys, aggregatedValues, languagesMap) {
    const result = {};

    const aggregatedComponents = {};

    for (let i = 0; i < components.length; i++) {
      const { id } = components[i];
      aggregatedComponents[id] = components[i];
    }

    for (let i = 0; i < keys.length; i++) {
      const { id: keyId, label: keyLabel, parentId: parentComponentId } = keys[i] as IKey;
      let values = aggregatedValues[keyId];

      if (!values) {
        continue;
      }

      values = Object.entries(values).map(([key, value]) => value) as IKeyValue[];

      for (let j = 0; j < values.length; j++) {
        const { languageId, value } = values[j];

        if (!languagesMap[languageId]) {
          continue;
        }

        const { code, customCode, customCodeEnabled } = languagesMap[languageId];

        const destinationFolder = customCodeEnabled ? customCode : code;

        if (!result[destinationFolder]) {
          result[destinationFolder] = {};
        }

        const destinationFile = aggregatedComponents[parentComponentId].label;

        if (!result[destinationFolder][destinationFile]) {
          result[destinationFolder][destinationFile] = {};
        }

        result[destinationFolder][destinationFile][keyLabel] = value;
      }
    }

    return result;
  }

  async getMultipleEntitiesDataByParentId(projectId: string, parentId: string): Promise<IKey[]> {
    const result = await this.keyModel.find({ projectId, parentId });

    return result;
  }

  async getStructuredObjectFromProject(userId: string, project: IProject): Promise<any> {
    const { languages, projectId } = project;

    const languagesMap: ILanguageMap = {};

    for (let i = 0; i < languages.length; i++) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      languagesMap[id] = {
        id,
        code,
        customCode,
        customCodeEnabled,
      };
    }

    const keys: IKey[] = await this.keyModel.find({ userId, projectId }).lean();
    const [aggregatedValues] = (await this.getAggregatedValues(userId, projectId, null, null)) || [];

    const structuredProjectData: IStructuredProjectData = {};

    for (let i = 0; i < languages.length; i += 1) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      const tree = this.keyHelperService.buildHierarchyForJsonExport(keys, aggregatedValues, projectId, id);

      const languageLabel = customCodeEnabled ? customCode : code;

      structuredProjectData[languageLabel] = tree;
    }

    return structuredProjectData;
  }

  async exportProjectToJson(projectId: string, format_settings: any, userId: string, res): Promise<any> {
    const project = await this.projectModel
      .findOne({
        userId,
        projectId,
      })
      .exec();

    const structuredData = await this.getStructuredObjectFromProject(userId, project);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const [langCode, data] of Object.entries(structuredData)) {
      const containerName = langCode;
      const { localesData, componentsData } = data as IStructuredProjectData;

      const jsonContent = JSON.stringify(localesData, null, 2);
      archive.append(jsonContent, { name: `${containerName}.json` });

      for (const [componentName, componentData] of Object.entries(componentsData)) {
        const jsonContent = JSON.stringify(componentData, null, 2);
        archive.append(jsonContent, { name: `${containerName}/${componentName}.json` });
      }
    }

    return await archive.finalize();
  }

  async getXmlReadyObjectFromProject(userId: string, project: IProject): Promise<any> {
    const { languages, projectId } = project;

    const languagesMap: ILanguageMap = {};

    for (let i = 0; i < languages.length; i++) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      languagesMap[id] = {
        id,
        code,
        customCode,
        customCodeEnabled,
      };
    }

    const keys: IKey[] = await this.keyModel.find({ userId, projectId }).lean();
    const [aggregatedValues] = (await this.getAggregatedValues(userId, projectId, null, null)) || [];

    const structuredProjectData: IStructuredProjectData = {};

    for (let i = 0; i < languages.length; i += 1) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      const tree = this.keyHelperService.buildHierarchyForXmlExport(keys, aggregatedValues, projectId, id);

      const languageLabel = customCodeEnabled ? customCode : code;

      structuredProjectData[languageLabel] = tree;
    }

    return structuredProjectData;
  }

  async getStringsReadyArrayFromProject(userId: string, project: IProject): Promise<any> {
    const { languages, projectId } = project;

    const languagesMap: ILanguageMap = {};

    for (let i = 0; i < languages.length; i++) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      languagesMap[id] = {
        id,
        code,
        customCode,
        customCodeEnabled,
      };
    }

    const keys: IKey[] = await this.keyModel.find({ userId, projectId }).lean();

    const [aggregatedValues] = (await this.getAggregatedValues(userId, projectId, null, null)) || [];

    const structuredProjectData: IStructuredProjectData = {};

    for (let i = 0; i < languages.length; i += 1) {
      const { id, code, customCode, customCodeEnabled } = languages[i];

      const array = this.keyHelperService.buildLinearKeyValueArray(keys, aggregatedValues, projectId, id);

      const languageLabel = customCodeEnabled ? customCode : code;

      structuredProjectData[languageLabel] = array;
    }

    return structuredProjectData;
  }

  async exportProjectToAndroidXml(projectId: string, formatSettings: any, userId: string, res): Promise<IResponse> {
    const response: IResponse = {
      statusCode: EStatusCode.OK,
    };

    const project = await this.projectModel
      .findOne({
        userId,
        projectId,
      })
      .exec();

    const structuredData = await this.getXmlReadyObjectFromProject(userId, project);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    const declaration = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'utf-8',
        },
      },
    };

    for (const [langCode, data] of Object.entries(structuredData)) {
      const containerName = langCode;
      const { localesData, componentsData } = data as IStructuredProjectData;

      const xmlLocalesData = {
        ...declaration,
        [langCode]: localesData,
      };

      const xmlLocalesString = js2xml(xmlLocalesData, { compact: true, ignoreComment: true, spaces: 2 });
      archive.append(xmlLocalesString, { name: `${containerName}.xml` });

      for (const [componentName, componentData] of Object.entries(componentsData)) {
        const xmlComponentData = {
          ...declaration,
          [langCode]: componentData,
        };

        const xmlComponentsString = js2xml(xmlComponentData, { compact: true, ignoreComment: true, spaces: 2 });
        archive.append(xmlComponentsString, { name: `${containerName}/${componentName}.xml` });
      }
    }

    return await archive.finalize();
  }

  async exportProjectToAppleStrings(projectId: string, formatSettings: any, userId: string, res): Promise<IResponse> {
    const response: IResponse = {
      statusCode: EStatusCode.OK,
    };

    const project = await this.projectModel
      .findOne({
        userId,
        projectId,
      })
      .exec();

    const structuredData = await this.getStringsReadyArrayFromProject(userId, project);

    console.log('structuredData', JSON.stringify(structuredData, null, 2));

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const [langCode, data] of Object.entries(structuredData)) {
      const containerName = langCode;
      const { localesData, componentsData } = data as {
        localesData: { key: string; value: string }[];
        componentsData: {
          [key: string]: { key: string; value: string }[];
        };
      };

      const result = localesData.map(({ key, value }: any) => `"${key}" = "${value}";`);

      archive.append(result.join('\n'), { name: `${containerName}.txt` });

      for (const [componentName, componentData] of Object.entries(componentsData)) {
        const txtComponentsString = componentData.map(({ key, value }: any) => `${key} = ${value}`).join('\n');

        archive.append(txtComponentsString, { name: `${containerName}/${componentName}.strings` });
      }
    }

    return await archive.finalize();
  }

  async addMultipleRawLanguages(data: any) {
    return await this.rawLanguageModel.insertMany(data);
  }

  async getAppLanguagesData(): Promise<ILanguage[]> {
    const result = await this.rawLanguageModel.find({});

    return result.map(({ id, code, label }) => ({ id, code, label }));
  }

  collectDocuments(
    data: any,
    parentId: string | null = null,
    results: any[] = [],
    pathCache = '#',
    namePathCache = '#',
  ): any[] {
    for (const [label, value] of Object.entries(data)) {
      const document = {
        label,
        value: typeof value === 'string' ? value : null,
        type: typeof value === 'string' ? 'string' : 'folder',
        parentId,
        id: undefined,
        pathCache,
        namePathCache,
      };

      const tempId = Math.random().toString(16).substring(2);
      document.id = tempId;
      results.push(document);

      if (typeof value === 'object' && value !== null) {
        this.collectDocuments(value, tempId, results, `${pathCache}/${tempId}`, `${namePathCache}/${label}`);
      }
    }

    return results;
  }

  async importDataToProject(data: any) {
    const { projectId, userId, files, metaData } = data;

    const filesMetaData = JSON.parse(metaData);

    const filesMetaDataMap = {};

    filesMetaData.forEach((dataItem) => {
      filesMetaDataMap[dataItem.name] = dataItem;
    });

    const langCodes = [];

    for (let i = 0; i < filesMetaData.length; i += 1) {
      const { name, code } = filesMetaData[i];

      filesMetaDataMap[name] = filesMetaData[i];

      langCodes.push(code);
    }

    const languages = await this.rawLanguageModel.find({ code: langCodes });

    const languagesMap = {};

    for (let i = 0; i < languages.length; i += 1) {
      languagesMap[languages[i].code] = languages[i];
    }

    const documentsToCreate = {};

    for (let j = 0; j < files.length; j += 1) {
      const { originalname, buffer } = files[j];
      const fileContent = buffer.toString('utf-8');

      const fileContentData = JSON.parse(fileContent);

      const { code: languageCode } = filesMetaDataMap[originalname];

      const documentsData = this.collectDocuments(fileContentData, projectId);

      documentsData.forEach((document) => {
        const { id, label, type, parentId, value, pathCache, namePathCache } = document;

        const namePathCacheWithLabel = `${namePathCache}/${label}`;

        if (!documentsToCreate[namePathCacheWithLabel]) {
          documentsToCreate[namePathCacheWithLabel] = {
            id,
            userId,
            parentId,
            projectId,
            label,
            type,
            pathCache,
          };

          if (type === 'string') {
            documentsToCreate[namePathCacheWithLabel].values = [
              {
                code: languageCode,
                value,
              },
            ];
          }
        } else {
          if (type === 'string') {
            documentsToCreate[namePathCacheWithLabel].values.push({
              code: languageCode,
              value,
            });
          }
        }
      });
    }

    const valuesToCreate = [];

    const arrayOfDocumentsToCreate = Object.values(documentsToCreate);

    arrayOfDocumentsToCreate.forEach((document: any) => {
      const { id, type, parentId, values, pathCache } = document;

      if (type === 'string') {
        values.forEach(({ code, value }) => {
          valuesToCreate.push({
            id: Math.random().toString(16).substring(2),
            languageId: languagesMap[code].id,
            keyId: id,
            parentId,
            value,
            userId,
            projectId,
            pathCache,
          });
        });
      }
    });

    const project = await this.projectModel
      .findOne({
        userId,
        projectId,
      })
      .exec();

    const { languages: projectLanguages } = project;

    const projectLanguagesIdsMap = {};

    for (let k = 0; k < projectLanguages.length; k += 1) {
      const { id } = projectLanguages[k] as IProjectLanguage;
      projectLanguagesIdsMap[id] = true;
    }

    const languagesToAdd = languages
      .map(({ id, label, code }) => ({
        projectId,
        id,
        label,
        baseLanguage: false,
        code,
        visible: true,
      }))
      .filter(({ id }) => {
        return !projectLanguagesIdsMap[id];
      });

    let addProjectLanguagesResult = {};

    if (languagesToAdd.length > 0) {
      addProjectLanguagesResult = await this.addMultipleProjectLanguages({
        projectId,
        languages: languagesToAdd,
      });
    }

    const createDocumentsResult = await this.keyModel.insertMany(arrayOfDocumentsToCreate);

    const createValuesResult = await this.keyValueModel.insertMany(valuesToCreate);

    return {
      addProjectLanguagesResult,
      createDocumentsResult,
      createValuesResult,
    };
  }

  async importComponentsDataToProject(data: any): Promise<IResponse> {
    const { projectId, userId, files, metaData } = data;

    const project = await this.projectModel
      .findOne({
        userId,
        projectId,
      })
      .exec();

    const { languages: projectLanguages } = project;

    const projectLanguagesLanguagesSet = new Set(projectLanguages.map(({ id }: ILanguage) => id));
    const languageIdsToAdd = new Set();

    const componentsToCreate = new Set();

    metaData.forEach((dataItem) => {
      const { name, languageId } = dataItem;

      if (!projectLanguagesLanguagesSet.has(languageId)) {
        languageIdsToAdd.add(languageId);
      }

      componentsToCreate.add(name);
    });

    const languagesToAdd = await this.rawLanguageModel.find({ id: [...languageIdsToAdd] });

    let addProjectLanguagesResult = null;

    const documentsToCreate = {};

    for (let i = 0; i < files.length; i += 1) {
      const { buffer } = files[i];
      const fileMetaData = metaData[i];

      const fileContent = buffer.toString('utf-8');
      const fileContentData = JSON.parse(fileContent);

      const { name: fileName, code: languageCode, languageId } = fileMetaData;

      const componentToCreateId = Math.random().toString(16).substring(2);

      const componentToCreateData = {
        label: fileName,
        parentId: projectId,
        projectId,
        type: 'component',
        userId,
        id: componentToCreateId,
        pathCache: '#',
      };

      const documentsData = this.collectDocuments(
        fileContentData,
        componentToCreateId,
        [],
        `#/${componentToCreateId}`,
        `#/${fileName}`,
      );

      documentsData.push(componentToCreateData);

      documentsData.forEach((document) => {
        const { id, label, type, parentId, value, pathCache, namePathCache } = document;

        const namePathCacheWithLabel = `${namePathCache}/${label}`;

        if (!documentsToCreate[namePathCacheWithLabel]) {
          documentsToCreate[namePathCacheWithLabel] = {
            id,
            userId,
            parentId,
            projectId,
            label,
            type,
            pathCache,
          };

          if (type === 'string') {
            documentsToCreate[namePathCacheWithLabel].values = [
              {
                code: languageCode,
                languageId,
                value,
              },
            ];
          }
        } else {
          if (type === 'string') {
            documentsToCreate[namePathCacheWithLabel].values.push({
              code: languageCode,
              languageId,
              value,
            });
          }
        }
      });
    }

    const valuesToCreate = [];

    const arrayOfDocumentsToCreate = Object.values(documentsToCreate);

    arrayOfDocumentsToCreate.forEach((document: any) => {
      const { id, type, parentId, values, pathCache } = document;

      if (type === 'string') {
        values.forEach(({ languageId, value }) => {
          valuesToCreate.push({
            id: Math.random().toString(16).substring(2),
            languageId,
            keyId: id,
            parentId,
            value,
            userId,
            projectId,
            pathCache,
          });
        });
      }
    });

    if (languagesToAdd.length > 0) {
      addProjectLanguagesResult = await this.addMultipleProjectLanguages({
        projectId,
        languages: languagesToAdd.map(({ id, label, code }) => ({
          projectId,
          id,
          label,
          baseLanguage: false,
          code,
          visible: true,
        })),
      });
    }

    const createDocumentsResult = await this.keyModel.insertMany(arrayOfDocumentsToCreate);

    const createValuesResult = await this.keyValueModel.insertMany(valuesToCreate);

    return {
      statusCode: EStatusCode.OK,
      metaData: {
        addProjectLanguagesResult,
        createDocumentsResult,
        createValuesResult,
      },
    };
  }
}
