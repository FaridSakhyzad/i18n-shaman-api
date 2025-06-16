export enum EStatusCode {
  OK = 200,
  Created = 201,
  Unauthorized = 401,
  Forbidden = 403,
  Not_Found = 404,
}

export interface IResponse {
  statusCode: EStatusCode;
  message?: string;
  metaData?: { [key: string]: any };
}
