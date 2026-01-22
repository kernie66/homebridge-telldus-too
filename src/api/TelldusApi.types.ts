import type { HttpResponse } from '../typings/HttpClientTypes.js';

export interface RequestResponse<T> extends HttpResponse<T> {
  ok: boolean;
}

export type RefreshTokenResponse = {
  expires: number;
  token: string;
  error?: string;
};
