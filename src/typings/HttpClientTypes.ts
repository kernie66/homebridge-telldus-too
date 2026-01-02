// Type definitions for homebridge-lib/HttpClient

export interface HttpRequest {
  body: string;
  headers: {};
  id: number;
  method: string;
  name: string;
  resource: string;
  url: string;
}

export interface HttpResponse {
  body: {
    error: string;
  };
  headers: {};
  parsedBody: unknown;
  request: HttpRequest;
  statusCode: number;
  statusMessage: string;
  ok: boolean; // Added for simplified status check
}

export interface HttpError {
  request: HttpRequest;
  statusCode: number;
  statusMessage: string;
}
