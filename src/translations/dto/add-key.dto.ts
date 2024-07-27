export class AddKeyDto {
  userId: string;
  projectId: string;
  id: string;
  label: string;
  values: [
    {
      id: string;
      languageId: string;
      value: string;
    },
  ];
}
