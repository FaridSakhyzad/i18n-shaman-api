export class UpdateKeyDto {
  userId: string;
  id: string;
  projectId: string;
  label: string;
  description: string;
  values: [
    {
      id: string;
      languageId: string;
      value: string;
    },
  ];
}
