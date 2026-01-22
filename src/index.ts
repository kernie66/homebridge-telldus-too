// homebridge-telldus-too/lib/index.js
// Copyright © 2022-2023 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

import { createRequire } from 'node:module';
import type { API } from 'homebridge';
import packageJson from '../package.json';
import TdPlatform from './TdPlatform.js';

//const require = createRequire(import.meta.url);
//const packageJson = require('../package.json');

// const TdPlatform = require('./TdPlatform');
// const packageJson = require('../package.json');

export default function (homebridge: API) {
  TdPlatform.loadPlatform(homebridge, packageJson, 'TelldusToo', TdPlatform);
}
