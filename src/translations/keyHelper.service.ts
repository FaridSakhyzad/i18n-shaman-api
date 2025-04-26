import { Injectable } from '@nestjs/common';

@Injectable()
export class KeyHelperService {
  constructor() {}

  buildHierarchy(data, rootId) {
    const map = new Map();

    data.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    const result = [];

    data.forEach((item) => {
      if (item.parentId === rootId) {
        result.push(map.get(item.id));
      } else {
        const parent = map.get(item.parentId);

        if (parent) {
          parent.children.push(map.get(item.id));
        }
      }
    });

    return result;
  }

  buildHierarchyForExport(keysDataArray, valuesDataTree, rootId, languageId) {
    const map = new Map();

    keysDataArray.forEach((item) => {
      map.set(item.id, { ...item, children: {} });
    });

    const result = [
      {},
      {}
    ];

    keysDataArray.forEach((item) => {
      if (item.parentId === rootId) {
        const key = map.get(item.id);

        if (item.type === 'string') {
          const { value = '' } = valuesDataTree[key.id] && valuesDataTree[key.id][languageId] ? valuesDataTree[key.id][languageId] : {};

          result[0][key.label] = value;
        }

        if (item.type === 'folder') {
          result[0][key.label] = key.children;
        }

        if (item.type === 'component') {
          result[1][key.label] = key.children;
        }
      } else {
        const parent = map.get(item.parentId);

        if (parent) {
          const key = map.get(item.id);

          if (item.type === 'string') {
            const { value = '' } = valuesDataTree[key.id] && valuesDataTree[key.id][languageId] ? valuesDataTree[key.id][languageId] : {};

            parent.children[key.label] = value;
          }

          if (item.type === 'folder') {
            parent.children[key.label] = key.children;
          }
        }
      }
    });

    return result;
  }
}
