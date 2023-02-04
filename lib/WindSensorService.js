// homebridge-telldus-too/lib/WindSensorService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict';

const homebridgeLib = require('homebridge-lib');
const { toEveDate } = require('./utils/dateTimeHelpers');
const { windDirection } = require('./utils/utils');

class WindSensorService extends homebridgeLib.ServiceDelegate {
  static get Wind() {
    return Wind;
  }

  checkObservation() {}
}

class Wind extends WindSensorService {
  constructor(sensorAccessory, params = {}) {
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

  checkObservation(observation) {
    if (observation.data[0] && observation.data[0].name === 'wdir') {
      this.values.wind = windDirection(observation.data[0].value);
      this.values.windSpeed =
        Math.round(observation.data[1].value * 10) / 10;
      this.values.maximumWindSpeed =
        Math.round(observation.data[2].value * 10) / 10;
      this.values.observationTime = toEveDate(
        observation.lastUpdated
      );
    } else {
      this.warn('Wind data not found for sensor');
    }
  }
}

module.exports = WindSensorService;
