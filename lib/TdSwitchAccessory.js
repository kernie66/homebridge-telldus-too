// homebridge-telldus-too/lib/TdSwitchAccessory.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus switch devices.

'use strict'

const homebridgeLib = require('homebridge-lib')
const SwitchService = require('./SwitchService')
const MotionService = require('./MotionService')
const { getDeviceInfo } = require('./TdApi')
const telldus = require('./TdConstants')
const { stateToText } = require('./utils/utils')

class TdSwitchAccessory extends homebridgeLib.AccessoryDelegate {
  constructor(platform, params) {
    super(platform, params)
    //    this.delay = params.delay
    this.id = params.id
    this.deviceId = params.deviceId
    this.model = params.model
    this.modelType = params.modelType
    this.random = params.random || false
    this.delay = params.delay || 60
    //    this.startOnReboot = params.startOnReboot || false
    //    this.singleActivation = params.singleActivation || false
    this.repeats = params.repeats || 0
    this.state = params.state
    //    this.switchOn = this.startOnReboot
    this.heartrate = params.heartrate || 15
    //    this.useConfig = params.useConfig
    this.td = platform.td
    this.api = platform.api
    this.stateCache = platform.stateCache
    this.switchService = new SwitchService(
      this, { primaryService: true },
    )
    this.manageLogLevel(
      this.switchService.characteristicDelegate('logLevel'), true
    )
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
    this.on('initialised', async () => { await this.checkState() })
    this.on('heartbeat', async (beat) => { await this.heartbeat(beat) })
    this.on('shutdown', async () => { return this.shutdown() })
  }

  async shutdown() {
    this.debug('Nothing to do at shutdown')
  }

  async heartbeat(beat) {
    this.checkState()
    if (beat % this.switchService.values.heartrate === 0) {
    }
  }

  // Check the state of the devices using the cached values from the platform
  async checkState() {
    if (!this.switchService.onUpdated) {
      let newValue
      const key = 'ID' + this.deviceId
      const state = this.stateCache.get(key)
      if (state === undefined) {
        this.warn('Cached value does not exist for', key)
      }
      else {
        this.debug('Cached state is [%s] for %s', stateToText(state), key)
        // Check each correct state to avoid undefined values
        if (state === telldus.TURNON) {
          newValue = true
        }
        else if (state === telldus.TURNOFF) {
          newValue = false
        }
        if (this.switchService.values.on !== newValue) {
          this.log('Current state is not same as cached value, new value =', newValue)
          this.switchService.values.on = newValue
        }
      }
    }
    else {
      this.debug('Cache not updated due to switch updating')
    }
  }
}

module.exports = TdSwitchAccessory
