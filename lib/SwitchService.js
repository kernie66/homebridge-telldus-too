// homebridge-telldus-too/lib/SwitchService.js
// Copyright © 2022-2023 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus switches.

'use strict';

const homebridgeLib = require('homebridge-lib');
const telldus = require('./TdConstants');
const checkStatusCode = require('./utils/checkStatusCode');
const {
  toEveDate,
  getTimestamp,
} = require('./utils/dateTimeHelpers');
const { wait, stateToText } = require('./utils/utils');
// const { setTimeout } = require('node:timers/promises')

class SwitchService extends homebridgeLib.ServiceDelegate {
  constructor(switchAccessory, params = {}) {
    params.name = switchAccessory.name;
    // If it is a dimmer, set service to lightbulb, else switch
    if (switchAccessory.modelType === 'dimmer') {
      params.Service = switchAccessory.Services.hap.Lightbulb;
    } else {
      params.Service = switchAccessory.Services.hap.Switch;
    }
    super(switchAccessory, params);
    this.deviceId = switchAccessory.deviceId;
    this.model = switchAccessory.model;
    this.modelType = switchAccessory.modelType;
    this.random = switchAccessory.random;
    this.delay = switchAccessory.delay;
    this.repeats = switchAccessory.repeats;
    this.heartrate = switchAccessory.heartrate;
    this.td = switchAccessory.td;
    this.state = switchAccessory.state;
    this.stateCache = switchAccessory.stateCache;
    this.telldusApi = switchAccessory.telldusApi;
    this.timeout = params.timeout;

    this.addCharacteristicDelegate({
      key: 'on',
      Characteristic: this.Characteristics.hap.On,
      value: this.state == telldus.TURNON,
    })
      .on('didSet', (value) => {
        this.values.repetition = 0;
        if (!this.values.disabled && !this.values.enabled) {
          this.switchOn = value;
          this.setOn(switchAccessory);
        } else {
          this.log(
            'Switch constantly disabled/enabled, deactivate it to turn it on/off!'
          );
        }
      })
      .on('didTouch', (value) => {
        this.values.repetition = 0;
        if (!this.values.disabled && !this.values.enabled) {
          this.switchOn = value;
          this.log("Repeat 'setOn' with value %s", this.switchOn);
          this.setOn(switchAccessory);
        } else {
          this.log(
            'Switch constantly disabled/enabled (touched), deactivate it to turn it on/off!'
          );
        }
      });

    // Add brightness characteristics to dimmer device
    if (this.modelType === 'dimmer') {
      this.debug('Adding brightness to dimmer device');
      this.addCharacteristicDelegate({
        key: 'brightness',
        value: 100,
        unit: '%',
        Characteristic: this.Characteristics.hap.Brightness,
      }).on('didSet', (value) => {
        this.debug('Brightness value', value);
        this.setDimmerLevel(switchAccessory, value);
      });
    }

    this.addCharacteristicDelegate({
      key: 'random',
      value: this.random,
      Characteristic: this.td.Characteristics.Random,
    });

    this.addCharacteristicDelegate({
      key: 'enableRandomOnce',
      value: false,
      Characteristic: this.td.Characteristics.EnableRandomOnce,
    }).on('didSet', (value) => {
      if (value) {
        this.values.disableRandomOnce = false;
      }
    });

    this.addCharacteristicDelegate({
      key: 'disableRandomOnce',
      value: false,
      Characteristic: this.td.Characteristics.DisableRandomOnce,
    }).on('didSet', (value) => {
      if (value) {
        this.values.enableRandomOnce = false;
      }
    });

    this.addCharacteristicDelegate({
      key: 'delay',
      value: this.delay,
      Characteristic: this.td.Characteristics.Delay,
    });

    this.addCharacteristicDelegate({
      key: 'repeats',
      value: this.repeats,
      Characteristic: this.td.Characteristics.Repeats,
    });

    this.addCharacteristicDelegate({
      key: 'repetition',
      value: 0,
      Characteristic: this.td.Characteristics.Repetition,
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'disabled',
      value: false,
      Characteristic: this.td.Characteristics.Disabled,
    }).on('didSet', (value) => {
      if (value && !this.values.enabled) {
        this.values.on = false;
        this.switchOn = false;
        this.setOn(switchAccessory);
      } else {
        wait(250);
        this.values.disabled = false;
      }
    });

    this.addCharacteristicDelegate({
      key: 'enabled',
      value: false,
      Characteristic: this.td.Characteristics.Enabled,
    }).on('didSet', (value) => {
      if (value && !this.values.disabled) {
        this.values.on = true;
        this.switchOn = true;
        this.setOn(switchAccessory);
      } else {
        wait(250);
        this.values.enabled = false;
      }
    });

    this.addCharacteristicDelegate({
      key: 'status',
      Characteristic: this.td.Characteristics.Status,
      value: 'Initialised',
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

  async setConfigValues() {
    this.values.delay = this.delay;
    this.values.random = this.random;
    this.values.repeats = this.repeats;
    this.values.heartrate = this.heartrate;
    await wait(500);
    this.values.setDefault = false;
  }

  async setOn(switchAccessory) {
    let userControl = false;
    let newValue = this.switchOn !== this.lastSwitchOn;
    let randomDelay;
    this.lastSwitchOn = this.switchOn;
    this.onUpdated = true;

    // Wait to let other values settle
    await wait(50);
    randomDelay = this.values.enableRandomOnce
      ? true
      : this.values.random;
    randomDelay = this.values.disableRandomOnce ? false : randomDelay;

    // Reset single activation controls
    this.values.enableRandomOnce = false;
    this.values.disableRandomOnce = false;

    // Check if the switch was recently activated
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      // If active timeout and new value, we assume that it is user controlled
      userControl = newValue;
      this.activeTimeout = null;
      this.debug('Switch mute aborted');
    }
    this.log(
      'User %s, random %s, new %s',
      userControl,
      randomDelay,
      newValue
    );
    if (this.timerActive) {
      try {
        this.log('Aborting the timer before time is up');
        this.ac.abort();
      } catch (e) {
        this.warn('Error when aborting timer: %s', e.message);
      }
      this.timerActive = false;
    }

    if (newValue) {
      const key = 'ID' + switchAccessory.deviceId;
      const value = this.switchOn ? telldus.TURNON : telldus.TURNOFF;
      const success = switchAccessory.stateCache.set(key, value);
      if (success) {
        this.debug(
          'State cache set for %s with value [%s]',
          key,
          stateToText(value)
        );
      } else {
        this.warn("Cache couldn't be updated for", key);
      }
    }

    // Check if this is assumed to be a user controlled action
    if (userControl) {
      if (this.repeatTimeout) {
        clearTimeout(this.repeatTimeout);
        this.values.repetition = 0;
      }
      this.values.status = 'Manually controlled';
      await wait(50);
    } else {
      const minDelay = this.values.delay * 0.2;
      const delayRange = this.values.delay - minDelay;
      let delay = 100;
      this.ac = new AbortController();
      this.signal = this.ac.signal;
      if (this.values.repetition === 0) {
        if (randomDelay) {
          delay =
            Math.floor(minDelay + Math.random() * delayRange) * 1000;
        }
        this.log('Waiting for %d seconds', delay / 1000);
        this.timerActive = true;
        this.values.status = 'Delaying';
        try {
          await wait(delay, { signal: this.signal });
        } catch (err) {
          this.warn('Delay timer aborted:', err);
          this.timerActive = false;
          return;
        }
        this.timerActive = false;
        this.log('Delay performed');
      }
    }

    // Control Telldus switch on/off
    const response = await this.telldusApi.onOffDevice(
      switchAccessory.deviceId,
      this.switchOn
    );
    if (!response.ok) {
      checkStatusCode(response);
    }
    this.values.lastActivation = toEveDate(getTimestamp());

    if (!userControl) {
      // Wait one minute before updating cache from Telldus after switch set
      this.activeTimeout = setTimeout(() => {
        this.onUpdated = false;
        this.activeTimeout = null;
        this.log('Switch mute ends');
      }, 60 * 1000);

      if (this.values.repetition < this.values.repeats) {
        // Wait for the next attempt, 3 + 'repetition' s
        this.repeatTimeout = setTimeout(() => {
          this.values.repetition += 1;
          this.log(
            'Repeat command, repetition number: %d of %d',
            this.values.repetition,
            this.values.repeats
          );
          this.setOn(switchAccessory);
          this.values.on = this.switchOn;
          this.repeatTimeout = null;
        }, 3000 + this.values.repetition * 1000);
        this.values.status = 'Repeating';
      } else {
        this.values.repetition = 0;
        this.values.status = 'Automation done';
      }
    }
  }

  // Function to set a new dim level. The function will wait 1 second
  // and abort the command if a new command is received before that.
  // This minimises the number of commands if the level slider is
  // used in Eve to set the dimmer.
  // The dimmer is turned on automatically if it was off, so the delay
  // ensures that the dim command will be sent after the on command.
  async setDimmerLevel(switchAccessory, dimLevel) {
    // If a dim command is pending, abort it
    if (this.dimming) {
      this.ac.abort();
    }
    this.dimming = true;
    this.ac = new AbortController();
    this.signal = this.ac.signal;
    // Start a timer for the new dim command
    try {
      await wait(1000, { signal: this.signal });
      this.debug('Setting dimmer level to %s%', dimLevel);
      const response = this.telldusApi.dimDevice(
        switchAccessory.deviceId,
        dimLevel
      );
      if (!response.ok) {
        checkStatusCode(response);
        this.warn('Error when setting dim level');
      }
      this.dimming = false;
    } catch (err) {
      if (!err.message) {
        this.log('The current timer was stopped');
      } else {
        this.warn('The timer was aborted! %s', err.message);
      }
    }
  }
}

module.exports = SwitchService;
