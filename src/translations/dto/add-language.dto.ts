export class AddLanguageDto {
  projectId: string;
  id: string;
  label: string;
  code: string;
  baseLanguage: boolean;
  visible: boolean;
  customCodeEnabled?: boolean;
  customLabelEnabled?: boolean;
  customCode?: string;
  customLabel?: string;
}
