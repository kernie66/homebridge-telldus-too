'use strict';

// Function to check the HTTP status code when Telldus responds with an error
// Return true if the error is identified, else false
function checkStatusCode(response) {
  // Check if it is a normal 200 response but with error instead of reply
  if (response.body.error) {
    this.error('Telldus replies with error:', response.body.error);
  } else if (
    response.statusCode >= 400 &&
    response.statusCode <= 499
  ) {
    if (response.statusCode == 401) {
      this.error('Access denied, check if the access token is valid');
    } else if (response.statusCode == 404) {
      this.error(
        'Host API not found, check if the host address is correct'
      );
    } else if (response.statusCode == 408) {
      this.error(
        'Request timed out, check if the host address is correct'
      );
    } else {
      this.error(
        'Telldus reports client error %s, %s',
        response.statusCode,
        response.statusMessage
      );
    }
  } else if (
    response.statusCode >= 500 &&
    response.statusCode <= 599
  ) {
    this.error(
      'Telldus reports server error %s, %s',
      response.statusCode,
      response.statusMessage
    );
  } else {
    return false;
  }
  return true;
}

module.exports = checkStatusCode;
