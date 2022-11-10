// homebridge-random-delay-switches/lib/RdsAccessory.js
// Copyright © 2021 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for random delay switches.

'use strict'

const homebridgeLib = require('homebridge-lib')
const SwitchService = require('./SwitchService')
const MotionService = require('./MotionService')
const { getDeviceInfo } = require('./TdApi')
const telldus = require('./TdConstants')

class TdAccessory extends homebridgeLib.AccessoryDelegate {
  constructor (platform, params) {
    super(platform, params)
//    this.delay = params.delay
    this.id = params.id
    this.deviceId = params.deviceId
    this.random = params.random || false
//    this.startOnReboot = params.startOnReboot || false
//    this.singleActivation = params.singleActivation || false
    this.repeats = params.repeats || 0
    this.state = params.state
//    this.switchOn = this.startOnReboot
    this.heartrate = params.heartrate || 15
//    this.useConfig = params.useConfig
    this.td = platform.td
    this.api = platform.api
    this.switchService = new SwitchService(
      this, { primaryService: true }, 
    )
    this.manageLogLevel(this.switchService.characteristicDelegate('logLevel'))
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

  async shutdown () {
    this.debug('Nothing to do at shutdown')
  }

  async heartbeat (beat) {
    if (beat % this.switchService.values.heartrate === 0) {
      this.checkState()
    }
  }

  async checkState () {
    const result = await getDeviceInfo(this.api, this.deviceId)
    this.log('Switch state:', result.state, ' Current:', this.switchService.values.on, telldus.TURNON, result.state == telldus.TURNON)
    this.switchService.values.on = (result.state == telldus.TURNON)
  }

}

module.exports = TdAccessory
