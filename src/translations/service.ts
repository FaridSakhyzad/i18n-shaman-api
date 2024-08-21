import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';

import { IProject } from './interfaces/project.interface';
import { IKey } from './interfaces/key.interface';

import { CreateProjectDto } from './dto/create-project.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { AddKeyDto } from './dto/add-key.dto';
import { GetProjectByIdDto } from './dto/get-project-by-id.dto';
import { UpdateKeyDto } from './dto/update-key.dto';

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

  async addProjectLanguage(addLanguageDto: AddLanguageDto) {
    const { projectId, id, label, baseLanguage } = addLanguageDto;

    const result = await this.projectModel.updateOne(
      { projectId },
      {
        $addToSet: {
          languages: {
            id,
            label,
            baseLanguage,
          },
        },
      },
    );

    console.log('result', result);

    return 'OK';
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

  async getUserProjectById(
    getProjectByIdDto: GetProjectByIdDto,
  ): Promise<IProject> {
    const { userId, projectId } = getProjectByIdDto;

    const project = await this.projectModel.findOne(getProjectByIdDto).exec();

    project.keys = (await this.keyModel.find({ userId, projectId })) as [IKey];

    return project;
  }
}
