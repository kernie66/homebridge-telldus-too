// makeURL.js
// Copyright © 2023-2025 Kenneth Jagenheim. All rights reserved.
//

const regExp = {
  http: /^http/,
  host: /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|(([A-Za-z0-9_-]+){1}(\.[A-Za-z0-9_-]+)*)/,
};

export default function makeURL(inputURL) {
  if (!inputURL) {
    throw new TypeError('makeURL: inputURL cannot be empty');
  }
  if (typeof inputURL !== 'string') {
    throw new TypeError('makeURL: not a string');
  }

  // Check if URL contains 'http', otherwise add it
  if (!regExp.http.test(inputURL)) {
    inputURL = 'http://' + inputURL;
  }

  // Check if the host seems to be a valid string
  if (regExp.host.test(inputURL)) {
    return inputURL;
  } else {
    return false;
  }
}
