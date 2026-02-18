// homebridge-telldus-too/lib/TdSensorAccessory.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate';
import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type TelldusApi from './api/TelldusApi.js';
import type { SensorInfoType } from './api/TelldusApi.types.js';
import RainSensorService from './RainSensorService.js';
import type TdMyCustomTypes from './TdMyCustomTypes.js';
import type TdPlatform from './TdPlatform.js';
import { HumidityService, TemperatureService } from './TempSensorService.js';
// import type { History } from './typings/homebridge-lib/History.js';
import type { SensorAccessoryParams } from './typings/SensorTypes.js';
import checkStatusCode from './utils/checkStatusCode.js';
import { getErrorMessage } from './utils/utils.js';
import WindSensorService from './WindSensorService.js';
import 'homebridge-lib/ServiceDelegate/History';
import type { History } from 'homebridge-lib/ServiceDelegate/History';

class TdSensorAccessory extends AccessoryDelegate<TdPlatform, object> {
  // name: string;
  id: string;
  sensorId: number;
  model: string;
  temperatureSensor: boolean;
  humiditySensor: boolean;
  rainSensor: boolean;
  windSensor: boolean;
  configHeartrate: number;
  randomize: boolean;
  td: TdMyCustomTypes;
  telldusApi: TelldusApi;
  historyService!: History;
  rainSensorService!: RainSensorService;
  windSensorService!: WindSensorService;
  tempSensorService!: TemperatureService;
  humiditySensorService!: HumidityService;

  constructor(platform: TdPlatform, params: SensorAccessoryParams) {
    super(platform, params);
    //    this.delay = params.delay
    this.name = params.name;
    this.id = params.id;
    this.sensorId = params.sensorId;
    this.model = params.model;
    this.temperatureSensor = params.temperatureSensor;
    this.humiditySensor = params.humiditySensor;
    this.rainSensor = params.rainSensor;
    this.windSensor = params.windSensor;
    this.configHeartrate = params.configHeartrate || 300;
    this.randomize = params.randomize || false;
    this.td = platform.td;
    this.telldusApi = platform.telldusApi;
    // this.stateCache = platform.stateCache;

    try {
      // Check if we have a temperature sensor
      if (this.temperatureSensor) {
        this.tempSensorService = new TemperatureService(this, {
          name: `${this.name} Temperature`,
        });
        // Check if we also have a humidity sensor
        if (this.humiditySensor) {
          this.humiditySensorService = new HumidityService(this, {});
        }

        // Generate history for temperature and/or humidity
        this.historyService = new ServiceDelegate.History(this, {
          temperatureDelegate: this.temperatureSensor
            ? this.tempSensorService.characteristicDelegate('temperature')
            : null,
          humidityDelegate: this.humiditySensor ? this.humiditySensorService.characteristicDelegate('humidity') : null,
        });
        this.manageLogLevel(this.tempSensorService.characteristicDelegate('logLevel'), false);
      }

      // Check if we have a rain sensor
      else if (this.rainSensor) {
        this.rainSensorService = new RainSensorService(this, {});
        this.manageLogLevel(this.rainSensorService.characteristicDelegate('logLevel'), false);
      } else if (this.windSensor) {
        this.windSensorService = new WindSensorService(this, {});
        this.manageLogLevel(this.windSensorService.characteristicDelegate('logLevel'), false);
      } else {
        this.warn('No sensor included, this plugin needs it.');
      }

      this.debug('Accessory initialised');
      this.heartbeatEnabled = true;
      setImmediate(() => {
        this.emit('initialised');
      });
      this.on('initialised', async () => {
        await this.getSensorData();
      });
      this.on('heartbeat', async (beat: number) => {
        await this.heartbeat(beat);
      });
      this.on('shutdown', async () => {
        return this.shutdown();
      });
      this.on('identify', async () => {
        this.log('Identifying sensor with ID %s', this.sensorId);
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.error(`Sensor Accessory error: (${errorMessage})`);
      throw new Error(`Sensor Accessory error: (${errorMessage})`);
      // return;
    }
  }
  async shutdown() {
    this.debug('Nothing to do at shutdown');
  }

  async heartbeat(beat: number) {
    let heartrate = 300;
    if (this.temperatureSensor) {
      heartrate = this.tempSensorService.values.heartrate;
    } else if (this.rainSensor) {
      heartrate = this.rainSensorService.values.heartrate;
    } else if (this.windSensor) {
      heartrate = this.windSensorService.values.heartrate;
    }

    if (beat % heartrate === 0) {
      this.getSensorData();
      //      this.checkState()
    }
  }

  async getSensorData() {
    try {
      const response = await this.telldusApi.getSensorInfo(this.sensorId);
      console.log('🚀 ~ TdSensorAccessory ~ getSensorData ~ response:', response);

      if (response.ok && checkStatusCode<SensorInfoType>(response, this.error)) {
        const sensorData = response.body;
        this.vdebug('Sensor data:', sensorData);
        if (this.temperatureSensor) {
          this.tempSensorService.checkObservation(sensorData);
        }
        if (this.humiditySensor) {
          this.humiditySensorService.checkObservation(sensorData);
        }
        if (this.rainSensor) {
          this.rainSensorService.checkObservation(sensorData);
        } else if (this.windSensor) {
          this.windSensorService.checkObservation(sensorData);
        }
      } else {
        throw new Error(`Response error (${response.statusCode}) ${response.statusMessage}`);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.warn('Error getting sensor data from sensor ID:', this.sensorId);
      this.warn('Error message:', errorMessage);
    }
  }
}

export default TdSensorAccessory;
