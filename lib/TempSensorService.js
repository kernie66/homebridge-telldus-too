// homebridge-telldus-too/lib/TempSensorService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict';

const homebridgeLib = require('homebridge-lib');
const { toEveDate } = require('./utils/dateTimeHelpers');

class TempSensorService extends homebridgeLib.ServiceDelegate {
  static get Temperature() {
    return Temperature;
  }

  static get Humidity() {
    return Humidity;
  }

  static get Settings() {
    return Settings;
  }

  checkObservation() {}
}

class Temperature extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Temperature';
    params.Service = sensorAccessory.Services.eve.TemperatureSensor;
    super(sensorAccessory, params);
    this.randomize = sensorAccessory.randomize;
    this.configHeartrate = sensorAccessory.configHeartrate;

    this.addCharacteristicDelegate({
      key: 'temperature',
      Characteristic: this.Characteristics.eve.CurrentTemperature,
      unit: '°C',
    });

    this.addCharacteristicDelegate({
      key: 'temperatureUnit',
      Characteristic:
        this.Characteristics.hap.TemperatureDisplayUnits,
      value: this.Characteristics.hap.TemperatureDisplayUnits.CELSIUS,
    });

    this.addCharacteristicDelegate({
      key: 'temperatureOffset',
      Characteristic: this.Characteristics.my.Offset,
      value: 0,
    });

    this.addCharacteristicDelegate({
      key: 'observationTime',
      Characteristic: this.Characteristics.eve.ObservationTime,
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      props: {
        minValue: 1,
        maxValue: 360,
        minStep: 1,
      },
      value: sensorAccessory.configHeartrate,
    });

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: sensorAccessory.logLevel,
    });

    // Set a random heartrate between +/-20% of nominal value
    const heartrateRange = this.configHeartrate * 0.2;
    const minHeartrate = this.configHeartrate - heartrateRange;
    const maxHeartrate = this.configHeartrate + heartrateRange;
    const heartrateVariation = Math.floor(
      heartrateRange * 2 * Math.random()
    );
    if (this.randomize) {
      this.newHeartrate =
        this.configHeartrate - heartrateRange + heartrateVariation;
      this.debug(
        'Heartrates: config %s, new %s, current %s',
        this.configHeartrate,
        this.newHeartrate,
        this.values.heartrate
      );
      if (
        this.values.heartrate > minHeartrate &&
        this.values.heartrate < maxHeartrate
      ) {
        this.values.heartrate = this.newHeartrate;
      }
    }
  }

  checkObservation(observation) {
    if (observation.data[0] && observation.data[0].name === 'temp') {
      this.values.temperature =
        Math.round(observation.data[0].value * 10) / 10 +
        this.values.temperatureOffset;
      this.values.observationTime = toEveDate(
        observation.data[0].lastUpdated
      );
    } else {
      this.warn('Temperature data not found for sensor');
    }
  }
}

class Humidity extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Humidity';
    params.Service = sensorAccessory.Services.hap.HumiditySensor;
    super(sensorAccessory, params);

    this.addCharacteristicDelegate({
      key: 'humidity',
      Characteristic:
        this.Characteristics.hap.CurrentRelativeHumidity,
      unit: '%',
    });
  }

  checkObservation(observation) {
    if (
      observation.data[1] &&
      observation.data[1].name === 'humidity'
    ) {
      this.values.humidity = Math.round(observation.data[1].value);
    } else {
      this.warn('Humidity data not found for sensor');
    }
  }
}

class Settings extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Services';
    params.Service = sensorAccessory.Services.my.Resource;
    super(sensorAccessory, params);
    this.configHeartrate = sensorAccessory.configHeartrate;
    this.newHeartrate = sensorAccessory.newHeartrate;

    this.addCharacteristicDelegate({
      key: 'observationTime',
      Characteristic: this.Characteristics.eve.ObservationTime,
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      props: {
        minValue: 1,
        maxValue: 360,
        minStep: 1,
      },
      value: sensorAccessory.heartrate,
    });

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: sensorAccessory.logLevel,
    });
  }

  checkObservation(observation) {
    if (observation.data[0].lastUpdated) {
      this.values.observationTime = toEveDate(
        observation.data[0].lastUpdated
      );
    } else {
      this.warn('Observation time not found for sensor');
    }
  }
}

module.exports = TempSensorService;
