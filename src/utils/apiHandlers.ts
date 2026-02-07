// homebridge-lib request handler functions
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
import type { Delegate } from 'homebridge-lib/Delegate';
import type { ResponseBodyError } from '../api/TelldusApi.types.js';

// Note that 'this' as the first parameter is required for TypeScript to correctly type the 'this' context
// in the function when it is called as a method of an object.
export function errorHandler(this: Delegate, error: HttpError) {
  this.warn('Telldus request %d: Error = %s %s', error.request.id, error.request.method, error.request.resource);
  this.warn('Telldus request %d: Error = %d, %s', error.request.id, error.statusCode, error.statusMessage);
}

export function requestHandler(this: Delegate, request: HttpRequest) {
  this.debug('Telldus request %d: Request = %s, Resource = %s', request.id, request.method, request.resource);
  this.vdebug('Telldus request %d: Request = %s, URL = %s', request.id, request.method, request.url);
}

export function responseHandler(this: Delegate, response: HttpResponse<ResponseBodyError>) {
  this.debug('Telldus response %d: Status = %s, %s', response.request.id, response.statusCode, response.statusMessage);
  this.vdebug('Telldus response %d: Body = %s', response.request.id, response.body);
}
