export class UpdateKeyDto {
  userId: string;
  id: string;
  label: string;
  description: string;
  values: [
    {
      languageId: string;
      value: string;
    },
  ];
}
