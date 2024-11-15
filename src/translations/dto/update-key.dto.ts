export class UpdateKeyDto {
  userId: string;
  id: string;
  projectId: string;
  parentId: string;
  label: string;
  description: string;
  values: [
    {
      id: string;
      languageId: string;
      value: string;
      userId: string;
      parentId: string;
      projectId: string;
      keyId: string;
    },
  ];
}
