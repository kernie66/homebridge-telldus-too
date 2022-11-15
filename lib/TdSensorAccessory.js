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
    this.temperatureService = new TemperatureService(
      this, { primaryService: true },
    )
    this.temperatureService.history = new homebridgeLib.ServiceDelegate.History.Weather(
      this, params,
      this.temperatureService.characteristicDelegate('temperature')
      //      this.wsServices.humidity.characteristicDelegate('humidity'),
      //      this.wsServices.pressure.characteristicDelegate('pressure')
    )
    if (this.humiditySensor) {
      this.humidityService = new HumidityService(this)
//      this.humidityService.history = new homebridgeLib.ServiceDelegate.History.Weather(
//        this, params,
//        this.humidityService.characteristicDelegate('humidity'),
//      )  
    }

    this.manageLogLevel(this.temperatureService.characteristicDelegate('logLevel'))
    /*    
        if (!this.disableSensor) {
          this.motionService = new MotionService(
            this, {
              name: this.name,
            }
          )
          this.historyService = new homebridgeLib.ServiceDelegate.History.Motion(
            this, { name: this.name },
            this.motionService.characteristicDelegate('motion'),
            this.motionService.characteristicDelegate('lastActivation')
          )
        }
    */
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
    if (beat % this.temperatureService.values.heartrate === 0) {
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
          this.temperatureService.values.temperature = temperature
          const observationTime = toDate(response.data[0].lastUpdated)
          this.temperatureService.values.observationTime = observationTime
        }
        else {
          this.warn('Temperature data not found for sensor')
        }

        if (this.humiditySensor) {
          if (response.data[1] && response.data[1].name === 'humidity') {
            const humidity = Math.round(response.data[1].value * 10) / 10
            this.humidityService.values.humidity = humidity
            /* Observation time is always the same as above
            const observationTime = toDate(response.data[1].lastUpdated)
            this.humidityService.values.observationTime = observationTime
            */
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
  /*
    // Check the state of the devices using the cached values from the platform
    async checkState() {
      const key = 'ID' + this.deviceId
      const state = this.stateCache.get(key)
      if (state === undefined) {
        this.warn('Cached value does not exist for', key)
      }
      this.debug('Cached state: %s for ID: %s', state, key)
      // Check each correct state to avoid undefined values
      if (this.state === telldus.TURNON) {
        this.switchService.values.on = true
      }
      else if (state === telldus.TURNOFF) {
        this.switchService.values.on = false
      }
    }
  */
}

module.exports = TdSensorAccessory