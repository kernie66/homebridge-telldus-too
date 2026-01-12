import type { HttpResponse } from '../typings/HttpClientTypes.js';

export interface RequestResponse extends HttpResponse {
  ok: boolean;
}

export type RefreshTokenResponse = {
  expires: number;
  token: string;
  error?: string;
};
