// homebridge-telldus-too/lib/TdPlatform.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

'use strict'

const events = require('events')
const homebridgeLib = require('homebridge-lib')
const { LocalApi, LiveApi } = require('telldus-api')
const { setTimeout } = require('node:timers/promises')
const TdAccessory = require('./TdAccessory')
const { getDevices, getDeviceInfo, getSensors, getSensorInfo } = require('./TdApi')
const TdTypes = require('./TdTypes')
const uuid = require('./utils/uuid')

class TdPlatform extends homebridgeLib.Platform {
  constructor(log, configJson, homebridge) {
    super(log, configJson, homebridge)
    this.once('heartbeat', this.init)
    this.config = {
      name: 'TelldusToo',
    }

    let UUIDGen = homebridge.hap.uuid
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
      .stringKey('ignore')
      .intKey('heartrate', 1, 300)
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
          this.deviceArray = deviceArray
        }
        else {
          this.log('No Telldus devices found!')
        }
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
          this.sensorArray = sensorArray
        }
        else {
          this.log('No Telldus sensors found!')
        }
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
        config.id = info.id.toString()
        config.numId = info.id
        config.name = info.name || 'Device ' + config.id
        config.uuid = uuid(config.name + config.id)
        // Split manufacturer and model
        const modelSplit = (info.model || '').split(':');
        config.model = modelSplit[0] || 'unknown';
        config.manufacturer = modelSplit[1] || 'unknown';
        config.methods = info.methods
        config.protocol = info.protocol
        config.state = info.state
        config.type = info.type
        if (this.config.ignoreIds.includes(Number(config.id))) {
          this.log('Ignoring switch: %s, ID: %s', config.name, config.id)
        }
        else {
          this.log('Found switch: %s, ID: %s', config.name, config.id)
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
      config.id = info.id.toString()
      config.numId = info.id
      config.name = info.name || 'Sensor ' + info.id
      config.uuid = uuid(config.name + config.id)
      config.model = info.model
      config.manufacturer = 'Telldus'
      config.protocol = info.protocol
      if (info.model === 'selflearning-dimmer') {
        config.category = this.Accessory.Categories.Lightbulb
      }
      else {
        config.category = this.Accessory.Categories.Switch
      }
      if (this.config.ignoreIds.includes(config.numId)) {
        this.log('Ignoring sensor: %s, ID: %s', config.name, config.id)
      }
      else {
        this.log('Found sensor: %s, ID: %s', config.name, config.id)
        validSensors.push(config)
      }
    }
    this.log('Number of valid sensors', validSensors.length)

    const jobs = []

//    for (const i in validSwitches) {
//      const tdSwitch = validSwitches[i]
    for (const tdSwitch of validSwitches) {
      const switchParams = {
        name: tdSwitch.name,
        id: tdSwitch.uuid,
        deviceId: tdSwitch.id,
//        uuid: tdSwitch.uuid,
        manufacturer: tdSwitch.manufacturer,
        model: tdSwitch.model,
        firmware: tdSwitch.uuid.substring(0, 7),
        state: tdSwitch.state,
        api: this.api,
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
      this.log('Processing switch', switchParams.name, ', State', switchParams.state)
      const switchAccessory = new TdAccessory(this, switchParams)
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
        firmware: tdSensor.uuid.substring(0, 7),
        category: this.Accessory.Categories.Sensor,
//        heartrate: delaySwitch.heartrate,
      }
      this.log('Processing sensor', sensorParams.name)
      //          const switchAccessory = new TdAccessory(this, switchParams)
      //          jobs.push(events.once(switchAccessory, 'initialised'))
      //          this.switchAccessories[delaySwitch] = switchAccessory
    }

    for (const job of jobs) {
      await job
    }

    this.debug('initialised')
    this.emit('initialised')
  }
}

module.exports = TdPlatform
