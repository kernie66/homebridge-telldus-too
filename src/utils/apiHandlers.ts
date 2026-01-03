// homebridge-lib request handler functions
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
import type { HttpError, HttpRequest, HttpResponse } from '../typings/HttpClientTypes.js';
import type { ThisLoggers } from '../typings/thisTypes.js';

export function errorHandler(this: ThisLoggers, error: HttpError) {
  this.warn('Telldus request %d: Error = %s %s', error.request.id, error.request.method, error.request.resource);
  this.warn('Telldus request %d: Error = %d, %s', error.request.id, error.statusCode, error.statusMessage);
}

export function requestHandler(this: ThisLoggers, request: HttpRequest) {
  this.debug('Telldus request %d: Request = %s, Resource = %s', request.id, request.method, request.resource);
  this.vdebug('Telldus request %d: Request = %s, URL = %s', request.id, request.method, request.url);
}

export function responseHandler(this: ThisLoggers, response: HttpResponse) {
  this.debug('Telldus response %d: Status = %s, %s', response.request.id, response.statusCode, response.statusMessage);
  this.vdebug('Telldus response %d: Body = %s', response.request.id, response.body);
}
