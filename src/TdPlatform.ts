// homebridge-telldus-too/lib/TdPlatform.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

import events from 'events';
import figlet from 'figlet';
import type { API, Logger } from 'homebridge';
import { OptionParser } from 'homebridge-lib/OptionParser';
import { Platform } from 'homebridge-lib/Platform';
import { default as NodeCache } from 'node-cache';
import colors from 'yoctocolors';
import type TelldusApi from './api/TelldusApi.js';
import { FULL_COMMANDS } from './TdConstants.js';
import TdMyCustomTypes from './TdMyCustomTypes.js';
import TdSensorAccessory from './TdSensorAccessory.js';
import TdSwitchAccessory from './TdSwitchAccessory.js';
import TdTellstickAccessory from './TdTellstickAccessory.js';
import type { ConfigJson } from './typings/ConfigJsonTypes.js';
import type { SwitchConfigTypes } from './typings/SwitchTypes.js';
import checkSensorType from './utils/checkSensorType.js';
import checkStatusCode from './utils/checkStatusCode.js';
import { getTimestamp, isoDateTimeToEveDate } from './utils/dateTimeHelpers.js';
import { getErrorMessage, stateToText, wait } from './utils/utils.js';
import uuid from './utils/uuid.js';

const configRegExp = {
  ip: /(^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$)/,
  host: /(^([A-Za-z0-9_-]+){1}(\.[A-Za-z0-9_-]+)$)/,
  token: /(^((?:\.?(?:[A-Za-z0-9-_]+)){3})$)/,
};

const supportedCommands = {
  on: 0x0001, // 1
  off: 0x0002, // 2
  bell: 0x0004, // 4
  // toggle: 0x0008, // 8
  dim: 0x0010, // 16
  // learn: 0x0020, // 32
  //execute: 0x0040, // 64
  // up: 0x0080, // 128
  //down: 0x0100, // 256
  //stop: 0x0200, // 512
};

class TdPlatform extends Platform {
  config: ConfigJson;
  initialised: boolean;
  platformBeatRate: number;
  stateCache: NodeCache;
  td: TdMyCustomTypes;
  // deviceArray!: number[];
  // sensorArray!: number[];
  numberOfDevices!: number;
  numberOfSensors!: number;
  switchAccessories!: {
    [key: string]: TdSwitchAccessory;
  };
  sensorAccessories!: {
    [key: string]: TdSensorAccessory;
  };
  tellstick!: TdTellstickAccessory;
  telldusApi!: TelldusApi;

  constructor(log: Logger, configJson: ConfigJson, homebridge: API) {
    super(log, configJson, homebridge);
    this.config = {
      name: 'TelldusToo',
    };

    this.initialised = false;
    this.platformBeatRate = 30;
    this.stateCache = new NodeCache();
    this.td = new TdMyCustomTypes(homebridge);
    console.log('🚀 ~ TdPlatform ~ constructor ~ td:', this.td);

    this.vdebug('Characteristics: %o', this.td.Characteristics);

    const optionParser = new OptionParser(this.config, true);
    optionParser
      .stringKey('name', true)
      .stringKey('platform', true)
      .stringKey('ipAddress', true)
      .stringKey('accessToken', true)
      .boolKey('random')
      .intKey('delay', 0, 300)
      .intKey('repeats', 0, 5)
      .boolKey('lightbulb')
      .boolKey('dimmerAsSwitch')
      .boolKey('ignoreUnnamedSwitches')
      .boolKey('ignoreUnnamedSensors')
      .stringKey('ignore')
      .intKey('configHeartrate', 1, 300)
      .boolKey('randomize')
      .stringKey('locale')
      .on('userInputError', (error: string) => {
        throw new TypeError(error);
      });

    try {
      optionParser.parse(configJson);
      if (!this.config.ipAddress) {
        throw new Error('IP address missing in config file');
      }
      if (!configRegExp.ip.test(this.config.ipAddress) && !configRegExp.host.test(this.config.ipAddress)) {
        throw new Error(`IP address ${this.config.ipAddress} is not a valid value`);
      }
      if (!this.config.accessToken) {
        throw new Error('Access token missing in config file');
      }
      if (!configRegExp.token.test(this.config.accessToken)) {
        throw new Error('Given access token not a valid value');
      }

      this.debug('Found access token for IP:', colors.green(this.config.ipAddress));

      this.config.ignoreIds = [];
      if (this.config.ignore) {
        this.config.ignoreIds = this.config.ignore.split(',').map(Number);
        this.log('Found %s IDs to be ignored', this.config.ignoreIds.length, this.config.ignore);
      }

      this.once('heartbeat', this.init);

      this.on('heartbeat', async (beat: number) => {
        await this.platformBeat(beat);
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.error(`\n${figlet.textSync('Config Error')}`);
      this.log(errorMessage);
      this.warn('Check the config file and restart Homebridge');
      this.warn('The plugin aborts the initialization');
      return;
    }
    this.on('shutdown', async () => {
      return this.shutdown();
    });
  }

  async init() {
    const deviceArray: number[] = [];
    const sensorArray: number[] = [];

    this.debug('Initializing platform');
    this.tellstick = new TdTellstickAccessory(this, {
      config: this.config,
    });

    if (!this.tellstick.telldusApi) {
      this.error('Telldus API not initialized, aborting plugin initialization');
      return;
    }
    this.telldusApi = this.tellstick.telldusApi;

    // Check if access token has been updated in the config file
    if (this.config.accessToken !== this.tellstick.values.configAccessToken) {
      this.warn('Access token updated in config, will use this as new access token');
      this.tellstick.values.configAccessToken = this.config.accessToken;
    } else {
      this.debug('Config access token not updated, will use existing access token');
    }

    // Try to connect to Telldus device, and try again if not successful
    let connected = false;
    do {
      // Check that Telldus is responding to the defined request parameters
      try {
        const sysInfo = await this.telldusApi.getSystemInfo();
        if (!sysInfo.ok) {
          if (!checkStatusCode(sysInfo, this.error)) {
            if (!sysInfo.body.product) {
              this.error('Unknown response from Telldus, check if the host address is correct and restart');
              this.warn('Will retry in 1 minute...');
              await wait(60 * 1000);
            }
          }
        } else {
          this.log('Telldus system type:', colors.green(sysInfo.body.product));
          this.log('Telldus system version:', colors.green(sysInfo.body.version));
          this.tellstick.firmware = sysInfo.body.version;
          this.log('Telldus system time:', colors.green(isoDateTimeToEveDate(sysInfo.body.time)));
          // this.tellstick.getNewAccessToken();
          connected = true;
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.error('Error getting system information from Telldus:', errorMessage);
        this.warn('Will retry in 1 minute...');
        await wait(60 * 1000);
      }
    } while (!connected);

    // Find the devices and sensors of the Telldus gateway
    try {
      let retry = true;

      // Get devices from Telldus
      let deviceResponse;
      while (retry) {
        deviceResponse = await this.telldusApi.listDevices();
        if (!deviceResponse.ok) {
          checkStatusCode(deviceResponse, this.error);
          this.warn(colors.blueBright('Will retry in 1 minute...'));
          wait(60 * 1000);
        } else {
          retry = false;
        }
      }
      const devices = deviceResponse.body.device;
      this.numberOfDevices = devices.length;
      if (this.numberOfDevices) {
        this.log('Number of Telldus devices found:', this.numberOfDevices);
        devices.forEach((element: { id: number }) => {
          deviceArray.push(element.id);
        });
      } else {
        this.warn('No Telldus devices found!');
      }
      // this.deviceArray = deviceArray;

      retry = true;
      // Get sensors from Telldus
      let sensorResponse;
      while (retry) {
        sensorResponse = await this.telldusApi.listSensors();
        if (!sensorResponse.ok) {
          checkStatusCode(sensorResponse, this.error);
          this.warn(colors.blueBright('Will retry in 1 minute...'));
          wait(60 * 1000);
        } else {
          retry = false;
        }
      }
      const sensors = sensorResponse.body.sensor;
      this.numberOfSensors = sensors.length;
      if (this.numberOfSensors) {
        this.log('Number of Telldus sensors found:', this.numberOfSensors);
        sensors.forEach((element: { id: number }) => {
          sensorArray.push(element.id);
        });
      } else {
        this.warn('No Telldus sensors found!');
      }
      // this.sensorArray = sensorArray;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.error('Error accessing Telldus, plug-in suspended...');
      this.error('Error message:', errorMessage);
      return;
    }

    this.switchAccessories = {};
    const validSwitches = [];
    // Parse the Telldus devices
    for (const id of deviceArray) {
      const config: SwitchConfigTypes = {};
      let info;
      try {
        const infoResponse = await this.telldusApi.getDeviceInfo(id);
        if (!infoResponse.ok) {
          checkStatusCode(infoResponse, this.error);
          this.warn('No info from Telldus when parsing, skipping device ID:', id);
          continue;
        }
        info = infoResponse.body;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.warn('Error getting device info, skipping device ID:', id);
        this.warn('Error message:', errorMessage);
        continue;
      }
      config.id = info.id;
      if (!info.name && this.config.ignoreUnnamedSwitches) {
        this.log('Ignoring unnamed switch with ID:', info.id);
        continue;
      }
      config.name = info.name || 'Device ' + config.id;
      config.uuid = uuid(config.name + config.id);
      // Split manufacturer and model
      const modelSplit = (info.model || '').split(':');
      config.model = modelSplit[0] || 'unknown';
      config.manufacturer = modelSplit[1] || 'unknown';
      // Check type of switch, and if dimmers are to be used as switches
      if (info.methods & supportedCommands.dim) {
        config.modelType = this.config.dimmerAsSwitch ? 'switch' : 'dimmer';
      } else if (info.methods & supportedCommands.bell) {
        config.modelType = 'bell';
      } else if (info.methods & supportedCommands.on) {
        config.modelType = 'switch';
      } else {
        this.warn('Ignoring unsupported Telldus device with ID:', info.id);
        continue;
      }
      config.methods = info.methods;
      config.protocol = info.protocol;
      config.state = info.state;
      // config.type = info.type; // Not used currently
      config.delay = this.config.delay;
      config.random = this.config.random;
      config.lightbulb = this.config.lightbulb;
      if (config.modelType === 'dimmer' || config.lightbulb) {
        config.category = this.Accessory.Categories.Lightbulb;
      } else {
        config.category = this.Accessory.Categories.Switch;
      }
      if (this.config.ignoreIds.includes(config.id)) {
        this.log('Ignoring %s: %s, ID: %s', config.modelType, config.name, config.id);
      } else {
        this.log('Found %s: %s, ID: %s', config.modelType, config.name, config.id);
        validSwitches.push(config);
      }
    }
    this.log('Number of valid switches', validSwitches.length);

    this.sensorAccessories = {};
    const validSensors = [];

    // Parse the Telldus sensors
    for (const id of sensorArray) {
      const config = {};
      let info;
      try {
        const infoResponse = await this.telldusApi?.getSensorInfo(id);
        if (!infoResponse.ok) {
          checkStatusCode(infoResponse, this.error);
          this.warn('No info from Telldus when parsing ID: %d, skipping device...', id);
          continue;
        }
        info = infoResponse.body;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.warn('Error getting sensor info, skipping device ID:', id);
        this.warn('Error message:', errorMessage);
        continue;
      }
      if (!info.name && this.config.ignoreUnnamedSensors) {
        this.log('Ignoring unnamed sensor with ID:', info.id);
        continue;
      }
      config.id = info.id;
      config.name = info.name || 'Sensor ' + info.id;
      config.uuid = uuid(config.name + config.id);
      const sensorType = checkSensorType(info);
      if (sensorType !== 'unknown') {
        config.model = sensorType;
        if (sensorType.includes('temperature')) {
          config.temperatureSensor = true;
        }
        if (sensorType.includes('humidity')) {
          config.humiditySensor = true;
        }
        if (sensorType === 'rain') {
          config.rainSensor = true;
        }
        if (sensorType === 'wind') {
          config.windSensor = true;
        }
        config.manufacturer = 'Telldus';
        config.protocol = info.protocol;
        config.randomize = this.config.randomize;
        config.configHeartrate = this.config.configHeartrate;
        config.category = this.Accessory.Categories.Sensor;
        if (this.config.ignoreIds.includes(config.id)) {
          this.log('Ignoring sensor: %s, ID: %s', config.name, config.id);
        } else {
          this.log('Found sensor: %s, ID: %s', config.name, config.id);
          validSensors.push(config);
        }
      } else {
        this.warn('Ignoring unknown sensor type for ID %s: %s', info.id, info.model);
      }
    }
    this.log('Number of valid sensors', validSensors.length);

    const jobs = [];

    for (const tdSwitch of validSwitches) {
      const switchParams = {
        name: tdSwitch.name,
        id: tdSwitch.uuid,
        deviceId: tdSwitch.id,
        manufacturer: tdSwitch.manufacturer,
        model: tdSwitch.model,
        modelType: tdSwitch.modelType,
        firmware: 'ID-' + tdSwitch.id,
        state: tdSwitch.state,
        category: tdSwitch.category,
        delay: tdSwitch.delay,
        random: tdSwitch.random,
        lightbulb: tdSwitch.lightbulb,
      };
      this.debug(
        'Processing %s %s, State: [%s]',
        switchParams.modelType,
        switchParams.name,
        stateToText(switchParams.state),
      );
      const switchAccessory = new TdSwitchAccessory(this, switchParams);
      this.setStateCache(tdSwitch);
      jobs.push(events.once(switchAccessory, 'initialised'));
      this.switchAccessories[tdSwitch] = switchAccessory;
    }

    for (const tdSensor of validSensors) {
      const sensorParams = {
        name: tdSensor.name,
        sensorId: tdSensor.id,
        id: tdSensor.uuid,
        manufacturer: tdSensor.manufacturer,
        model: tdSensor.model,
        temperatureSensor: tdSensor.temperatureSensor || false,
        humiditySensor: tdSensor.humiditySensor || false,
        rainSensor: tdSensor.rainSensor || false,
        windSensor: tdSensor.windSensor || false,
        configHeartrate: tdSensor.configHeartrate,
        randomize: tdSensor.randomize,
        firmware: 'ID-' + tdSensor.id,
        category: tdSensor.category,
      };
      this.debug('Processing sensor', sensorParams.name);
      const sensorAccessory = new TdSensorAccessory(this, sensorParams);
      jobs.push(events.once(sensorAccessory, 'initialised'));
      this.sensorAccessories[tdSensor] = sensorAccessory;
    }

    for (const job of jobs) {
      await job;
    }

    this.initialised = true;
    this.debug('initialised');
    this.emit('initialised');
  }

  // Check the state of all Telldus devices and cache the result
  // This minimises the number of accesses to the Telldus gateway
  async platformBeat(beat) {
    if (beat % this.platformBeatRate === 0 && this.initialised) {
      this.debug('Platform heartbeat...');
      try {
        // Get states of all devices from Telldus
        const deviceResponse = await this.telldusApi.listDevices();
        if (!deviceResponse.ok) {
          checkStatusCode(deviceResponse, this.error);
          this.warn('No response from Telldus, will retry next cycle...');
        } else {
          const devices = deviceResponse.body.device;
          this.numberOfDevices = devices.length;
          if (this.numberOfDevices) {
            this.debug('Updating cache for %s devices...', this.numberOfDevices);
            devices.forEach((device) => {
              this.updateStateCache(device);
            });
          } else {
            this.debug('No Telldus devices found in platformBeat!');
          }
        }
        // Check if the access token needs to be refreshed
        if (getTimestamp() > this.tellstick.values.nextRefresh) {
          // this.tellstick.getNewAccessToken();
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.error('Error getting device state from Telldus, will retry');
        this.error('Error message:', errorMessage);
      }
    }
  }

  setStateCache(device) {
    const key = 'ID' + device.id;
    let state = device.state;
    if (state === FULL_COMMANDS.DIM) {
      state = FULL_COMMANDS.TURNON;
    }
    let success = this.stateCache.set('td' + key, state);
    success = success && this.stateCache.set('pi' + key, state);
    if (success) {
      this.debug('Stored Telldus state [%s] for key %s', stateToText(device.state), key);
    } else {
      this.warn("Couldn't set initial cache state for Telldus devices");
    }
  }

  updateStateCache(device) {
    const key = 'ID' + device.id;
    let state = device.state;
    if (state === FULL_COMMANDS.DIM) {
      state = FULL_COMMANDS.TURNON;
    }
    const cachedValue = this.stateCache.get('td' + key);
    if (cachedValue !== state) {
      const success = this.stateCache.set('td' + key, state);
      if (success) {
        this.debug('Updated Telldus state to [%s] for key %s', stateToText(state), key);
      } else {
        this.warn("Couldn't update cache state for Telldus devices, will try again");
      }
    }
  }

  shutdown() {
    this.stateCache.flushAll();
    this.stateCache.close();
    this.log('Shutting down, cleaned up Telldus state cache');
  }
}

export default TdPlatform;
