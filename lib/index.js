// homebridge-telldus-too/lib/index.js
// Copyright © 2022-2023 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

'use strict';

const TdPlatform = require('./TdPlatform');
const packageJson = require('../package.json');

module.exports = function (homebridge) {
  TdPlatform.loadPlatform(
    homebridge,
    packageJson,
    'TelldusToo',
    TdPlatform
  );
};
