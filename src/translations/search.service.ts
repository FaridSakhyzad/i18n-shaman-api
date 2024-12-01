import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IKey } from './interfaces/key.interface';
import { IKeyValue } from './interfaces/keyValue.interface';
import { ISearchParams } from './interfaces/searchParams.interface';
import { Service } from './service';
import { KeyHelperService } from './keyHelper.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject('KEY_MODEL')
    private keyModel: Model<IKey>,
    @Inject('KEY_VALUE_MODEL')
    private keyValueModel: Model<IKeyValue>,
    private readonly Service: Service,
    private readonly KeyHelperService: KeyHelperService,
  ) {}

  async performSearch(params: ISearchParams) {
    const { userId, projectId, searchQuery, exact, casing } = params;

    const searchParams = { $regex: searchQuery, $options: 'i' };

    const keyMatchesByLabel = await this.keyModel.find({
      label: searchParams,
      projectId,
    });

    const valueMatchesByValue = await this.keyValueModel.find({
      value: searchParams,
    });

    let keysIds = [];

    for (let i = 0; i < keyMatchesByLabel.length; i++) {
      keysIds.push(keyMatchesByLabel[i].id);
    }

    for (let i = 0; i < valueMatchesByValue.length; i++) {
      keysIds.push(valueMatchesByValue[i].keyId);
    }

    keysIds = [...new Set(keysIds)];

    const allMatchedKeys = await this.keyModel
      .find({
        id: { $in: keysIds },
        projectId,
      })
      .lean();

    const paths = allMatchedKeys.map(({ pathCache }) => pathCache);

    let allParentAndKeyIds = [];

    paths.forEach((path) => {
      const ids = path.replace('#/', '').split('/');

      allParentAndKeyIds = [...allParentAndKeyIds, ...ids];
    });

    allParentAndKeyIds = [...new Set([...allParentAndKeyIds, ...keysIds])];

    const allMatchesParents = await this.keyModel
      .find({
        id: { $in: allParentAndKeyIds },
        projectId,
      })
      .lean();

    const tree = this.KeyHelperService.buildHierarchy([...allMatchesParents], projectId);

    const [values] = await this.Service.getAggregatedValues(
      userId,
      projectId,
      allMatchedKeys.map(({ parentId }) => parentId),
      keysIds,
    );

    return {
      keys: tree,
      values,
    };
  }
}
