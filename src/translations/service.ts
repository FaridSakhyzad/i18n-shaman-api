import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';

import { IProject } from './interfaces/project.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { Cat } from "../cats/interfaces/cat.interface";

@Injectable()
export class Service {
  constructor(
    @Inject('PROJECT_MODEL')
    private projectModel: Model<IProject>,
  ) {}

  async findAll(): Promise<IProject[]> {
    return this.projectModel.find().exec();
  }

  async create(createProjectDto: CreateProjectDto): Promise<IProject> {
    const createdCat = new this.projectModel(createProjectDto);
    return createdCat.save();
  }
}
