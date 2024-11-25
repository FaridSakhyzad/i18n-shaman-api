import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IKey } from './interfaces/key.interface';
import { IKeyValue } from './interfaces/keyValue.interface';
import { ISearchParams } from './interfaces/searchParams.interface';

@Injectable()
export class SearchService {
  constructor(
    @Inject('KEY_MODEL')
    private keyModel: Model<IKey>,
    @Inject('KEY_VALUE_MODEL')
    private keyValueModel: Model<IKeyValue>,
  ) {}

  async performSearch(params: ISearchParams): Promise<IKey[]> {
    const { projectId, value, exact, casing } = params;

    console.log('projectId', projectId);
    console.log('value', value);
    console.log('exact', exact);
    console.log('casing', casing);

    const keys = await this.keyModel.find({
      label: { $regex: value, $options: 'i' },
      projectId,
    });

    const values = await this.keyValueModel.find({
      value: { $regex: value, $options: 'i' },
    });

    let keysIds = [];

    for (let i = 0; i < keys.length; i++) {
      keysIds.push(keys[i].id);
    }

    for (let i = 0; i < values.length; i++) {
      keysIds.push(values[i].id);
    }

    keysIds = [...new Set(keysIds)];

    const allMatchedKeys = await this.keyModel.find({
      id: { $in: keysIds },
      projectId,
    });

    console.log('keys', keys);
    console.log('values', values);

    return allMatchedKeys;
  }
}
