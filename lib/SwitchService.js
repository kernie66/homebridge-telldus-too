// homebridge-random-delay-switches/lib/SwitchService.js
// Copyright © 2021 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for random delay switches.

'use strict'

const homebridgeLib = require('homebridge-lib')
//const AbortController = require('abort-controller')
//const CronJob = require('cron').CronJob
//const cronstrue = require('cronstrue')
const { setDevice } = require('./TdApi')
const DateTime = require('luxon').DateTime
const TdTypes = require('./TdTypes')
const telldus = require('./TdConstants')
const { getTimestamp, wait, toTime } = require('./utils/utils')


class SwitchService extends homebridgeLib.ServiceDelegate {
  constructor(switchAccessory, params = {}) {
    params.name = switchAccessory.name
    // If it is a dimmer, set service to lightbulb
    if (switchAccessory.model === 'dimmer') {
      params.Service = switchAccessory.Services.hap.Lightbulb
    }
    else {
      params.Service = switchAccessory.Services.hap.Switch
    }
    super(switchAccessory, params)
    // this.delay = switchAccessory.delay
    // this.minDelay = switchAccessory.minDelay
    this.deviceId = switchAccessory.deviceId
    this.model = switchAccessory.model
    this.random = switchAccessory.random
    this.heartrate = switchAccessory.heartrate
    this.td = switchAccessory.td
    this.state = switchAccessory.state
    this.api = switchAccessory.api
    this.timeout = params.timeout

    this.addCharacteristicDelegate({
      key: 'on',
      Characteristic: this.Characteristics.hap.On,
      value: (this.state == telldus.TURNON)
    }).on('didSet', (value) => {
      this.switchOn = value
      this.setOn(switchAccessory)
    }).on('didTouch', (value) => {
      if (!this.singleActivation) {
        this.switchOn = value
        this.log("Repeat 'setOn' with value %s", this.switchOn)
        this.setOn(switchAccessory)
      } else {
        this.log('Multiple activations disabled')
      }
    })

    // Add brightness characteristics to dimmer device
    if (this.model === 'dimmer') {
      this.log('Adding brightness')
      this.addCharacteristicDelegate({
        key: 'brightness',
        value: 100,
        unit: '%',
        Characteristic: this.Characteristics.hap.Brightness
      }).on('didSet', (value) => {
        this.log('Brightness value', value)
      })
    }

    this.addCharacteristicDelegate({
      key: 'random',
      value: this.random,
      Characteristic: this.td.Characteristics.Random,
    })

    this.addCharacteristicDelegate({
      key: 'repeats',
      value: this.repeats,
      Characteristic: this.td.Characteristics.Repeats,
    })

    this.addCharacteristicDelegate({
      key: 'repetition',
      Characteristic: this.td.Characteristics.Repetition,
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
      value: switchAccessory.logLevel
    })

    // Check if the switch was on before plugin started and not stateful
    if (this.values.on && this.values.delay) {
      this.continueSwitch(switchAccessory)
    }
    // Check if switch is to be set after a start of the plugin
    else if (this.values.startOnReboot) {
      this.initSwitch()
    }
    // Else make sure we have a clean start, no abort controllers
    else {
      this.timeUp = true
    }
  }

  async initSwitch() {
    await wait(1000)
    this.log('Start the timer at reboot')
    this.values.on = true
  }

  async continueSwitch(switchAccessory) {
    await wait(1000)
    this.log('Switch was on at reboot')
    this.switchOn = true  // Set to enable restart of timer
    this.timeUp = true  // Set to not try to abort the abort controller
    // Check if time left is less than 5 seconds, then use 5 seconds
    let delayValue = Math.max(this.values.timestamp - getTimestamp(), 5)
    this.log('Delay time left = %d', delayValue)
    this.setOn(switchAccessory, delayValue)
  }

  async setConfigValues() {
    this.time = toTime(this.delay)
    this.values.delayDays = this.time.days
    this.values.delayHours = this.time.hours
    this.values.delayMinutes = this.time.minutes
    this.values.delaySeconds = this.time.seconds
    this.values.minDelay = this.minDelay
    this.values.minDelayPercentage = (this.minDelay / this.delay * 100).toFixed() 
    this.values.random = this.random
    this.values.repeats = this.repeats
    this.values.cron = this.cronString
    this.values.heartrate = this.heartrate
    await wait(500)
    this.values.setDefault = false
  }

  async setOn(switchAccessory, delayValue) {
    // Add a delay so that values can be changed in scenes
    // before the switch is started
/*
    this.log('Starting the mute timer for %d s', this.mute)
    this.timeUp = false
    try {
      await wait(this.mute * 1000, { signal: this.signal })
      this.log('Mute time is up!')
      this.timeUp = true
      this.values.on = false
      this.switchOn = false
    } catch (err) {
      this.warn('The mute timer was aborted!')
    }
*/
    await wait(500)
    const response = await setDevice(this.api, switchAccessory.deviceId, this.switchOn)
/*    
    let delayType = ''
    // Check if switch is turned off
    if (!this.switchOn) {
      // Check if the timer is active
      if (!this.timeUp) {
        try {
          this.debug('Aborting the timer before time is up')
          this.ac.abort()
        } catch (e) {
          this.warn('Error when aborting timer: %s', e.message)
        }
        this.timeUp = true
        this.timeLeft = 0
      }
      // Actions when switch is turned on
    } else {
      // Check if timer is already active
      if (!this.timeUp) {
        try {
          this.log('Restarting/extending the timer...')
          this.ac.abort()
          await wait(500)  // Wait for the abort to complete
        } catch (e) {
          this.warn('Error when restarting timer: %s', e.message)
        }
        this.timeUp = true
        this.timeLeft = 0
      }
      this.ac = new AbortController()
      this.signal = this.ac.signal
      // Check if this is a continued start after restart
      if (delayValue) {
        this.values.timeout = delayValue
        delayType = 'continued'
      } else {
        if (this.values.minDelay > this.values.delay) {
          this.values.minDelay = this.values.delay
        }
        // Set the delay time and type
        if (this.values.random) {
          this.values.timeout = Math.floor(this.values.minDelay + Math.random() * (this.values.delay - this.values.minDelay) + 1);
          delayType = 'random'
        } else if (!this.values.delay) {
          this.values.timeout = 0
          delayType = 'stateful'
        } else {
          this.values.timeout = this.values.delay;
          delayType = 'fixed'
        }
      }
      // Set the Unix timestamp for the end of the delay
      this.values.timestamp = getTimestamp() + this.values.timeout
      this.log('Starting the timer with %s delay: %d s', delayType, this.values.timeout)
      this.timeUp = false
      this.values.timeLeft = this.values.timeout
      try {
        await wait(this.values.timeout * 1000, { signal: this.signal })
        this.log('Time is up!')
        this.timeUp = true
        this.values.timeLeft = 0
        this.values.timestamp = 0
        // Only turn off the switch if delay > 0, else stateful switch
        if (this.values.timeout) {
          this.values.on = false
          this.switchOn = false
        }
        if (!this.disableSensor) {
          this.log('Triggering motion sensor')
          switchAccessory.emit('trigger', true)
        }
        if (this.values.repetition < this.values.repeats || this.values.repeats < 0) {
          await wait(2000) // Wait for the motion to complete, 2 s
          this.values.repetition += 1
          this.log('Restart, repetition number: %d of %d', this.values.repetition, this.values.repeats)
          this.values.on = true
        } else {
          this.values.repetition = 0
        }
      } catch (err) {
        if (!err.message) {
          this.log('The current timer was stopped')
        } else {
          this.warn('The timer was aborted! %s', err.message)
        }
        this.values.repetition = 0
        this.timeUp = true
        this.values.timeLeft = 0
        this.values.timestamp = 0
      }
    }
*/
  }
}

module.exports = SwitchService
