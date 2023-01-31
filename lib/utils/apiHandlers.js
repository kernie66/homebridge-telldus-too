'use strict';

function errorHandler(error) {
  this.log(
    'Telldus request %d: Error = %s %s',
    error.request.id,
    error.request.method,
    error.request.resource
  );
  this.log(
    'Telldus request %d: Error = %d, %s',
    error.request.id,
    error.statusCode,
    error.statusMessage
  );
}

function requestHandler(request) {
  this.log(
    'Telldus request %d: Request = %s, Resource = %s',
    request.id,
    request.method,
    request.resource
  );
  this.log(
    'Telldus request %d: Request = %s, URL = %s',
    request.id,
    request.method,
    request.url
  );
}

function responseHandler(response) {
  this.log(
    'Telldus response %d: Status = %s, %s',
    response.request.id,
    response.statusCode,
    response.statusMessage
  );
  this.log(
    'Telldus response %d: Body = %s',
    response.request.id,
    response.body
  );
}

module.exports.errorHandler = errorHandler;
module.exports.requestHandler = requestHandler;
module.exports.responseHandler = responseHandler;
