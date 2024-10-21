export class LanguageVisibilityPartialDto {
  languageId: string;
  visible: boolean;
}

export class MultipleLanguageVisibilityDto {
  projectId: string;
  data: LanguageVisibilityPartialDto[];
}
