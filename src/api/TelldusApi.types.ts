import type { HttpError, HttpRequest } from '../typings/HttpClientTypes.js';

export type RequestResponse = {
  ok: boolean;
  body: {};
  request: HttpRequest;
  statusCode: number;
  statusMessage: string;
  error?: HttpError;
};

export type RefreshTokenResponse = {
  expires: number;
  token: string;
  error?: string;
};
