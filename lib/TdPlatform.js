// homebridge-telldus-too/lib/TdPlatform.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

'use strict';

const events = require('events');
const homebridgeLib = require('homebridge-lib');
const { LocalApi } = require('telldus-api');
const TdSwitchAccessory = require('./TdSwitchAccessory');
const TdSensorAccessory = require('./TdSensorAccessory');
const { getDevices, getSensorInfo } = require('./TdApi');
const TdTypes = require('./TdTypes');
const uuid = require('./utils/uuid');
const NodeCache = require('node-cache');
const { stateToText, wait } = require('./utils/utils');
const {
  isoDateTimeToIntl,
  timestampToIntl,
  getTimestamp,
} = require('./utils/dateTimeHelpers');
const clc = require('cli-color');
const HomebridgeTelldusApi = require('./api/HomebridgeTelldusApi');
const {
  requestHandler,
  responseHandler,
  errorHandler,
} = require('./utils/apiHandlers');
const checkStatusCode = require('./utils/checkStatusCode');

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

class TdPlatform extends homebridgeLib.Platform {
  constructor(log, configJson, homebridge) {
    super(log, configJson, homebridge);
    this.once('heartbeat', this.init);
    this.config = {
      name: 'TelldusToo',
    };

    this.stateCache = new NodeCache();
    this.td = new TdTypes(homebridge);
    this.debug('Characteristics: %s', this.td.Characteristics);

    const optionParser = new homebridgeLib.OptionParser(
      this.config,
      true
    );
    optionParser
      .stringKey('name')
      .stringKey('platform')
      .stringKey('ipAddress')
      .stringKey('accessToken')
      .boolKey('random')
      .intKey('delay', 0, 300)
      .intKey('repeats', 0, 5)
      .boolKey('ignoreUnnamedSwitches')
      .boolKey('ignoreUnnamedSensors')
      .stringKey('ignore')
      .intKey('configHeartrate', 1, 300)
      .boolKey('randomize')
      .stringKey('locale')
      .on('userInputError', (message) => {
        this.warn('config.json: %s', message);
      });

    optionParser.parse(configJson);
    if (!this.config.ipAddress) {
      this.warn('IP address missing in config file');
    } else if (!this.config.accessToken) {
      this.warn('Access token missing in config file');
    } else {
      this.api = new LocalApi({
        host: this.config.ipAddress,
        accessToken: this.config.accessToken,
      });
      try {
        this.telldusApi = new HomebridgeTelldusApi(
          this.config.ipAddress,
          this.config.accessToken
        );
        this.telldusApi.setRequestHandler(requestHandler.bind(this));
        this.telldusApi.setResponseHandler(
          responseHandler.bind(this)
        );
        this.telldusApi.setErrorHandler(errorHandler.bind(this));
      } catch (error) {
        this.debug('Full error:\n', error);
        this.fatal(
          'Error initialising the Telldus API, exiting...\n',
          error.name,
          error.message
        );
      }
      this.log('Telldus API URL:', clc.green(this.telldusApi.getUrl));

      this.debug(
        'Found access token for IP:',
        clc.green(this.config.ipAddress)
      );
    }
    if (this.config.ignore) {
      this.config.ignoreIds = this.config.ignore
        .split(',')
        .map(Number);
      this.log(
        'Found %s IDs to be ignored',
        this.config.ignoreIds.length
      );
    }
    this.debug('config: %j', this.config);
    this.on('heartbeat', async (beat) => {
      await this.platformBeat(beat);
    });
    this.on('shutdown', async () => {
      return this.shutdown();
    });
  }

  async init(beat) {
    let deviceArray = [];
    let sensorArray = [];

    // Check that Telldus is responding to the defined request parameters
    try {
      const sysInfo = await this.telldusApi.getSystemInfo();
      if (!sysInfo.ok) {
        if (!checkStatusCode(sysInfo)) {
          if (!sysInfo.body.product) {
            this.fatal(
              'Unknown response from Telldus, check if the host address is correct'
            );
          }
        }
      }
      this.log(
        'Telldus system type:',
        clc.green(sysInfo.body.product)
      );
      this.log(
        'Telldus system version:',
        clc.green(sysInfo.body.version)
      );
      this.log(
        'Telldus system time:',
        clc.green(
          isoDateTimeToIntl(sysInfo.body.time, this.config.locale)
        )
      );
      this.refreshAccessToken();
    } catch (error) {
      this.debug('Full error:\n', error);
      this.fatal(
        'Error getting system information from Telldus, exiting...\n',
        error.name,
        error.message
      );
    }

    // Find the devices and sensors of the Telldus gateway
    try {
      let retry = true;

      // Get devices from Telldus
      let deviceResponse;
      while (retry) {
        deviceResponse = await this.telldusApi?.listDevices();
        if (!deviceResponse.ok) {
          checkStatusCode(deviceResponse);
          this.log(clc.blueBright('Will retry in 1 minute...'));
          wait(60 * 1000);
        } else {
          retry = false;
        }
      }
      const devices = deviceResponse.body.device;
      this.numberOfDevices = devices.length;
      if (this.numberOfDevices) {
        this.log(
          'Number of Telldus devices found:',
          this.numberOfDevices
        );
        devices.forEach((element) => {
          deviceArray.push(element.id);
        });
      } else {
        this.warn('No Telldus devices found!');
      }
      this.deviceArray = deviceArray;

      retry = true;
      // Get sensors from Telldus
      let sensorResponse;
      while (retry) {
        sensorResponse = await this.telldusApi?.listSensors();
        if (!sensorResponse.ok) {
          checkStatusCode(sensorResponse);
          this.log(clc.blueBright('Will retry in 1 minute...'));
          wait(60 * 1000);
        } else {
          retry = false;
        }
      }
      const sensors = sensorResponse.body.sensor;
      this.numberOfSensors = sensors.length;
      if (this.numberOfSensors) {
        this.log(
          'Number of Telldus sensors found:',
          this.numberOfSensors
        );
        sensors.forEach((element) => {
          sensorArray.push(element.id);
        });
      } else {
        this.log('No Telldus sensors found!');
      }
      this.sensorArray = sensorArray;
    } catch (error) {
      this.fatal('Error accessing Telldus:', error);
    }

    this.switchAccessories = {};
    const validSwitches = [];
    // Parse the Telldus devices
    for (const id of this.deviceArray) {
      const config = {};
      let info;
      try {
        const infoResponse = await this.telldusApi?.getDeviceInfo(id);
        //const info = await getDeviceInfo(this.api, id);
        if (!infoResponse.ok) {
          checkStatusCode(infoResponse);
          this.warn(
            'No info from Telldus when parsing, skipping device ID:',
            id
          );
          continue;
        }
        info = infoResponse.body;
      } catch (error) {
        this.warn('Error getting device info:', error);
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
      this.log(
        'Check',
        info.methods,
        supportedCommands.on,
        info.methods & supportedCommands.on
      );
      if (info.methods & supportedCommands.dim) {
        config.modelType = 'dimmer';
      } else if (info.methods & supportedCommands.bell) {
        config.modelType = 'bell';
      } else if (info.methods & supportedCommands.on) {
        config.modelType = 'switch';
      } else {
        this.warn(
          'Ignoring unsupported Telldus device with ID:',
          info.id
        );
        continue;
      }
      config.methods = info.methods;
      config.protocol = info.protocol;
      config.state = info.state;
      config.type = info.type;
      config.delay = this.config.delay;
      config.random = this.config.random;
      if (config.modelType === 'dimmer') {
        config.category = this.Accessory.Categories.Lightbulb;
      } else {
        config.category = this.Accessory.Categories.Switch;
      }
      if (this.config.ignoreIds.includes(config.id)) {
        this.log(
          'Ignoring %s: %s, ID: %s',
          config.modelType,
          config.name,
          config.id
        );
      } else {
        this.log(
          'Found %s: %s, ID: %s',
          config.modelType,
          config.name,
          config.id
        );
        validSwitches.push(config);
      }
    }
    this.log('Number of valid switches', validSwitches.length);

    this.sensorAccessories = {};
    const validSensors = [];

    // Parse the Telldus sensors
    for (const id of this.sensorArray) {
      const config = {};
      const info = await getSensorInfo(this.api, id);
      if (info === 'Timeout') {
        this.warn('Timeout when parsing sensor ID:', id);
        continue;
      }
      if (!info.name && this.config.ignoreUnnamedSensors) {
        this.log('Ignoring unnamed sensor with ID:', info.id);
        continue;
      }
      config.id = info.id;
      config.name = info.name || 'Sensor ' + info.id;
      config.uuid = uuid(config.name + config.id);
      const sensorType = this.checkSensorType(info);
      if (sensorType) {
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
          this.log(
            'Ignoring sensor: %s, ID: %s',
            config.name,
            config.id
          );
        } else {
          this.log(
            'Found sensor: %s, ID: %s',
            config.name,
            config.id
          );
          validSensors.push(config);
        }
      } else {
        this.warn(
          'Ignoring unknown sensor type for ID %s: %s',
          info.id,
          info.model
        );
      }
    }
    this.log('Number of valid sensors', validSensors.length);

    const jobs = [];

    for (const tdSwitch of validSwitches) {
      const switchParams = {
        name: tdSwitch.name,
        id: tdSwitch.uuid,
        deviceId: tdSwitch.id,
        //        uuid: tdSwitch.uuid,
        manufacturer: tdSwitch.manufacturer,
        model: tdSwitch.model,
        modelType: tdSwitch.modelType,
        firmware: 'ID-' + tdSwitch.id,
        state: tdSwitch.state,
        api: this.api,
        stateCache: this.stateCache,
        category: tdSwitch.category,
        delay: tdSwitch.delay,
        random: tdSwitch.random,
        //        heartrate: delaySwitch.heartrate,
      };
      this.log(
        'Processing %s %s, State: [%s]',
        switchParams.modelType,
        switchParams.name,
        stateToText(switchParams.state)
      );
      const switchAccessory = new TdSwitchAccessory(
        this,
        switchParams
      );
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
      this.log('Processing sensor', sensorParams.name);
      const sensorAccessory = new TdSensorAccessory(
        this,
        sensorParams
      );
      jobs.push(events.once(sensorAccessory, 'initialised'));
      this.sensorAccessories[tdSensor] = sensorAccessory;
    }

    for (const job of jobs) {
      await job;
    }

    this.debug('initialised');
    this.emit('initialised');
  }

  // Check the state of all Telldus devices and cache the result
  // This minimises the number of accesses to the Telldus gateway
  async platformBeat(beat) {
    if (beat % 10 === 0) {
      this.debug('Platform heartbeat...');
      // Get states of all devices from Telldus
      const devices = await getDevices(this.api, 5000);
      if (devices === 'Timeout') {
        this.warn(
          'Timeout from Telldus when getting states, will try again'
        );
      } else {
        this.numberOfDevices = devices.length;
        if (this.numberOfDevices) {
          devices.forEach((element) => {
            const key = 'ID' + element.id;
            const success = this.stateCache.set(key, element.state);
            if (!success) {
              this.warn(
                "Couldn't cache state for Telldus devices, will try again"
              );
            } else {
              this.debug(
                'Stored state [%s] for key %s',
                stateToText(element.state),
                key
              );
            }
          });
        } else {
          this.debug('No Telldus devices found in platformBeat!');
        }
      }
      // Check if the access token needs to be refreshed
      if (getTimestamp() > this.nextRefresh) {
        this.refreshAccessToken();
      }
    }
  }

  checkSensorType(sensorInfo) {
    let sensorType;
    // Check the obvious models
    if (
      sensorInfo.model === 'temperature' ||
      sensorInfo.model === 'temperaturehumidity'
    ) {
      return sensorInfo.model;
    }
    // Check for temperature and possibly humidity sensor
    if (sensorInfo.data[0] && sensorInfo.data[0].name === 'temp') {
      sensorType = 'temperature';
      if (
        sensorInfo.data[1] &&
        sensorInfo.data[1].name === 'humidity'
      ) {
        sensorType = sensorType + 'humidity';
      }
      return sensorType;
    }
    // Check for wind sensor
    if (sensorInfo.data[0] && sensorInfo.data[0].name === 'wdir') {
      return 'wind';
    }
    // Check for rain sensor
    if (sensorInfo.data[0] && sensorInfo.data[0].name === 'rtot') {
      return 'rain';
    }
  }

  async refreshAccessToken() {
    const expires = await this.telldusApi.refreshAccessToken();
    if (expires) {
      this.lastRefresh = getTimestamp();
      this.accessTokenExpires = expires;
      this.nextRefresh =
        this.lastRefresh + (expires - this.lastRefresh) / 2;
      this.log(
        'Telldus access token expires:',
        clc.green(timestampToIntl(expires, this.config.locale))
      );
      this.log(
        'Next scheduled token refresh:',
        clc.blueBright(
          timestampToIntl(this.nextRefresh, this.config.locale)
        )
      );
      return true;
    } else {
      this.warn(
        "Telldus access token couldn't be refreshed, maybe it already expired"
      );
      return false;
    }
  }

  shutdown() {
    this.stateCache.flushAll();
    this.stateCache.close();
    this.log('Cleaned up state cache');
  }
}

module.exports = TdPlatform;
