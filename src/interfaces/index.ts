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

export type IsoDateTime = string; // ISO 8601

export type PaginationMeta = {
  page?: number;
  perPage?: number;
  total?: number;
  nextCursor?: string | null;
  prevCursor?: string | null;
};

export type Meta = {
  [k: string]: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: Meta;
  requestId: string;
  correlationId?: string;
  path: string;
  timestamp: IsoDateTime;
  version?: string;
};

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: Array<{ field: string; message: string; code?: string }>;
  requestId?: string;
  correlationId?: string;
  timestamp: IsoDateTime;
};
