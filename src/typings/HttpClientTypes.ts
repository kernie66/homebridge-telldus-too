// Type definitions for homebridge-lib/HttpClient

export interface HttpRequest {
  body: {};
  headers: {};
  id: number;
  method: string;
  name: string;
  resource: string;
  url: string;
}

export type ResponseBodyError = {
  error?: string;
};

export interface HttpResponse<T = ResponseBodyError> {
  body: T;
  headers: {};
  parsedBody: unknown;
  request: HttpRequest;
  statusCode: number;
  statusMessage: string;
  ok?: boolean;
}

export interface HttpError {
  request: HttpRequest;
  statusCode: number;
  statusMessage: string;
}
