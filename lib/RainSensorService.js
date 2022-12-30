// homebridge-telldus-too/lib/RainSensorService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict'

const homebridgeLib = require('homebridge-lib')
const { toDate } = require('./utils/utils')

class RainSensorService extends homebridgeLib.ServiceDelegate {
  static get Rain() { return Rain }

  checkObservation() { }
}

class Rain extends RainSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Rain'
    params.Service = sensorAccessory.Services.eve.TemperatureSensor
    super(sensorAccessory, params)
    this.randomize = sensorAccessory.randomize
    this.configHeartrate = sensorAccessory.configHeartrate

    this.addCharacteristicDelegate({
      key: 'temperature',
      Characteristic: this.Characteristics.eve.CurrentTemperature,
      unit: '°C'
    })

    this.addCharacteristicDelegate({
      key: 'temperatureUnit',
      Characteristic: this.Characteristics.hap.TemperatureDisplayUnits,
      value: this.Characteristics.hap.TemperatureDisplayUnits.CELSIUS
    })

    this.addCharacteristicDelegate({
      key: 'temperatureOffset',
      Characteristic: this.Characteristics.my.Offset,
      value: 0
    })

    this.addCharacteristicDelegate({
      key: 'observationTime',
      Characteristic: this.Characteristics.eve.ObservationTime,
      silent: true
    })

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      props: {
        minValue: 1,
        maxValue: 360,
        minStep: 1
      },
      value: sensorAccessory.configHeartrate
    })

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: sensorAccessory.logLevel
    })

    // Set a random heartrate between +/-20% of nominal value
    const heartrateRange = this.configHeartrate * 0.2
    const minHeartrate = this.configHeartrate - heartrateRange
    const maxHeartrate = this.configHeartrate + heartrateRange
    const heartrateVariation = Math.floor(heartrateRange * 2 * Math.random());
    if (this.randomize) {
      this.newHeartrate = this.configHeartrate - heartrateRange + heartrateVariation
      this.debug('Heartrates: config %s, new %s, current %s', this.configHeartrate, this.newHeartrate, this.values.heartrate)
      if (this.values.heartrate > minHeartrate && this.values.heartrate < maxHeartrate) {
        this.values.heartrate = this.newHeartrate
      }
    }

  }

  checkObservation(observation) {
    if (observation.data[0] && observation.data[0].name === 'temp') {
      this.values.temperature = Math.round(observation.data[0].value * 10) / 10 + this.values.temperatureOffset
      this.values.observationTime = toDate(observation.data[0].lastUpdated)
    }
    else {
      this.warn('Temperature data not found for sensor')
    }
  }
}

module.exports = RainSensorService