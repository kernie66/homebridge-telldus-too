// homebridge-telldus-too/lib/TdSwitchAccessory.js
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus switch devices.

import type NodeCache from 'node-cache';

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate';
import { assert, is } from 'tsafe';

import type TelldusApi from './api/TelldusApi.js';
import type TdMyCustomTypes from './TdMyCustomTypes.js';
import type TdPlatform from './TdPlatform.js';
import type { SwitchAccessoryParams } from './typings/SwitchTypes.js';

import BellService from './BellService.js';
import SwitchService from './SwitchService.js';
import { FULL_COMMANDS } from './TdConstants.js';
import { stateToText } from './utils/utils.js';

class TdSwitchAccessory extends AccessoryDelegate<TdPlatform, null> {
  id: string;
  model: string;
  deviceId: number;
  modelType: string;
  random: boolean;
  lightbulb: boolean;
  delay: number;
  repeats: number;
  state: number;
  stateCache: NodeCache;
  heartrate: number;
  telldusApi: TelldusApi;
  td: TdMyCustomTypes;
  platformBeatRate: number;
  onUpdating: boolean;
  switchService: BellService | SwitchService;

  constructor(platform: TdPlatform, params: SwitchAccessoryParams) {
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
    this.platformBeatRate = platform.platformBeatRate;
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
    this.manageLogLevel(this.switchService.characteristicDelegate('logLevel'), false);

    this.debug('Accessory initialised');
    this.heartbeatEnabled = true;
    setImmediate(() => {
      this.emit('initialised');
    });
    this.on('initialised', async () => {
      await this.checkState();
    });
    this.on('heartbeat', async (beat: number) => {
      await this.heartbeat(beat);
    });
    this.on('shutdown', async () => {
      return this.shutdown();
    });
    this.on('identify', async () => {
      this.log('Identifying switch with ID %s', this.deviceId);
    });
  }

  async shutdown() {
    this.debug('Nothing to do at shutdown');
  }

  async heartbeat(beat: number) {
    if (this.modelType !== 'Bell') {
      // Check the state each heartbeat to ensure that the state is correct in case of missed updates from Telldus
      await this.checkState();
      if (beat % this.switchService.values.heartrate === 0) {
        this.vdebug('Switch accessory heartbeat');
      }
    }
  }

  // Check the state of the switch devices using the cached values from the platform
  async checkState() {
    // Only called for switches, not bells
    assert(is<SwitchService>(this.switchService));
    if (!this.onUpdating) {
      let tdCachedValue: boolean = false,
        piCachedValue: boolean = false;
      const key = `ID${this.deviceId}`;

      const tdState: number | undefined = this.stateCache.get(`td${key}`);
      this.vdebug('tdState:', tdState);
      if (tdState === undefined) {
        this.warn('Cached value from Telldus does not exist for', key);
        return;
      }
      // Check each correct state to avoid undefined values
      if (tdState === FULL_COMMANDS.TURNON) {
        tdCachedValue = true;
      } else if (tdState === FULL_COMMANDS.TURNOFF) {
        tdCachedValue = false;
      }

      const piState: number | undefined = this.stateCache.get(`pi${key}`);
      this.vdebug('piState:', piState);
      if (piState === undefined) {
        this.warn('Cached value from Plug-in does not exist for', key);
        return;
      }
      // Check each correct state to avoid undefined values
      if (piState === FULL_COMMANDS.TURNON) {
        piCachedValue = true;
      } else if (piState === FULL_COMMANDS.TURNOFF) {
        piCachedValue = false;
      }

      if (tdCachedValue !== piCachedValue) {
        this.log(
          'Current state [%s] from Telldus is not the same as the set value [%s]',
          stateToText(tdState),
          stateToText(piState),
        );
        let newOnValue: boolean = tdCachedValue;
        if (this.switchService.values.enabled) {
          newOnValue = true;
          this.switchService.endStatus = 'Forced enabled';
          this.warn('Switch constantly enabled, restored [ON] state');
        } else if (this.switchService.values.disabled) {
          newOnValue = false;
          this.switchService.endStatus = 'Forced disabled';
          this.warn('Switch constantly disabled, restored [OFF] state');
        } else {
          this.switchService.endStatus = 'Updated by Telldus';
          this.log(
            'Switch state updated to [%s] based on cached Telldus value',
            stateToText(tdState),
          );
        }
        this.switchService.updateImmediately = true;
        if (this.switchService.values.on === newOnValue) {
          // Call setOn to update the switch when the value of "on" is already set to the same in the service,
          // as this would not trigger the didSet event to update the state
          this.switchService.switchOn = newOnValue;
          await this.switchService.setOn(this);
          this.debug('setOn called to update the switch state to [%s]', newOnValue ? 'ON' : 'OFF');
        } else {
          // When the value of "on" is not the same in the service, just set the value to trigger a didSet event
          this.switchService.values.on = newOnValue;
          this.debug(
            'didSet triggered to update the switch state to [%s]',
            newOnValue ? 'ON' : 'OFF',
          );
        }
      }
    } else {
      this.vdebug('Cache not updated due to switch updating');
    }
  }
}

export default TdSwitchAccessory;
