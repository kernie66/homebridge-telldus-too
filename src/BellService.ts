// homebridge-telldus-too/lib/BellService.ts
// Copyright © 2023-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus bell switches.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type TelldusApi from './api/TelldusApi.js';
import type TdMyCustomTypes from './TdMyCustomTypes.js';
import type TdSwitchAccessory from './TdSwitchAccessory.js';
import type { SwitchServiceParams } from './typings/SwitchTypes.js';
import { getTimestamp, toEveDate } from './utils/dateTimeHelpers.js';
import handleError from './utils/handleError.js';
import noResponseError from './utils/noResponseError.js';
import { wait } from './utils/utils.js';

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
  handleError: typeof handleError;

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
    this.handleError = handleError;

    this.addCharacteristicDelegate({
      key: 'bell',
      Characteristic: this.Characteristics.hap.On,
      value: false,
    }).on('didSet', (value: boolean) => {
      if (!this.values.disabled) {
        this.bellOn = value;
        this.setBell();
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

  async setBell() {
    if (this.bellOn) {
      try {
        // Send bell command to device if switch activated
        const response = await this.telldusApi.bellDevice(this.deviceId);
        if (response.ok && noResponseError(response, this.error)) {
          this.values.lastActivation = toEveDate(getTimestamp());
          await wait(500);
          this.values.bell = false;
        } else {
          throw new Error(`Response error (${response.statusCode}) ${response.statusMessage}`);
        }
      } catch (error) {
        this.handleError({
          error,
          reason: `Error getting bell command response from device ID ${this.deviceId}`,
        });
      }
    }
  }
}

export default BellService;
