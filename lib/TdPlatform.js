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
const TT = require('./TdTypes')
const TdTypes = TT.TdTypes

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

      /*
            fetch(this.config.ipAddress, { signal: controller.signal })
            .then(response => {
              // completed request before timeout fired
              console.log("IP address found:", this.config.ipAddress)
              // If you only wanted to timeout the request, not the response, add:
              clearTimeout(timeoutId)
            })
      
            if (this.config.delaySwitches.length === 0) {
              this.warn('config.json: no delay switches')
            }
            this.switchAccessories = {}
            const validSwitches = []
            for (const i in this.config.delaySwitches) {
              const delaySwitch = this.config.delaySwitches[i]
              const config = {}
              const optionParser = new homebridgeLib.OptionParser(config, true)
              optionParser
                .stringKey('name')
                // .intKey('delay', 0, 863999)
                .stringKey('delay')
                // .intKey('minDelay', 0)
                .stringKey('minDelay')
                .boolKey('random')
                .boolKey('disableSensor')
                .boolKey('startOnReboot')
                .boolKey('singleActivation')
                .intKey('repeats', -1, 10)
                .stringKey('cronString')
                .intKey('heartrate', 1, 300)
                .boolKey('useConfig')
                .on('userInputError', (error) => {
                  this.warn('config.json: delaySwitches[%d]: %s', i, error)
                })
              optionParser.parse(delaySwitch)
              if (config.name == null) {
                config.name = 'RndDly-' + config.delay + 's'
              }
              config.prefix = config.random ? 'Random ' : 'Fixed '
              config.uuid = UUIDGen.generate(config.name)
              this.debug('Found switch: %s', config.name)
              validSwitches.push(config)
            }
            this.config.delaySwitches = validSwitches
      */
    this.debug('config: %j', this.config)
  }

  async init(beat) {
    try {

      const waitDevices = async () => {
        const response = Promise.race([
          this.api.listDevices(),
          setTimeout(3000, 'Timeout')
        ])
        .catch(error => this.error('Error getting Telldus devices:', error))
  
        this.log('Waiting for response')
        const devices = await response
        if (devices === 'Timeout') {
          this.warn('No response from Telldus, is the IP correct?')
        }
        else {
          this.numberOfDevices = devices.length
          if (this.numberOfDevices) {
            this.log('Number of Telldus devices found:', this.numberOfDevices)
          }
          else {
            this.log('No Telldus devices found!')
          }
        }
      }

      const waitSensors = async () => {
        const response = Promise.race([
          this.api.listSensors(),
          setTimeout(3000, 'Timeout')
        ])
        .catch(error => this.error('Error getting Telldus sensors:', error))
  
        this.log('Waiting for response')
        const sensors = await response
        if (sensors === 'Timeout') {
          this.warn('No response from Telldus, is the IP correct?')
        }
        else {
          this.numberOfSensors = sensors.length
          if (this.numberOfSensors) {
            this.log('Number of Telldus sensors found:', this.numberOfSensors)
          }
          else {
            this.log('No Telldus sensors found!')
          }
        }
      }
      //      })
      await waitDevices()
      this.log('Got devices')
      await waitSensors()
      this.log('Got sensors')
    }
    catch (error) {
      this.log(error)
    }

    const jobs = []
    /*
        for (const delaySwitch of this.config.delaySwitches) {
          const switchParams = {
            name: delaySwitch.name,
            id: delaySwitch.uuid,
            manufacturer: 'Homebridge',
            model: delaySwitch.prefix + 'Delay-' + delaySwitch.delay + 's',
            category: this.Accessory.Categories.Switch,
            delay: delaySwitch.delay,
            minDelay: delaySwitch.minDelay,
            random: delaySwitch.random,
            disableSensor: delaySwitch.disableSensor,
            startOnReboot: delaySwitch.startOnReboot,
            singleActivation: delaySwitch.singleActivation,
            repeats: delaySwitch.repeats,
            cronString: delaySwitch.cronString,
            heartrate: delaySwitch.heartrate,
            useConfig: delaySwitch.useConfig,
          }
          const switchAccessory = new TdAccessory(this, switchParams)
          jobs.push(events.once(switchAccessory, 'initialised'))
          this.switchAccessories[delaySwitch] = switchAccessory
        }
        for (const job of jobs) {
          await job
        }
    */
    this.debug('initialised')
    this.emit('initialised')
  }
}

module.exports = TdPlatform
