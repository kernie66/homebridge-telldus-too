// utils.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//

const DateTime = require('luxon').DateTime

const getTimestamp = () => DateTime.now().toUnixInteger()

const getObservationTime = (timestamp) => {
  return DateTime.fromSeconds(timestamp).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
}

// Convert Unix timestamp in seconds to Eve display format
const toDate = (timestamp) => String(new Date(timestamp * 1000)).slice(0, 24)

const windDirections = [
  'North', 'NNE', 'NE', 'ENE', 'East', 'ESE', 'SE', 'SSE',
  'South', 'SSW', 'SW', 'WSW', 'West', 'WNW', 'NW', 'NNW', 'North'
]
function windDirection (degrees) {
  return windDirections[Math.round(degrees * 16 / 360)]
}
const windDirectionsSE = [
  'Nordan', 'NNÖ', 'NÖ', 'ÖNÖ', 'Östan', 'ÖSÖ', 'SÖ', 'SSÖ',
  'Sunnan', 'SSV', 'SV', 'VSV', 'Västan', 'VNV', 'NV', 'NNV', 'Nordan'
]
function windDirectionSE (degrees) {
  return windDirectionsSE[Math.round(degrees * 16 / 360)]
}

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

// Convert Telldus state to text
function stateToText(state) {
  let stateText
  const telldusStates = [
    "ON",     // 1
    "OFF",    // 2
    "BELL",       // 4
    "TOGGLE",     // 8
    "DIM",        // 16
    "LEARN",      // 32
    "EXECUTE",    // 64
    "UP",         // 128
    "DOWN",       // 256
    "STOP",       // 512
    "RGB",        // 1024
    "THERMOSTAT"  // 2048
  ]
  if (state !== undefined) {
    stateText = telldusStates[Math.log2(state)]
  }
  else {
    stateText = "Undefined"
  }
  return stateText
}

module.exports.getTimestamp = getTimestamp
module.exports.getObservationTime = getObservationTime
module.exports.toDate = toDate
module.exports.windDirection = windDirection
module.exports.windDirectionSE = windDirectionSE
module.exports.sleep = sleep
module.exports.wait = wait
module.exports.toTime = toTime
module.exports.toSeconds = toSeconds
module.exports.stateToText = stateToText