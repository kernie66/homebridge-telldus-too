// homebridge-telldus-too/lib/SensorService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict'

const homebridgeLib = require('homebridge-lib')
//const AbortController = require('abort-controller')
//const CronJob = require('cron').CronJob
//const cronstrue = require('cronstrue')
const { setDevice, dimDevice } = require('./TdApi')
const DateTime = require('luxon').DateTime
const TdTypes = require('./TdTypes')
const telldus = require('./TdConstants')
const { getTimestamp, wait, toTime } = require('./utils/utils')


class SensorService extends homebridgeLib.ServiceDelegate {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Temperature'
    // If it is a dimmer, set service to lightbulb
    if (sensorAccessory.modelType === 'dimmer') {
      params.Service = sensorAccessory.Services.hap.HumiditySensor
    }
    else {
      params.Service = sensorAccessory.Services.eve.TemperatureSensor
    }
    super(sensorAccessory, params)
    // this.delay = sensorAccessory.delay
    // this.minDelay = sensorAccessory.minDelay
    this.sensorId = sensorAccessory.sensorId
    this.model = sensorAccessory.model
    this.temperatureSensor = sensorAccessory.temperatureSensor
    this.humiditySensor = sensorAccessory.humiditySensor
    this.heartrate = sensorAccessory.heartrate
    this.td = sensorAccessory.td
    this.state = sensorAccessory.state
    this.api = sensorAccessory.api
    this.timeout = params.timeout

    if (this.temperatureSensor) {
      this.addCharacteristicDelegate({
        key: 'temperature',
        Characteristic: this.Characteristics.eve.CurrentTemperature,
        unit: '°C'
      })
      this.addCharacteristicDelegate({
        key: 'temperatureUnit',
        Characteristic: this.Characteristics.hap.TemperatureDisplayUnits,
        value: this.Characteristics.hap.TemperatureDisplayUnits.CELSIUS
      })
    }
/*
    if (this.humiditySensor) {
      this.addCharacteristicDelegate({
        key: 'humidity',
        Characteristic: this.Characteristic.hap.CurrentRelativeHumidity,
        unit: '%'
      })
    }
  */
    /*
        }).on('didSet', (value) => {
          this.switchOn = value
          this.setOn(sensorAccessory)
        }).on('didTouch', (value) => {
          if (!this.singleActivation) {
            this.sensorOn = value
            this.log("Repeat 'setOn' with value %s", this.sensorOn)
            this.setOn(sensorAccessory)
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
            this.setDimmerLevel(sensorAccessory, value)
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
    */
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
      value: sensorAccessory.logLevel
    })
  }
}

module.exports = SensorService