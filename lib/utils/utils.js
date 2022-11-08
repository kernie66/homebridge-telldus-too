// utils.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//

const DateTime = require('luxon').DateTime

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

module.exports.getTimestamp = getTimestamp
module.exports.sleep = sleep
module.exports.wait = wait
module.exports.toTime = toTime
module.exports.toSeconds = toSeconds