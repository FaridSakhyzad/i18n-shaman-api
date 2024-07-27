export class UpdateKeyDto {
  userId: string;
  id: string;
  label: string;
  values: [
    {
      languageId: string;
      value: string;
    },
  ];
}
