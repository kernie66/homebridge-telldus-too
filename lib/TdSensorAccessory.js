// homebridge-telldus-too/lib/TdSensorAccessory.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict'

const homebridgeLib = require('homebridge-lib')
const { getSensorInfo } = require('./TdApi')
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
    // Set a random default heartrate between 4 to 6 minutes
    const randomHeartrate = Math.floor(4 * 60 + Math.random() * 2 * 60);
    this.heartrate = params.heartrate || randomHeartrate
    this.td = platform.td
    this.api = platform.api
    this.stateCache = platform.stateCache
    this.tempSensorServices = {}

    // Check if we have a temperature sensor, we assume that it is included
    if (this.temperatureSensor) {
      this.tempSensorServices.temperature = new TempSensorService.Temperature(this)
      // Check if we also have a humidity sensor
      if (this.humiditySensor) {
        this.tempSensorServices.humidity = new TempSensorService.Humidity(this)
        // If so, generate history for both temperature and humidity
        this.historyService = new homebridgeLib.ServiceDelegate.History.Weather(
          this, params,
          this.tempSensorServices.temperature.characteristicDelegate('temperature'),
          this.tempSensorServices.humidity.characteristicDelegate('humidity'),
          //      this.wsServices.pressure.characteristicDelegate('pressure')
        )
      }
      // Else just generate history for the temperature
      else {
        this.historyService = new homebridgeLib.ServiceDelegate.History.Weather(
          this, params,
          this.tempSensorServices.temperature.characteristicDelegate('temperature')
        )  
      }
    }
    else {
      this.warn('No temperature sensor included, this plugin needs it.')
    }
    // Add the housekeeping settings
    // this.tempSensorServices.settings = new TempSensorService.Settings(this)

    this.manageLogLevel(
      this.tempSensorServices.temperature.characteristicDelegate('logLevel'), true
    )

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
    if (beat % this.tempSensorServices.temperature.values.heartrate === 0) {
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
        for (const id in this.tempSensorServices) {
          this.tempSensorServices[id].checkObservation(response)
        }
      }
    }
    catch (error) {
      this.warn('Error getting sensor data:', error)
    }
  }
}

module.exports = TdSensorAccessory