import { describe, it } from 'vitest';
import noResponseError from '../noResponseError';

describe('Test Telldus API status code checker', () => {
  it('checks a normal 200 response', () => {
    const response = {
      statusCode: 200,
      statusMessage: 'OK',
      body: {
        reply: 'success',
      },
    };

    const checkedResponse = noResponseError(response);
    expect(checkedResponse).toBeTruthy();
  });

  it('checks a 200 response with error in body', () => {
    const response = {
      statusCode: 200,
      statusMessage: 'OK',
      body: {
        error: 'Some error occurred',
      },
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Telldus replies with error:');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });

  it('checks a 401 Unauthorized response', () => {
    const response = {
      statusCode: 401,
      statusMessage: 'Unauthorized',
      body: {},
    };
    const logger = (message: string) => {
      // console.log('Logger message:', message);
      expect(message).toBe('Access denied, check if the access token is valid');
    };
    const checkedResponse = noResponseError(response, logger);
    expect(checkedResponse).toBeFalsy();
  });
});
