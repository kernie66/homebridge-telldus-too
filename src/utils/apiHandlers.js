// homebridge-lib request handler functions
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//

'use strict';

export function errorHandler(error) {
  this.warn('Telldus request %d: Error = %s %s', error.request.id, error.request.method, error.request.resource);
  this.warn('Telldus request %d: Error = %d, %s', error.request.id, error.statusCode, error.statusMessage);
}

export function requestHandler(request) {
  this.debug('Telldus request %d: Request = %s, Resource = %s', request.id, request.method, request.resource);
  this.vdebug('Telldus request %d: Request = %s, URL = %s', request.id, request.method, request.url);
}

export function responseHandler(response) {
  this.debug('Telldus response %d: Status = %s, %s', response.request.id, response.statusCode, response.statusMessage);
  this.vdebug('Telldus response %d: Body = %s', response.request.id, response.body);
}
