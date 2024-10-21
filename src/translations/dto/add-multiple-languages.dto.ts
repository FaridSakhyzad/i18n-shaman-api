import { AddLanguageDto } from './add-language.dto';

export class AddMultipleLanguagesDto {
  projectId: string;
  languages: AddLanguageDto[];
}
