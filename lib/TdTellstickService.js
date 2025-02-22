// homebridge-telldus-too/lib/TdTellstickService.js
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

import { homebridgeLib } from 'homebridge-lib';
import { getTimestamp, toEveDate } from './utils/dateTimeHelpers';
/*
const homebridgeLib = require('homebridge-lib');
const {
  toEveDate,
  getTimestamp,
} = require('./utils/dateTimeHelpers');
*/

class TellstickService extends homebridgeLib.ServiceDelegate {
  constructor(gateway, params = {}) {
    params.name = gateway.name;
    params.Service = gateway.Services.my.DeconzGateway;
    params.exposeConfiguredName = false;
    super(gateway, params);
    this.gateway = gateway;
    this.td = gateway.td;

    this.addCharacteristicDelegate({
      key: 'lastUpdated',
      Characteristic: this.Characteristics.my.LastUpdated,
      value: toEveDate(getTimestamp()),
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'tokenExpiration',
      Characteristic: this.td.Characteristics.TokenExpires,
      value: toEveDate(getTimestamp()),
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'nextRefresh',
      Characteristic: this.td.Characteristics.NextRefresh,
      value: toEveDate(getTimestamp()),
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: gateway.logLevel,
    });

    this.log('Tellstick service initialized');
  }
}

export default TellstickService;
