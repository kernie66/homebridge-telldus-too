// homebridge-telldus-too/lib/TellstickService.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type TdTellstickAccessory from './TdTellstickAccessory.js';
import { getTimestamp, toEveDate } from './utils/dateTimeHelpers.js';

interface TellstickServiceParams {
  name: string;
  Service?: unknown;
  exposeConfiguredName?: boolean;
  primaryService?: boolean;
}

type TellstickServiceValues = {
  lastUpdated: string;
  tokenExpiration: string;
  nextRefresh: string;
  logLevel: number;
};
class TellstickService extends ServiceDelegate<TellstickServiceValues> {
  gateway: TdTellstickAccessory;
  td: TdTellstickAccessory['td'];

  constructor(gateway: TdTellstickAccessory, params: TellstickServiceParams) {
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
