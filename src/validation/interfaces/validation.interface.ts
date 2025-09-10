export const PASSWORD_MIN_LENGTH = 6;

export enum EEntityValidationErrors {
  DUPLICATE_KEY = 'Key name already exist. Please Enter Unique Key Name',
}

export enum EValidationErrors {
  THIS_FIELD_REQUIRED = 'This field is required.',
}

export enum EPasswordValidationErrors {
  INVALID = 'Error: Invalid Password',
  TOO_SHORT = 'The password must be at least 6 characters.',
  TOO_WEAK = 'Password must contain letters in mixed case, a number and a special symbol',
  PASSWORDS_DONT_MATCH = "Error: Passwords don't match.",
  BOTH_PASSWORDS_REQUIRED = 'Both Password fields are required.',
  PASSWORD_REQUIRED = 'Password field is required.',
}

export enum EEmailValidationErrors {
  INVALID = 'Error: Invalid Email address',
}

export type CombinedValidationMessage = EEmailValidationErrors | EPasswordValidationErrors | EEntityValidationErrors;

export interface IValidationResponseError {
  message: CombinedValidationMessage;
}

export interface IValidationResponse {
  success: boolean;
  errors: IValidationResponseError[];
  warnings?: any[];
}
