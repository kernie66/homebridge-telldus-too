// homebridge-telldus-too/lib/RainSensorService.js
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';
import type { SensorInfoType } from './api/TelldusApi.types.js';
import type TdSensorAccessory from './TdSensorAccessory.js';
import type { SensorServiceParams } from './typings/SensorTypes.js';
import { toEveDate } from './utils/dateTimeHelpers.js';

class RainSensorService extends ServiceDelegate {
  constructor(sensorAccessory: TdSensorAccessory, params: SensorServiceParams) {
    params.name = sensorAccessory.name + ' Rain';
    params.Service = sensorAccessory.Services.my.Resource;
    super(sensorAccessory, params);

    this.addCharacteristicDelegate({
      key: 'rain',
      Characteristic: this.Characteristics.eve.Rain,
    });

    this.addCharacteristicDelegate({
      key: 'rain1h',
      Characteristic: this.Characteristics.eve.Rain1h,
    });

    this.addCharacteristicDelegate({
      key: 'rain24h',
      Characteristic: this.Characteristics.eve.Rain24h,
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
        if (data.name === 'rtot') {
          this.values.rain24h = Math.round(data.value * 10) / 10;
        }
        if (data.name === 'rrate') {
          const rainRate = Math.round(data.value * 10) / 10;
          this.values.rain1h = rainRate;
          this.values.rain = rainRate > 0.2 ? true : false;
        }
      }
      this.values.observationTime = toEveDate(observation.lastUpdated);
    } else {
      this.warn('Rain data not found for sensor');
    }
  }
}

export default RainSensorService;
