import { describe, expect, it } from 'vite-plus/test';

import { ResponseBodyError, ResponseBodySuccess } from '../../api/TelldusApi.types.js';
import noResponseError from '../noResponseError.js';

// oxlint-disable unicorn/consistent-function-scoping

describe('Test Telldus API status code checker', () => {
  it('checks a normal 200 response', () => {
    const response: HttpResponse<ResponseBodySuccess> = {
      statusCode: 200,
      statusMessage: 'OK',
      body: {
        reply: 'success',
      },
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };

    const checkedResponse = noResponseError(response);
    expect(checkedResponse).toBeTruthy();
  });

  it('checks a 200 response with error in body', () => {
    const response: HttpResponse<ResponseBodyError> = {
      statusCode: 200,
      statusMessage: 'OK',
      body: {
        error: 'Some error occurred',
      },
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Telldus replies with error:');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });

  it('checks a 401 Unauthorized response', () => {
    const response: HttpResponse<ResponseBodyError> = {
      statusCode: 401,
      statusMessage: 'Unauthorized',
      body: {},
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Access denied, check if the access token is valid');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });

  it('checks a 404 Not Found response', () => {
    const response: HttpResponse<ResponseBodyError> = {
      statusCode: 404,
      statusMessage: 'Not Found',
      body: {},
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Host API not found, check if the host address is correct');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });

  it('checks a 408 Request Timeout response', () => {
    const response: HttpResponse<ResponseBodyError> = {
      statusCode: 408,
      statusMessage: 'Request Timeout',
      body: {},
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Request timed out, check if the host address is correct');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });

  it('checks other 4xx status codes response', () => {
    const response: HttpResponse<ResponseBodyError> = {
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      body: {},
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Telldus reports client error %s, %s');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });

  it('checks 5xx status codes response', () => {
    const response: HttpResponse<ResponseBodyError> = {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      body: {},
      request: {
        name: 'GET',
        url: 'https://api.telldus.com/some-endpoint',
        id: 12_345,
        method: 'GET',
        resource: '/some-endpoint',
        headers: {},
        body: 'request body',
      },
      headers: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Telldus reports server error %s, %s');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });
});
