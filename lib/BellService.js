// homebridge-telldus-too/lib/BellService.js
// Copyright © 2023 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus bell switches.

'use strict';

const homebridgeLib = require('homebridge-lib');
const { setDevice, dimDevice } = require('./TdApi');
const telldus = require('./TdConstants');
const {
  toEveDate,
  getTimestamp,
} = require('./utils/dateTimeHelpers');
const { wait, stateToText } = require('./utils/utils');
// const { setTimeout } = require('node:timers/promises')

class BellService extends homebridgeLib.ServiceDelegate {
  constructor(switchAccessory, params = {}) {
    params.name = switchAccessory.name;
    // If it is a dimmer, set service to lightbulb, else switch
    params.Service = switchAccessory.Services.hap.Switch;
    super(switchAccessory, params);
    this.deviceId = switchAccessory.deviceId;
    this.model = switchAccessory.model;
    this.modelType = switchAccessory.modelType;
    this.heartrate = switchAccessory.heartrate;
    this.td = switchAccessory.td;
    this.api = switchAccessory.api;
    this.timeout = params.timeout;

    this.addCharacteristicDelegate({
      key: 'bell',
      Characteristic: this.Characteristics.hap.On,
      value: false,
    }).on('didSet', (value) => {
      if (!this.values.disabled) {
        this.switchOn = value;
        this.setOn(switchAccessory);
      } else {
        this.log(
          'Bell disabled, enable it to be able to turn it on!'
        );
      }
    });

    this.addCharacteristicDelegate({
      key: 'disabled',
      value: false,
      Characteristic: this.td.Characteristics.Disabled,
    }).on('didSet', (value) => {
      if (value) {
        this.switchOn = false;
        this.setOn(switchAccessory);
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

  async setOn(switchAccessory) {
    const response = await setDevice(
      this.api,
      switchAccessory.deviceId,
      this.switchOn
    );
    this.values.lastActivation = toEveDate(getTimestamp());
    wait(500);
    this.values.bell = false;
  }
}

module.exports = BellService;
