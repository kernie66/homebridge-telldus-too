// homebridge-telldus-too/lib/TemperatureService.js
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


class TemperatureService extends homebridgeLib.ServiceDelegate {
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

module.exports = TemperatureService