// homebridge-telldus-too/lib/TdTypes.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Custom HomeKit Characteristics and common functions.

const homebridgeLib = require('homebridge-lib')
const uuid = require('./utils/uuid')

class TdTypes extends homebridgeLib.CustomHomeKitTypes {
  constructor (homebridge) {
    super(homebridge)

    this.createCharacteristicClass('Delay', uuid('0A0'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS,
      minValue: 0,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE, this.Perms.HIDDEN],
    }, 'Delay time')

    this.createCharacteristicClass('MinDelay', uuid('0A1'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS,
      minValue: 0,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE, this.Perms.HIDDEN],
    }, 'Delay time (minimum)')

    this.createCharacteristicClass('TimeOut', uuid('0A2'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS,
      minValue: 0,
//      maxValue: 3600,
      perms: [this.Perms.READ, this.Perms.NOTIFY],
    }, 'Current timeout value')

    this.createCharacteristicClass('Repeats', uuid('0A3'), {
      format: this.Formats.INT8,
      minValue: -1,
      maxValue: 10,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Repetitions (total)')

    this.createCharacteristicClass('Repetition', uuid('0A4'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 10,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Repetition (current)')

    this.createCharacteristicClass('Random', uuid('0A9'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Random enabled')
  }
}

module.exports = TdTypes