// homebridge-telldus-too/lib/TdTypes.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Custom HomeKit Characteristics and common functions.

const homebridgeLib = require('homebridge-lib')
const DateTime = require('luxon').DateTime
const { v5: uuidv5, NIL: NIL_UUID } = require('uuid');

const UUID_NAMESPACE = uuidv5("homebridge-telldus-too", NIL_UUID)

const getTimestamp = () => DateTime.now().toUnixInteger()

const sleep = (seconds) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, seconds * 1000)
  })
}

function wait(ms, opts = {}) {
  return new Promise((resolve, reject) => {
    let timerId = setTimeout(resolve, ms);
    if (opts.signal) {
      // implement aborting logic for our async operation
      opts.signal.addEventListener('abort', event => {
        clearTimeout(timerId);
        reject(event);
      })
    }
  })
}

// Convert seconds to HH:MM:SS format
function toTime(seconds) {
  const time = {}
  time.days = Math.trunc(seconds / (24 * 3600))
  secondsLeft = seconds - time.days * 24 * 3600
  time.hours = Math.trunc(secondsLeft / 3600)
  secondsLeft = secondsLeft - time.hours * 3600
  time.minutes = Math.trunc(secondsLeft / 60)
  secondsLeft = secondsLeft - time.minutes * 60
  time.seconds = secondsLeft
  return time
}

// Convert DD:HH:MM:SS format to seconds
function toSeconds(timeArray) {
  let seconds = 0
  const multiplier = [1, 60, 60 * 60, 24 * 60 * 60] // SS, MM, HH, DD
  for (let i = 0; i < timeArray.length; i++) {
    seconds += timeArray[i] * multiplier[i]
  }
  return seconds
}

const regExp = {
  uuid: /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/,
  uuidPrefix: /^[0-9A-F]{1,8}$/,
  uuidSuffix: /^-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/
}

function uuid (name) {
  if (!name) {
    throw new TypeError('uuid: name cannot be empty')
  }
  if (typeof name !== 'string') {
    throw new TypeError('uuid: not a string')
  }
  const newUuid = uuidv5(name, UUID_NAMESPACE).toUpperCase()
  if (!regExp.uuid.test(newUuid)) {
    throw new RangeError(`uuid: ${newUuid}: invalid uuid`)
  }
  return newUuid
}

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

    this.createCharacteristicClass('TimeLeft', uuid('0A5'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS,
      minValue: 0,
      perms: [this.Perms.READ, this.Perms.NOTIFY],
    }, 'Time left of timer')

    this.createCharacteristicClass('Timestamp', uuid('0A6'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS,
      minValue: 0,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.HIDDEN],
    }, 'Unix timestamp')

    this.createCharacteristicClass('Random', uuid('0A9'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Random enabled')

    this.createCharacteristicClass('DelayDays', uuid('0AE'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 9,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Delay time (Days)')

    this.createCharacteristicClass('DelayHours', uuid('0AA'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 23,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Delay time (Hours)')

    this.createCharacteristicClass('DelayMinutes', uuid('0AB'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 59,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Delay time (Minutes)')

    this.createCharacteristicClass('DelaySeconds', uuid('0AC'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 59,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Delay time (Seconds)')

    this.createCharacteristicClass('MinDelayPercentage', uuid('0AD'), {
      format: this.Formats.UINT8,
      unit: this.Units.PERCENTAGE,
      minValue: 0,
      maxValue: 100,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Delay time minimum (%)')

    this.createCharacteristicClass('CronSchedule', uuid('0B0'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY],
    }, "Cron schedule")

    this.createCharacteristicClass('Cron', uuid('0B1'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, "Cron")

    this.createCharacteristicClass('Default', uuid('0AF'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
    }, 'Restore default')

  }
}

module.exports.TdTypes = TdTypes
module.exports.getTimestamp = getTimestamp
module.exports.sleep = sleep
module.exports.wait = wait
module.exports.toTime = toTime
module.exports.toSeconds = toSeconds
module.exports.uuid = uuid