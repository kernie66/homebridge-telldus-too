// homebridge-telldus-too/lib/TdSensorAccessory.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict'

const homebridgeLib = require('homebridge-lib')
const TemperatureService = require('./TemperatureService')
const MotionService = require('./MotionService')
const { getSensorInfo } = require('./TdApi')
const telldus = require('./TdConstants')
const HumidityService = require('./HumidityService')
const { toDate } = require('./utils/utils')
const TempSensorService = require('./TempSensorService')

class TdSensorAccessory extends homebridgeLib.AccessoryDelegate {
  constructor(platform, params) {
    super(platform, params)
    //    this.delay = params.delay
    this.id = params.id
    this.sensorId = params.sensorId
    this.model = params.model
    this.temperatureSensor = params.temperatureSensor
    this.humiditySensor = params.humiditySensor
    this.heartrate = params.heartrate || 300
    this.td = platform.td
    this.api = platform.api
    this.stateCache = platform.stateCache
    this.tempSensorServices = {}

    if (this.temperatureSensor) {
      this.tempSensorServices.temperature = new TempSensorService.Temperature(this)
    }

    if (this.humiditySensor) {
      this.tempSensorServices.humidity = new TempSensorService.Humidity(this)
      this.tempSensorServices.history = new homebridgeLib.ServiceDelegate.History.Weather(
        this, params,
        this.tempSensorServices.temperature.characteristicDelegate('temperature'),
        this.tempSensorServices.humidity.characteristicDelegate('humidity'),
        //      this.wsServices.pressure.characteristicDelegate('pressure')
      )
    }
    else {
      this.tempSensorServices.history = new homebridgeLib.ServiceDelegate.History.Weather(
        this, params,
        this.tempSensorServices.temperature.characteristicDelegate('temperature')
      )  
    }

    this.tempSensorServices.settings = new TempSensorService.Settings(this)

    this.manageLogLevel(this.tempSensorServices.settings.characteristicDelegate('logLevel'))

    this.debug('Accessory initialised')
    this.heartbeatEnabled = true
    setImmediate(() => {
      this.emit('initialised')
    })
    this.on('initialised', async () => { await this.getSensorData() })
    this.on('heartbeat', async (beat) => { await this.heartbeat(beat) })
    this.on('shutdown', async () => { return this.shutdown() })
  }

  async shutdown() {
    this.debug('Nothing to do at shutdown')
  }

  async heartbeat(beat) {
    if (beat % this.tempSensorServices.settings.values.heartrate === 0) {
      this.getSensorData()
      //      this.checkState()
    }
  }

  async getSensorData() {
    try {
      const response = await getSensorInfo(this.api, this.sensorId)
      if (response === 'Timeout') {
        this.warn('Timeout when reading sensor data')
      }
      else {
        this.debug('Sensor data:', response)
        if (response.data[0] && response.data[0].name === 'temp') {
          const temperature = Math.round(response.data[0].value * 10) / 10
          this.tempSensorServices.temperature.values.temperature = temperature
          const observationTime = toDate(response.data[0].lastUpdated)
          this.tempSensorServices.settings.values.observationTime = observationTime
        }
        else {
          this.warn('Temperature data not found for sensor')
        }

        if (this.humiditySensor) {
          if (response.data[1] && response.data[1].name === 'humidity') {
            const humidity = Math.round(response.data[1].value * 10) / 10
            this.tempSensorServices.humidity.values.humidity = humidity
          }
          else {
            this.warn('Humidity data not found for sensor')
          }
        }
      }
    }
    catch (error) {
      this.warn('Error getting sensor data:', error)
    }
  }
}

module.exports = TdSensorAccessory