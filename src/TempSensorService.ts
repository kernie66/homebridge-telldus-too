// homebridge-telldus-too/lib/TempSensorService.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type { SensorInfoType } from './api/TelldusApi.types.js';
import type TdSensorAccessory from './TdSensorAccessory.js';
import type { SensorServiceParams } from './typings/SensorTypes.js';
import { toEveDate } from './utils/dateTimeHelpers.js';

/*
class TempSensorService<T> extends ServiceDelegate<T> {
  constructor(sensorAccessory: TdSensorAccessory, params: SensorServiceParams) {
    super(sensorAccessory, params);
  }

  static get Temperature() {
    return TemperatureService;
  }

  static get Humidity() {
    return HumidityService;
  }

  static get Settings() {
    return Settings;
  }

  checkObservation(_observation: SensorInfoType) {
    throw new Error('Method not implemented.');
  }
}
*/

type TemperatureServiceValues = {
  temperature?: number;
  temperatureUnit?: number;
  temperatureOffset: number;
  observationTime?: string;
  heartrate: number;
  logLevel: number;
};

class TemperatureService extends ServiceDelegate<TemperatureServiceValues> {
  // name: string;
  randomize: boolean;
  configHeartrate: number;
  newHeartrate!: number;
  // Service: Function;

  constructor(sensorAccessory: TdSensorAccessory, params: SensorServiceParams) {
    params.name = `${sensorAccessory.name} Temperature`;
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
      Characteristic: this.Characteristics.hap.TemperatureDisplayUnits,
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
    const heartrateVariation = Math.floor(heartrateRange * 2 * Math.random());
    if (this.randomize) {
      this.newHeartrate = this.configHeartrate - heartrateRange + heartrateVariation;
      this.debug(
        'Heartrates: config %s, new %s, current %s',
        this.configHeartrate,
        this.newHeartrate,
        this.values.heartrate,
      );
      if (this.values.heartrate > minHeartrate && this.values.heartrate < maxHeartrate) {
        this.values.heartrate = this.newHeartrate;
      }
    }
  }

  checkObservation(observation: SensorInfoType) {
    if (observation.data[0] && observation.data[0].name === 'temp') {
      this.values.temperature = Math.round(observation.data[0].value * 10) / 10 + this.values.temperatureOffset || 0;
      this.values.observationTime = toEveDate(observation.data[0].lastUpdated);
    } else {
      this.warn('Temperature data not found for sensor');
    }
  }
}

type HumidityServiceValues = {
  humidity?: number;
};

class HumidityService extends ServiceDelegate<HumidityServiceValues> {
  constructor(sensorAccessory: TdSensorAccessory, params: SensorServiceParams) {
    params.name = `${sensorAccessory.name} Humidity`;
    params.Service = sensorAccessory.Services.hap.HumiditySensor;
    super(sensorAccessory, params);

    this.addCharacteristicDelegate({
      key: 'humidity',
      Characteristic: this.Characteristics.hap.CurrentRelativeHumidity,
      unit: '%',
    });
  }

  checkObservation(observation: SensorInfoType) {
    if (observation.data[1] && observation.data[1].name === 'humidity') {
      this.values.humidity = Math.round(observation.data[1].value);
    } else {
      this.warn('Humidity data not found for sensor');
    }
  }
}

/*
type SettingsServiceValues = {
  observationTime?: string;
  heartrate: number;
  logLevel: number;
};

class Settings extends ServiceDelegate<SettingsServiceValues> {
  configHeartrate: number;

  constructor(sensorAccessory: TdSensorAccessory, params: SensorServiceParams) {
    params.name = `${sensorAccessory.name} Services`;
    params.Service = sensorAccessory.Services.my.Resource;
    super(sensorAccessory, params);
    this.configHeartrate = sensorAccessory.configHeartrate;

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
  }

  override checkObservation(observation: SensorInfoType) {
    if (observation.data[0]?.lastUpdated) {
      this.values.observationTime = toEveDate(observation.data[0].lastUpdated);
    } else {
      this.warn('Observation time not found for sensor');
    }
  }
}
*/

export { TemperatureService, HumidityService };
