// homebridge-telldus-too/lib/TdPlatform.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

'use strict'

const events = require('events')
const homebridgeLib = require('homebridge-lib')
const { LocalApi, LiveApi } = require('telldus-api')
const TdSwitchAccessory = require('./TdSwitchAccessory')
const TdSensorAccessory = require('./TdSensorAccessory')
const { getDevices, getDeviceInfo, getSensors, getSensorInfo } = require('./TdApi')
const TdTypes = require('./TdTypes')
const uuid = require('./utils/uuid')
const NodeCache = require('node-cache')
const { stateToText } = require('./utils/utils')

const temperatureSensors = ['temperature', 'temperaturehumidity', '1A2D', 'F824']
const humiditySensors = ['temperaturehumidity', '1A2D', 'F824']

class TdPlatform extends homebridgeLib.Platform {
  constructor(log, configJson, homebridge) {
    super(log, configJson, homebridge)
    this.once('heartbeat', this.init)
    this.config = {
      name: 'TelldusToo',
    }

    this.stateCache = new NodeCache()
    this.td = new TdTypes(homebridge)
    this.debug('Characteristics: %s', this.td.Characteristics)

    const optionParser = new homebridgeLib.OptionParser(this.config, true)
    optionParser
      .stringKey('name')
      .stringKey('platform')
      .stringKey('ipAddress')
      .stringKey('accessToken')
      .boolKey('random')
      .intKey('delay')
      .intKey('repeats', 0, 5)
      .boolKey('ignoreUnnamedSwitches')
      .boolKey('ignoreUnnamedSensors')
      .stringKey('ignore')
      .intKey('configHeartrate', 1, 300)
      .boolKey('randomize')
      .stringKey('locale')
      .on('userInputError', (message) => {
        this.warn('config.json: %s', message)
      })

    optionParser.parse(configJson)
    if (!this.config.ipAddress) {
      this.warn('IP address missing in config file')
    }
    else if (!this.config.accessToken) {
      this.warn('Access token missing in config file')
    }
    else {
      this.api = new LocalApi({
        host: this.config.ipAddress,
        accessToken: this.config.accessToken
      })
      this.log('Found access token for IP:', this.config.ipAddress)
    }
    if (this.config.ignore) {
      this.config.ignoreIds = this.config.ignore.split(',').map(Number)
      this.log('Found %s IDs to be ignored', this.config.ignoreIds.length)
    }
    this.debug('config: %j', this.config)
    this.on('heartbeat', async (beat) => { await this.platformBeat(beat) })
  }

  async init(beat) {
    let deviceArray = []
    let sensorArray = []

    try {
      // Get devices from Telldus
      const devices = await getDevices(this.api)
      if (devices === 'Timeout') {
        this.warn('No response from Telldus, is the IP correct?')
      }
      else {
        this.numberOfDevices = devices.length
        if (this.numberOfDevices) {
          this.log('Number of Telldus devices found:', this.numberOfDevices)
          devices.forEach(element => {
            deviceArray.push(element.id)
          })
        }
        else {
          this.log('No Telldus devices found!')
        }
        this.deviceArray = deviceArray
      }

      // Get sensors from Telldus
      const sensors = await getSensors(this.api)
      if (sensors === 'Timeout') {
        this.warn('No response from Telldus, is the IP correct?')
      }
      else {
        this.numberOfSensors = sensors.length
        if (this.numberOfSensors) {
          this.log('Number of Telldus sensors found:', this.numberOfSensors)
          sensors.forEach(element => {
            sensorArray.push(element.id)
          })
        }
        else {
          this.log('No Telldus sensors found!')
        }
        this.sensorArray = sensorArray
      }
    }
    catch (error) {
      this.error('Error accessing Telldus:', error)
    }

    this.switchAccessories = {}
    const validSwitches = []

    // Parse the Telldus devices
    for (const id of this.deviceArray) {
      const config = {}
      try {
        const info = await getDeviceInfo(this.api, id)
        if (info === 'Timeout') {
          this.warn('Timeout when parsing device ID:', id)
          continue
        }
        config.id = info.id
        if (!info.name && this.config.ignoreUnnamedSwitches) {
          this.log('Ignoring unnamed switch with ID:', info.id)
          continue
        }
        config.name = info.name || 'Device ' + config.id
        config.uuid = uuid(config.name + config.id)
        // Split manufacturer and model
        const modelSplit = (info.model || '').split(':');
        config.model = modelSplit[0] || 'unknown';
        config.manufacturer = modelSplit[1] || 'unknown';
        config.modelType = (config.model === 'selflearning-dimmer' ? 'dimmer' : 'switch')
        config.methods = info.methods
        config.protocol = info.protocol
        config.state = info.state
        config.type = info.type
        if (config.modelType === 'dimmer') {
          config.category = this.Accessory.Categories.Lightbulb
        }
        else {
          config.category = this.Accessory.Categories.Switch
        }
        if (this.config.ignoreIds.includes(config.id)) {
          this.log('Ignoring %s: %s, ID: %s', config.modelType, config.name, config.id)
        }
        else {
          this.log('Found %s: %s, ID: %s', config.modelType, config.name, config.id)
          validSwitches.push(config)
        }
      }
      catch (error) {
        this.warn('Error getting device info:', error)
      }
    }
    this.log('Number of valid switches', validSwitches.length)

    this.sensorAccessories = {}
    const validSensors = []

    // Parse the Telldus sensors
    for (const id of this.sensorArray) {
      const config = {}
      const info = await getSensorInfo(this.api, id)
      if (info === 'Timeout') {
        this.warn('Timeout when parsing sensor ID:', id)
        continue
      }
      if (!info.name && this.config.ignoreUnnamedSensors) {
        this.log('Ignoring unnamed sensor with ID:', info.id)
        continue
      }
      config.id = info.id
      config.name = info.name || 'Sensor ' + info.id
      config.uuid = uuid(config.name + config.id)
      const sensorType = this.checkSensorType(info)
      config.model = sensorType
      if (sensorType.includes('temperature')) {
        config.temperatureSensor = true
      }
      if (sensorType.includes('humidity')) {
        config.humiditySensor = true
      }
      config.manufacturer = 'Telldus'
      config.protocol = info.protocol
      config.randomize = this.config.randomize
      config.configHeartrate = this.config.configHeartrate
      config.category = this.Accessory.Categories.Sensor
      if (this.config.ignoreIds.includes(config.id)) {
        this.log('Ignoring sensor: %s, ID: %s', config.name, config.id)
      }
      else {
        this.log('Found sensor: %s, ID: %s', config.name, config.id)
        validSensors.push(config)
      }
    }
    this.log('Number of valid sensors', validSensors.length)

    const jobs = []

    for (const tdSwitch of validSwitches) {
      const switchParams = {
        name: tdSwitch.name,
        id: tdSwitch.uuid,
        deviceId: tdSwitch.id,
        //        uuid: tdSwitch.uuid,
        manufacturer: tdSwitch.manufacturer,
        model: tdSwitch.model,
        modelType: tdSwitch.modelType,
        firmware: 'ID-' + tdSwitch.id,
        state: tdSwitch.state,
        api: this.api,
        stateCache: this.stateCache,
        category: tdSwitch.category,
        //        delay: delaySwitch.delay,
        //        minDelay: delaySwitch.minDelay,
        random: this.config.random,
        //        disableSensor: delaySwitch.disableSensor,
        //        startOnReboot: delaySwitch.startOnReboot,
        //        singleActivation: delaySwitch.singleActivation,
        //        repeats: delaySwitch.repeats,
        //        heartrate: delaySwitch.heartrate,
        //        useConfig: delaySwitch.useConfig,
      }
      this.log('Processing %s %s, State: [%s]', switchParams.modelType, switchParams.name, stateToText(switchParams.state))
      const switchAccessory = new TdSwitchAccessory(this, switchParams)
      jobs.push(events.once(switchAccessory, 'initialised'))
      this.switchAccessories[tdSwitch] = switchAccessory
    }

    for (const tdSensor of validSensors) {
      const sensorParams = {
        name: tdSensor.name,
        sensorId: tdSensor.id,
        id: tdSensor.uuid,
        manufacturer: tdSensor.manufacturer,
        model: tdSensor.model,
        temperatureSensor: tdSensor.temperatureSensor || false,
        humiditySensor: tdSensor.humiditySensor || false,
        configHeartrate: tdSensor.configHeartrate,
        randomize: tdSensor.randomize,
        firmware: 'ID-' + tdSensor.id,
        category: tdSensor.category,
      }
      this.log('Processing sensor', sensorParams.name)
      if (sensorParams.temperatureSensor) {
        const sensorAccessory = new TdSensorAccessory(this, sensorParams)
        jobs.push(events.once(sensorAccessory, 'initialised'))
        this.sensorAccessories[tdSensor] = sensorAccessory
      }
      else {
        this.log('Not a temperature sensor, skipping for now...')
      }
    }

    for (const job of jobs) {
      await job
    }

    this.debug('initialised')
    this.emit('initialised')
  }

  // Check the state of all Telldus devices and cache the result
  // This minimises the number of accesses to the Telldus gateway
  async platformBeat(beat) {
    if (beat % 10 === 0) {
      this.debug('Platform heartbeat...')
      // Get states of all devices from Telldus
      const devices = await getDevices(this.api, 5000)
      if (devices === 'Timeout') {
        this.warn('Timeout from Telldus when getting states, will try again')
      }
      else {
        this.numberOfDevices = devices.length
        if (this.numberOfDevices) {
          devices.forEach(element => {
            const key = 'ID' + element.id
            const success = this.stateCache.set(key, element.state)
            if (!success) {
              this.warn("Couldn't cache state for Telldus devices, will try again")
            }
            else {
              this.debug('Stored state [%s] for key %s', stateToText(element.state), key)
            }
          })
        }
        else {
          this.debug('No Telldus devices found in platformBeat!')
        }
      }
    }
  }

  checkSensorType(sensorInfo) {
    let sensorType
    // Check the obvious models
    if (sensorInfo.model === 'temperature' || sensorInfo.model === 'temperaturehumidity') {
      return sensorInfo.model
    }
    // Check for temperature and possibly humidity sensor
    if (sensorInfo.data[0] && sensorInfo.data[0].name === 'temp') {
      sensorType = 'temperature'
      if (sensorInfo.data[1] && sensorInfo.data[1].name === 'humidity') {
        sensorType = sensorType + 'humidity'
      }
      return sensorType
    }
    // Check for wind sensor
    if (sensorInfo.data[0] && sensorInfo.data[0].name === 'wdir') {
      return 'wind'
    }
    // Check for rain sensor
    if (sensorInfo.data[0] && sensorInfo.data[0].name === 'rtot') {
      return 'rain'
    }
  }
}

module.exports = TdPlatform
