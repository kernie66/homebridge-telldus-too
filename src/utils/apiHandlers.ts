// homebridge-lib request handler functions
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
import type { Logging } from 'homebridge';
import type { HttpError, HttpRequest, HttpResponse } from '../typings/HttpClientTypes.js';

interface HBLibLogging extends Logging {
  vdebug: Logging['debug'];
  vvdebug: Logging['debug'];
}

export function errorHandler(this: Logging, error: HttpError) {
  this.warn('Telldus request %d: Error = %s %s', error.request.id, error.request.method, error.request.resource);
  this.warn('Telldus request %d: Error = %d, %s', error.request.id, error.statusCode, error.statusMessage);
}

export function requestHandler(this: HBLibLogging, request: HttpRequest) {
  this.debug('Telldus request %d: Request = %s, Resource = %s', request.id, request.method, request.resource);
  this.vdebug('Telldus request %d: Request = %s, URL = %s', request.id, request.method, request.url);
}

export function responseHandler(this: HBLibLogging, response: HttpResponse) {
  this.debug('Telldus response %d: Status = %s, %s', response.request.id, response.statusCode, response.statusMessage);
  this.vdebug('Telldus response %d: Body = %s', response.request.id, response.body);
}
