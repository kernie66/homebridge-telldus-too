// homebridge-telldus-too/lib/index.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

import type { API } from 'homebridge';
import packageJson from '../package.json' with { type: 'json' };

import TdPlatform from './TdPlatform.js';

export default function (homebridge: API) {
  TdPlatform.loadPlatform(homebridge, packageJson, 'TelldusToo', TdPlatform);
}
