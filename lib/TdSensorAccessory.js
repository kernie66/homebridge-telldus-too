// homebridge-telldus-too/lib/TdSensorAccessory.js
// Copyright © 2022-2023 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict';

const homebridgeLib = require('homebridge-lib');
const TempSensorService = require('./TempSensorService');
const RainSensorService = require('./RainSensorService');
const WindSensorService = require('./WindSensorService');
const checkStatusCode = require('./utils/checkStatusCode');

const { History } = homebridgeLib.ServiceDelegate;

class TdSensorAccessory extends homebridgeLib.AccessoryDelegate {
  constructor(platform, params) {
    super(platform, params);
    //    this.delay = params.delay
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
    this.telldusApi = platform.tellstick.telldusApi;
    this.stateCache = platform.stateCache;
    this.tempSensorServices = {};
    this.rainSensorServices = {};
    this.windSensorServices = {};

    // Check if we have a temperature sensor
    if (this.temperatureSensor) {
      this.tempSensorServices.temperature =
        new TempSensorService.Temperature(this);
      // Check if we also have a humidity sensor
      if (this.humiditySensor) {
        this.tempSensorServices.humidity =
          new TempSensorService.Humidity(this);
      }
      // Generate history for temperature and/or humidity
      this.historyService = new History(this, {
        temperatureDelegate: this.temperatureSensor
          ? this.tempSensorServices.temperature.characteristicDelegate(
              'temperature'
            )
          : null,
        humidityDelegate: this.humiditySensor
          ? this.tempSensorServices.humidity.characteristicDelegate(
              'humidity'
            )
          : null,
      });
      this.manageLogLevel(
        this.tempSensorServices.temperature.characteristicDelegate(
          'logLevel'
        ),
        false
      );
    }
    // Check if we have a rain sensor
    else if (this.rainSensor) {
      this.rainSensorService = new RainSensorService.Rain(this);
      this.manageLogLevel(
        this.rainSensorService.characteristicDelegate('logLevel'),
        false
      );
    } else if (this.windSensor) {
      this.windSensorService = new WindSensorService.Wind(this);
      this.manageLogLevel(
        this.windSensorService.characteristicDelegate('logLevel'),
        false
      );
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
    let heartrate = 300;
    if (this.temperatureSensor) {
      heartrate =
        this.tempSensorServices.temperature.values.heartrate;
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
      const response = await this.telldusApi.getSensorInfo(
        this.sensorId
      );
      if (!response.ok) {
        checkStatusCode(response, this);
      } else {
        const sensorData = response.body;
        this.debug('Sensor data:', sensorData);
        if (this.temperatureSensor) {
          for (const id in this.tempSensorServices) {
            this.tempSensorServices[id].checkObservation(sensorData);
          }
        } else if (this.rainSensor) {
          this.rainSensorService.checkObservation(sensorData);
        } else if (this.windSensor) {
          this.windSensorService.checkObservation(sensorData);
        }
      }
    } catch (error) {
      this.warn(
        'Error getting sensor data:',
        error.name,
        error.message
      );
    }
  }
}

module.exports = TdSensorAccessory;
