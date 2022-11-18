// homebridge-telldus-too/lib/TempSensorService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict'

const homebridgeLib = require('homebridge-lib')
//const AbortController = require('abort-controller')
//const CronJob = require('cron').CronJob
//const cronstrue = require('cronstrue')
const { setDevice, dimDevice } = require('./TdApi')
const DateTime = require('luxon').DateTime
const TdTypes = require('./TdTypes')
const telldus = require('./TdConstants')
const { getTimestamp, wait, toTime } = require('./utils/utils')

class TempSensorService extends homebridgeLib.ServiceDelegate {
  static get Temperature () { return Temperature }

  static get Humidity () { return Humidity }
}

class Temperature extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Temperature'
    params.Service = sensorAccessory.Services.eve.TemperatureSensor
    super(sensorAccessory, params)
    // this.delay = sensorAccessory.delay
    // this.minDelay = sensorAccessory.minDelay
    this.sensorId = sensorAccessory.sensorId
    this.model = sensorAccessory.model
    this.heartrate = sensorAccessory.heartrate
    this.td = sensorAccessory.td
    this.state = sensorAccessory.state
    this.api = sensorAccessory.api
    this.timeout = params.timeout

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
      key: 'observationTime',
      Characteristic: this.Characteristics.eve.ObservationTime,
      silent: true
    })

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      props: {
        minValue: 1,
        maxValue: 300,
        minStep: 1
      },
      value: this.heartrate
    })

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: sensorAccessory.logLevel
    })
  }
}


class Humidity extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Humidity'
    params.Service = sensorAccessory.Services.hap.HumiditySensor
    super(sensorAccessory, params)
    // this.delay = sensorAccessory.delay
    // this.minDelay = sensorAccessory.minDelay
    this.sensorId = sensorAccessory.sensorId
    this.model = sensorAccessory.model
    this.heartrate = sensorAccessory.heartrate
    this.td = sensorAccessory.td
    this.api = sensorAccessory.api
    this.timeout = params.timeout

    this.addCharacteristicDelegate({
      key: 'humidity',
      Characteristic: this.Characteristics.hap.CurrentRelativeHumidity,
      unit: '%'
    })
    
    /* Observation time is always the same as for the temperature
    this.addCharacteristicDelegate({
      key: 'observationTime',
      Characteristic: this.Characteristics.eve.ObservationTime
    })
    */
  }
}

module.exports = TempSensorService