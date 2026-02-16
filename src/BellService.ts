// homebridge-telldus-too/lib/BellService.ts
// Copyright © 2023-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus bell switches.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type TelldusApi from './api/TelldusApi.js';
import type TdMyCustomTypes from './TdMyCustomTypes.js';
import type TdSwitchAccessory from './TdSwitchAccessory.js';
import type { SwitchServiceParams } from './typings/SwitchTypes.js';
import checkStatusCode from './utils/checkStatusCode.js';
import { getTimestamp, toEveDate } from './utils/dateTimeHelpers.js';
import { wait } from './utils/utils.js';

/*
const homebridgeLib = require('homebridge-lib');
const checkStatusCode = require('./utils/checkStatusCode');
const {
  toEveDate,
  getTimestamp,
} = require('./utils/dateTimeHelpers');
const { wait } = require('./utils/utils');
// const { setTimeout } = require('node:timers/promises')
*/

type BellServiceValues = {
  bell: boolean;
  disabled: boolean;
  lastActivation: string;
  heartrate: number;
  logLevel: number;
};

class BellService extends ServiceDelegate<BellServiceValues> {
  deviceId: number;
  model: string;
  modelType: string;
  heartrate: number;
  td: TdMyCustomTypes;
  telldusApi: TelldusApi;
  timerActive: boolean;
  activeTimeout: NodeJS.Timeout | null;
  bellOn: boolean = false;

  constructor(switchAccessory: TdSwitchAccessory, params: SwitchServiceParams) {
    params.name = switchAccessory.name;
    // If it is a dimmer, set service to lightbulb, else switch
    params.Service = switchAccessory.Services.hap.Switch;
    super(switchAccessory, params);
    this.deviceId = switchAccessory.deviceId;
    this.model = switchAccessory.model;
    this.modelType = switchAccessory.modelType;
    this.heartrate = switchAccessory.heartrate;
    this.td = switchAccessory.td;
    this.telldusApi = switchAccessory.telldusApi;

    this.addCharacteristicDelegate({
      key: 'bell',
      Characteristic: this.Characteristics.hap.On,
      value: false,
    }).on('didSet', (value: boolean) => {
      if (!this.values.disabled) {
        this.bellOn = value;
        this.setBell(switchAccessory);
      } else {
        this.log('Bell disabled, enable it to be able to turn it on!');
      }
    });

    this.addCharacteristicDelegate({
      key: 'disabled',
      value: false,
      Characteristic: this.td.Characteristics.Disabled,
    }).on('didSet', (value: boolean) => {
      if (value) {
        // this.setOn(switchAccessory);
      }
    });

    this.addCharacteristicDelegate({
      key: 'lastActivation',
      Characteristic: this.td.Characteristics.LastActivation,
      value: 'Not activated since start',
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      props: {
        minValue: 1,
        maxValue: 300,
        minStep: 1,
      },
      value: this.heartrate,
    });

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: switchAccessory.logLevel,
    });

    // Make sure we have a clean start, no abort controllers
    this.timerActive = false;
    this.activeTimeout = null;
  }

  async setBell(switchAccessory: TdSwitchAccessory) {
    if (this.bellOn) {
      // Send bell command to device if switch activated
      const response = await this.telldusApi.bellDevice(switchAccessory.deviceId);
      if (!response.ok) {
        checkStatusCode(response, this.error);
      }
      this.values.lastActivation = toEveDate(getTimestamp());
      wait(500);
      this.values.bell = false;
    }
  }
}

export default BellService;
