// homebridge-telldus-too/lib/TempSensorService.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus sensors.

'use strict'

const homebridgeLib = require('homebridge-lib')

class TempSensorService extends homebridgeLib.ServiceDelegate {
  static get Temperature () { return Temperature }

  static get Humidity () { return Humidity }

  static get Settings () { return Settings}
}

class Temperature extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Temperature'
    params.Service = sensorAccessory.Services.eve.TemperatureSensor
    super(sensorAccessory, params)

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
}

class Humidity extends TempSensorService {
  constructor(sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Humidity'
    params.Service = sensorAccessory.Services.hap.HumiditySensor
    super(sensorAccessory, params)
 
    this.addCharacteristicDelegate({
      key: 'humidity',
      Characteristic: this.Characteristics.hap.CurrentRelativeHumidity,
      unit: '%'
    })
  }
}

class Settings extends TempSensorService {
  constructor (sensorAccessory, params = {}) {
    params.name = sensorAccessory.name + ' Services'
    params.Service = sensorAccessory.Services.my.Resource
    super(sensorAccessory, params)

    this.addCharacteristicDelegate({
      key: 'observationTime',
      Characteristic: this.Characteristics.eve.ObservationTime,
      silent: true
    })

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      props: {
        minValue: 1,
        maxValue: 300,
        minStep: 1
      },
      value: sensorAccessory.heartrate
    })

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: sensorAccessory.logLevel
    })
  }
}

module.exports = TempSensorService