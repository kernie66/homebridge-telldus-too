// homebridge-telldus-too/lib/SwitchService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus switches.

'use strict'

const homebridgeLib = require('homebridge-lib')
//const AbortController = require('abort-controller')
const { setDevice, dimDevice } = require('./TdApi')
const telldus = require('./TdConstants')
const { wait, toTime, stateToText } = require('./utils/utils')
// const { setTimeout } = require('node:timers/promises')

class SwitchService extends homebridgeLib.ServiceDelegate {
  constructor(switchAccessory, params = {}) {
    params.name = switchAccessory.name
    // If it is a dimmer, set service to lightbulb, else switch
    if (switchAccessory.modelType === 'dimmer') {
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
    this.modelType = switchAccessory.modelType
    this.random = switchAccessory.random
    this.delay = switchAccessory.delay
    this.repeats = switchAccessory.repeats
    this.heartrate = switchAccessory.heartrate
    this.td = switchAccessory.td
    this.state = switchAccessory.state
    this.stateCache = switchAccessory.stateCache
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
    if (this.modelType === 'dimmer') {
      this.debug('Adding brightness to dimmer device')
      this.addCharacteristicDelegate({
        key: 'brightness',
        value: 100,
        unit: '%',
        Characteristic: this.Characteristics.hap.Brightness
      }).on('didSet', (value) => {
        this.log('Brightness value', value)
        this.setDimmerLevel(switchAccessory, value)
      })
    }

    this.addCharacteristicDelegate({
      key: 'random',
      value: this.random,
      Characteristic: this.td.Characteristics.Random,
    })

    this.addCharacteristicDelegate({
      key: 'invertRandomOnce',
      value: false,
      Characteristic: this.td.Characteristics.InvertRandomOnce,
    })

    this.addCharacteristicDelegate({
      key: "delay",
      value: this.delay,
      Characteristic: this.td.Characteristics.Delay,
    })

    this.addCharacteristicDelegate({
      key: 'repeats',
      value: this.repeats,
      Characteristic: this.td.Characteristics.Repeats,
    })

    this.addCharacteristicDelegate({
      key: 'repetition',
      value: 0,
      Characteristic: this.td.Characteristics.Repetition,
    })

    this.addCharacteristicDelegate({
      key: 'status',
      Characteristic: this.td.Characteristics.Status,
      value: 'Initialised'
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

    // Check if switch is to be set after a start of the plugin
    if (this.values.startOnReboot) {
      this.initSwitch()
    }
    // Else make sure we have a clean start, no abort controllers
    else {
      this.timerActive = false
    }
  }

  async initSwitch() {
    await wait(1000)
    this.log('Activate the switch at reboot')
    this.values.on = true
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

  async setOn(switchAccessory) {
    let userControl = false
    let newValue = (this.switchOn !== this.lastSwitchOn)
    const randomDelay = this.values.invertRandomOnce ? !this.values.random : this.values.random
    this.lastSwitchOn = this.switchOn
    this.values.invertRandomOnce = false

    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout)
      // If active timeout and new value, we assume that it is user controlled
      userControl = newValue
      this.activeTimeout = null
      this.log('Switch mute aborted')
    }

    if (this.timerActive) {
      try {
        this.log('Aborting the timer before time is up')
        this.ac.abort()
      } catch (e) {
        this.warn('Error when aborting timer: %s', e.message)
      }
      this.timerActive = false
    }

    // Wait one minute before updating cache from Telldus after switch set
    this.onUpdated = true
    this.activeTimeout = setTimeout(() => {
      this.onUpdated = false
      this.activeTimeout = null
      this.log('Switch mute ends')
    }, 60000)

    if (newValue) {
      const key = 'ID' + switchAccessory.deviceId
      const value = (this.switchOn ? telldus.TURNON : telldus.TURNOFF)
      const success = switchAccessory.stateCache.set(key, value)
      if (success) {
        this.log('State cache set for %s with value [%s]', key, stateToText(value))
      }
      else {
        this.warn("Cache couldn't be updated for", key)
      }
    }

    // Check if this is assumed to be a user controlled action
    if (userControl) {
      if (this.repeatTimeout) {
        clearTimeout(this.repeatTimeout)
        this.values.repetition = 0
        this.values.status = 'Manually controlled'
      }
      await wait(100)
    }
    else {
      const minDelay = this.values.delay * 0.2
      const delayRange = this.values.delay - minDelay
      let delay = 500
      this.ac = new AbortController()
      this.signal = this.ac.signal
      if (this.values.repetition === 0) {
        if (randomDelay) {
          delay = Math.floor(minDelay + Math.random() * delayRange) * 1000
        }
        this.log('Waiting for %d seconds', delay/1000)
        this.timerActive = true
        this.values.status = 'Delaying'
        try {
          await wait(delay, { signal: this.signal })
        }
        catch(err) {
          this.warn('Delay timer aborted:', err)
        }
        this.timerActive = false
        this.log('Delay performed')
      }
    }
    const response = await setDevice(this.api, switchAccessory.deviceId, this.switchOn)

    if (this.values.repetition < this.values.repeats) {
      // Wait for the next attempt, 2 s
      this.repeatTimeout = setTimeout(() => {
        this.values.repetition += 1
        this.log('Repeat command, repetition number: %d of %d', this.values.repetition, this.values.repeats)
        this.setOn(switchAccessory)
        this.values.on = this.switchOn
        this.repeatTimeout = null
      }, 2000)
      this.values.status = 'Repeating'
    }
    else {
      this.values.repetition = 0
      this.values.status = 'Automation done'
    }
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

  // Function to set a new dim level. The function will wait 1 second
  // and abort the command if a new command is received before that.
  // This minimises the number of commands if the level slider is 
  // used in Eve to set the dimmer.
  // The dimmer is turned on automatically if it was off, so the delay
  // ensures that the dim command will be sent after the on command.
  async setDimmerLevel(switchAccessory, dimLevel) {
    // If a dim command is pending, abort it
    if (this.dimming) {
      this.ac.abort()
    }
    this.dimming = true
    this.ac = new AbortController()
    this.signal = this.ac.signal
    // Start a timer for the new dim command
    try {
      await wait(1000, { signal: this.signal })
      this.log('Setting dimmer level to %s\%', dimLevel)
      const response = await dimDevice(this.api, switchAccessory.deviceId, dimLevel)
      if (response === 'Timeout') {
        this.warn('Timeout when setting dim level')
      }
      this.dimming = false
    }
    catch (err) {
      if (!err.message) {
        this.log('The current timer was stopped')
      } else {
        this.warn('The timer was aborted! %s', err.message)
      }
    }

  }
}

module.exports = SwitchService
