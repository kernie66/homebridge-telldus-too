// homebridge-telldus-too/lib/TdSwitchAccessory.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus switch devices.

'use strict';

const homebridgeLib = require('homebridge-lib');
const BellService = require('./BellService');
const SwitchService = require('./SwitchService');
const telldus = require('./TdConstants');
const { stateToText } = require('./utils/utils');

class TdSwitchAccessory extends homebridgeLib.AccessoryDelegate {
  constructor(platform, params) {
    super(platform, params);
    this.id = params.id;
    this.deviceId = params.deviceId;
    this.model = params.model;
    this.modelType = params.modelType;
    this.random = params.random || false;
    this.lightbulb = params.lightbulb || false;
    this.delay = params.delay || 60;
    this.repeats = params.repeats || 0;
    this.state = params.state;
    this.heartrate = params.heartrate || 15;
    this.td = platform.td;
    this.telldusApi = platform.telldusApi;
    this.stateCache = platform.stateCache;
    this.onUpdating = false;
    if (this.modelType === 'Bell') {
      this.switchService = new BellService(this, {
        primaryService: true,
      });
    } else {
      this.switchService = new SwitchService(this, {
        primaryService: true,
      });
    }
    this.manageLogLevel(
      this.switchService.characteristicDelegate('logLevel'),
      true
    );

    this.debug('Accessory initialised');
    this.heartbeatEnabled = true;
    setImmediate(() => {
      this.emit('initialised');
    });
    this.on('initialised', async () => {
      await this.checkState();
    });
    this.on('heartbeat', async (beat) => {
      await this.heartbeat(beat);
    });
    this.on('shutdown', async () => {
      return this.shutdown();
    });
  }

  async shutdown() {
    this.debug('Nothing to do at shutdown');
  }

  async heartbeat(beat) {
    this.checkState();
    if (beat % this.switchService.values.heartrate === 0) {
      this.debug('Switch accessory heartbeat');
    }
  }

  // Check the state of the devices using the cached values from the platform
  checkState() {
    if (!this.onUpdating) {
      let tdCachedValue, piCachedValue;
      const key = 'ID' + this.deviceId;

      const tdState = this.stateCache.get('td' + key);
      if (tdState === undefined) {
        this.warn(
          'Cached value from Telldus does not exist for',
          key
        );
        return;
      }
      // Check each correct state to avoid undefined values
      if (tdState === telldus.TURNON) {
        tdCachedValue = true;
      } else if (tdState === telldus.TURNOFF) {
        tdCachedValue = false;
      } else if (tdState === telldus.BELL) {
        tdCachedValue = false;
      }

      const piState = this.stateCache.get('pi' + key);
      if (piState === undefined) {
        this.warn(
          'Cached value from Plug-In does not exist for',
          key
        );
        return;
      }
      // Check each correct state to avoid undefined values
      if (piState === telldus.TURNON) {
        piCachedValue = true;
      } else if (piState === telldus.TURNOFF) {
        piCachedValue = false;
      } else if (piState === telldus.BELL) {
        piCachedValue = false;
      }

      this.debug(
        'Cached Telldus state is [%s] for %s',
        stateToText(tdState),
        key
      );
      this.debug(
        'Cached Plug-In state is [%s] for %s',
        stateToText(piState),
        key
      );
      if (piCachedValue !== tdCachedValue) {
        this.log(
          'Current state is not same as cached value, new value =',
          tdCachedValue
        );
        this.switchService.values.on = tdCachedValue;
      }
    } else {
      this.debug('Cache not updated due to switch updating');
    }
  }
}

module.exports = TdSwitchAccessory;
