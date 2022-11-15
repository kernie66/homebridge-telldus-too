// homebridge-telldus-too/lib/HumidityService.js
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


class HumidityService extends homebridgeLib.ServiceDelegate {
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

module.exports = HumidityService