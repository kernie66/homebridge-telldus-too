// homebridge-telldus-too/lib/SwitchService.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus switches.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type NodeCache from 'node-cache';
import colors from 'yoctocolors';
import type TelldusApi from './api/TelldusApi.js';
import { FULL_COMMANDS } from './TdConstants.js';
import type { MyTelldusTypes, SwitchAccessoryType, SwitchServiceParams } from './typings/SwitchTypes.js';
import checkStatusCode from './utils/checkStatusCode.js';
import { getTimestamp, toEveDate } from './utils/dateTimeHelpers.js';
import { getErrorMessage, stateToText, wait } from './utils/utils.js';

class SwitchService extends ServiceDelegate {
  deviceId: string;
  model: string;
  modelType: string;
  random: number;
  delay: number;
  repeats: number;
  heartrate: number;
  td: MyTelldusTypes;
  state: number;
  stateCache: unknown;
  telldusApi: TelldusApi;
  switchMuteTime: number;
  timeout: number;
  switchOn: boolean = false;
  lastSwitchOn: boolean = false;
  acDelay: AbortController;
  acDelaySignal: AbortSignal;
  acDelayActive: boolean;
  acRepeat: AbortController;
  acRepeatSignal: AbortSignal;
  acRepeatActive: boolean;
  acDim: AbortController;
  acDimSignal: AbortSignal;
  acDimActive: boolean = false;
  timerActive: boolean;
  activeTimeout: NodeJS.Timeout | null;
  endStatus: 'Not activated' | 'Manually controlled' | 'Automation done' = 'Not activated' as const;
  /*  deviceId: string;
  model: string;
  modelType: string;
  random: number;
  delay: number;
  repeats: number;
  heartrate: number;
  td: MyTelldusTypes;
  state: number;
  stateCache: NodeCache;
  telldusApi: TelldusApi;
  switchMuteTime: number;
  timeout: number;
*/
  constructor(switchAccessory: SwitchAccessoryType, params: SwitchServiceParams) {
    params.name = switchAccessory.name;
    // If it is a dimmer, set service to lightbulb, else switch
    if (switchAccessory.modelType === 'dimmer' || params.lightbulb) {
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
    this.switchMuteTime = switchAccessory.platformBeatRate * 2;
    this.timeout = params.timeout;
    this.log = switchAccessory.log;
    this.debug = switchAccessory.debug;
    this.warn = switchAccessory.warn;
    this.error = switchAccessory.error;
    this.acDelay = new AbortController();
    this.acDelaySignal = this.acDelay.signal;
    this.acDelayActive = false;
    this.acRepeat = new AbortController();
    this.acRepeatSignal = this.acRepeat.signal;
    this.acRepeatActive = false;
    this.acDim = new AbortController();
    this.acDimSignal = this.acDim.signal;

    this.addCharacteristicDelegate({
      key: 'on',
      Characteristic: this.Characteristics.hap.On,
      value: this.state === FULL_COMMANDS.TURNON,
    })
      .on('didSet', (value: boolean) => {
        this.values.repetition = 0;
        if (!this.values.disabled && !this.values.enabled) {
          this.switchOn = value;
          this.setOn(switchAccessory);
        } else {
          this.log('Switch constantly disabled/enabled,', colors.green('deactivate it to turn it on/off!'));
        }
      })
      .on('didTouch', (value: boolean) => {
        this.values.repetition = 0;
        if (!this.values.disabled && !this.values.enabled) {
          if (this.modelType !== 'dimmer') {
            this.switchOn = value;
            this.log("Repeat 'setOn' with value %s", this.switchOn);
            this.setOn(switchAccessory);
          } else {
            this.log("Skipping repeat 'setOn' for dimmer");
          }
        } else {
          this.log('Switch constantly disabled/enabled (touched),', colors.green('deactivate it to turn it on/off!'));
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
      }).on('didSet', (value: number) => {
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
    }).on('didSet', (value: boolean) => {
      if (value) {
        this.values.disableRandomOnce = false;
      }
    });

    this.addCharacteristicDelegate({
      key: 'disableRandomOnce',
      value: false,
      Characteristic: this.td.Characteristics.DisableRandomOnce,
    }).on('didSet', (value: boolean) => {
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
    }).on('didSet', (value: boolean) => {
      if (value && !this.values.enabled) {
        this.values.on = false;
        this.switchOn = false;
        this.setOn(switchAccessory);
      } else {
        wait(200);
        this.values.disabled = false;
      }
    });

    this.addCharacteristicDelegate({
      key: 'enabled',
      value: false,
      Characteristic: this.td.Characteristics.Enabled,
    }).on('didSet', (value: boolean) => {
      if (value && !this.values.disabled) {
        this.values.on = true;
        this.switchOn = true;
        this.setOn(switchAccessory);
      } else {
        wait(200);
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

  async setOn(switchAccessory: SwitchAccessoryType) {
    const newValue = this.switchOn !== this.lastSwitchOn;
    this.lastSwitchOn = this.switchOn;
    // If active update and new value, we assume that it is user controlled
    const userControl = switchAccessory.onUpdating ? newValue : false;
    switchAccessory.onUpdating = true;

    // Wait to let other values settle
    await wait(50);
    let randomDelay = this.values.random;
    randomDelay = this.values.enableRandomOnce ? true : randomDelay;
    randomDelay = this.values.disableRandomOnce ? false : randomDelay;

    // Reset single activation controls
    this.values.enableRandomOnce = false;
    this.values.disableRandomOnce = false;

    // Check if the switch was recently activated
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
      this.debug('Switch mute aborted');
    }

    // Check if the delay abort controller is active
    if (this.acDelayActive) {
      try {
        this.debug('Aborting the delay timer before time is up');
        this.acDelay.abort();
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.warn('Error when aborting delay timer: %s', errorMessage);
      }
      this.acDelayActive = false;
    }
    // Check if the repeat abort controller is defined
    if (this.acRepeatActive) {
      try {
        this.debug('Aborting the repeat timer before time is up');
        this.acRepeat.abort();
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.warn('Error when aborting repeat timer: %s', errorMessage);
      }
      this.acRepeatActive = false;
    }

    // Check if this is assumed to be a user controlled action
    if (userControl) {
      this.values.repetition = 0;
      this.endStatus = 'Manually controlled';
      await wait(50);
    } else {
      this.values.status = 'Delaying';
      this.endStatus = 'Automation done';
      const minDelay = this.values.delay * 0.2;
      const delayRange = this.values.delay - minDelay;
      let delay = 100;
      if (randomDelay) {
        delay = Math.floor(minDelay + Math.random() * delayRange) * 1000;
      }
      this.log('Waiting for %d seconds', delay / 1000);
      // Prepare abort controller
      this.acDelayActive = true;
      try {
        await wait(delay, this.acDelaySignal);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.debug('Delay timer aborted:', errorMessage);
        return;
      }
      this.acDelayActive = false;
      this.log('Delay performed');
    }

    const telldusState = this.switchOn ? FULL_COMMANDS.TURNON : FULL_COMMANDS.TURNOFF;

    let repetition = 0;
    do {
      // Control Telldus switch on/off
      const response = await this.telldusApi.onOffDevice(switchAccessory.deviceId, this.switchOn);
      if (response.ok) {
        this.log('Switch set to', stateToText(telldusState));
      } else {
        checkStatusCode(response, this.error);
      }
      this.values.lastActivation = toEveDate(getTimestamp());
      // If it is a dimmer and it is on, then send the current brightness value
      if (this.modelType === 'dimmer' && this.switchOn) {
        this.setDimmerLevel(switchAccessory, this.values.brightness, true);
      }

      repetition += 1;
      // Check if the switch activation shall be repeated
      if (this.values.repetition < this.values.repeats) {
        this.values.status = 'Repeating';
        this.values.repetition = repetition;
        this.log('Repeat command, repetition number: %d of %d', this.values.repetition, this.values.repeats);
        // Prepare abort controller
        this.acRepeatActive = true;
        // Wait 2 seconds + 1 second/repetition between repeats
        try {
          await wait(2000 + this.values.repetition * 1000, this.acRepeatSignal);
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          this.debug('Repeat timer aborted:', errorMessage);
          return;
        }
        this.acRepeatActive = false;
      }
    } while (repetition <= this.values.repeats);

    // Update the state cache with the new value
    const key = 'ID' + switchAccessory.deviceId;
    const success = switchAccessory.stateCache.set('pi' + key, telldusState);
    if (success) {
      this.debug('Plug-in state cache updated for %s with value [%s]', key, stateToText(telldusState));
    } else {
      this.warn("Plug-in cache couldn't be updated for", key);
    }

    this.values.repetition = 0;
    this.values.status = this.endStatus;

    // Wait 2 times the platform beat rate to ensure that the platform has updated
    // the Telldus state before allowing update from cache after switch set
    this.activeTimeout = setTimeout(() => {
      switchAccessory.onUpdating = false;
      this.activeTimeout = null;
      this.debug('Switch mute ends');
    }, this.switchMuteTime * 1000);
  }

  // Function to set a new dim level. The function will wait 1 second
  // and abort the command if a new command is received before that.
  // This minimises the number of commands if the level slider is
  // used in Eve to set the dimmer.
  // The dimmer is turned on automatically if it was off, so the delay
  // ensures that the dim command will be sent after the on command.
  async setDimmerLevel(switchAccessory: SwitchAccessoryType, dimLevel: number, immediately = false) {
    // If a dim command is pending, abort it
    if (this.acDimActive) {
      this.acDim.abort();
    }
    this.acDimActive = true;

    const brightness = Math.trunc((dimLevel * 255) / 100); // Convert % to 0-255

    try {
      // Check if the dimmer should be changed after a delay
      if (!immediately) {
        // Start a timer for the new dim command
        await wait(500, this.acDimSignal);
      }
      this.debug('Setting dimmer level to %s%', dimLevel);
      const response = await this.telldusApi.dimDevice(switchAccessory.deviceId, brightness);
      if (!response.ok) {
        checkStatusCode(response, this.error);
        this.warn('Error when setting dim level');
      }
      this.acDimActive = false;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (!errorMessage) {
        this.log('The current timer was stopped');
      } else {
        this.warn('Error setting dim level: %s', errorMessage);
      }
      this.acDimActive = false;
    }
  }
}

export default SwitchService;
