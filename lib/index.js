// homebridge-telldus-too/lib/index.js
// Copyright © 2022-2023 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

'use strict';

import TdPlatform from './TdPlatform.js';
import packageJson from '../package.json';
// const TdPlatform = require('./TdPlatform');
// const packageJson = require('../package.json');

export default function (homebridge) {
  TdPlatform.loadPlatform(
    homebridge,
    packageJson,
    'TelldusToo',
    TdPlatform
  );
}
