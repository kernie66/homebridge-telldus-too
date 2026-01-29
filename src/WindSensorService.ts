// homebridge-telldus-too/lib/WindSensorService.js
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type { SensorInfoType } from './api/TelldusApi.types.js';
import type TdSensorAccessory from './TdSensorAccessory.js';
import type { SensorServiceParams } from './typings/SensorTypes.js';
import { toEveDate } from './utils/dateTimeHelpers.js';
import { windDirection } from './utils/utils.js';

/*
const homebridgeLib = require('homebridge-lib');
const { toEveDate } = require('./utils/dateTimeHelpers');
const { windDirection } = require('./utils/utils');
*/

class WindSensorService extends ServiceDelegate {
  constructor(sensorAccessory: TdSensorAccessory, params: SensorServiceParams) {
    params.name = sensorAccessory.name + ' Wind';
    params.Service = sensorAccessory.Services.my.Resource;
    super(sensorAccessory, params);

    this.addCharacteristicDelegate({
      key: 'wind',
      Characteristic: this.Characteristics.eve.WindDirection,
    });

    this.addCharacteristicDelegate({
      key: 'windSpeed',
      Characteristic: this.Characteristics.eve.WindSpeed,
    });

    this.addCharacteristicDelegate({
      key: 'maximumWindSpeed',
      Characteristic: this.Characteristics.eve.MaximumWindSpeed,
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
  }

  checkObservation(observation: SensorInfoType) {
    if (observation.data) {
      for (const data of observation.data) {
        if (data.name === 'wdir') {
          this.values.wind = windDirection(data.value);
        }
        if (data.name === 'wavg') {
          this.values.windSpeed = Math.round(data.value * 10) / 10;
        }
        if (data.name === 'wgust') {
          this.values.maximumWindSpeed = Math.round(data.value * 10) / 10;
        }
      }
      this.values.observationTime = toEveDate(observation.lastUpdated);
    } else {
      this.warn('Wind data not found for sensor');
    }
  }
}

export default WindSensorService;
