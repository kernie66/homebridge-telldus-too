// checkStatusCode function
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//

import type { HttpResponse } from '../typings/HttpClientTypes.js';

// Function to check the HTTP status code when Telldus responds with an error
// Return true if the error is identified, else false
export default function checkStatusCode(response: HttpResponse, logger: Function = console.error) {
  // Check if it is a normal 200 response but with error instead of reply
  if (response.body.error) {
    logger('Telldus replies with error:', response.body.error);
  } else if (response.statusCode >= 400 && response.statusCode <= 499) {
    if (response.statusCode === 401) {
      logger('Access denied, check if the access token is valid');
    } else if (response.statusCode === 404) {
      logger('Host API not found, check if the host address is correct');
    } else if (response.statusCode === 408) {
      logger('Request timed out, check if the host address is correct');
    } else {
      logger('Telldus reports client error %s, %s', response.statusCode, response.statusMessage);
    }
  } else if (response.statusCode >= 500 && response.statusCode <= 599) {
    logger('Telldus reports server error %s, %s', response.statusCode, response.statusMessage);
  } else {
    return false;
  }
  return true;
}
