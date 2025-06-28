import { Document } from 'mongoose';
import { IKey } from './key.interface';

export interface IProject extends Document {
  projectName: string;
  projectId: string;
  userId: string;
  keys: IKey[];
  values?: any;
  languages: [];
  keysTotalCount?: number;
  upstreamParents?: any;
  subfolder?: IKey;
}

export interface ILanguage {
  id: string;
  label: string;
  code: string;
}

export interface IProjectLanguage extends ILanguage {
  baseLanguage: boolean;
  visible: boolean;
  customCodeEnabled: boolean;
  customLabelEnabled: boolean;
  customCode: string;
  customLabel: string;
}

export interface ILanguageMapItem {
  id: string;
  code: string;
  customCode: string;
  customCodeEnabled: boolean;
}

export interface ILanguageMap {
  [key: string]: ILanguageMapItem;
}

export enum EExportFormats {
  json = 'json',
  androidXml = 'android_xml',
  appleStrings = 'apple_string',
  phpArray = 'php_array',
}

export interface IStructuredProjectData {
  [locale: string]: object;
}

export interface IStructuredProjectLinearLocaleData {
  [locale: string]: object[];
}

export enum EFilter {
  hideEmpty = 'hideEmpty',
  hideNonEmpty = 'hideNonEmpty',
  hideFolders = 'hideFolders',
  hideComponents = 'hideComponents',
  hideKeys = 'hideKeys',
}
