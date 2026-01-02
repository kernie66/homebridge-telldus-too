// utils.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//

import { COMMANDS, WIND_DIRECTIONS, WIND_DIRECTIONS_SE } from '../TdConstants.js';

export function windDirection(degrees: number) {
  const realDegrees = degrees < 0 ? 0 : degrees % 360;
  return WIND_DIRECTIONS[(realDegrees * 16) % 360];
}

export function windDirectionSE(degrees: number) {
  const realDegrees = degrees < 0 ? 0 : degrees % 360;
  return WIND_DIRECTIONS_SE[realDegrees];
}

export const sleep = (seconds: number) => {
  const milliSeconds = Math.min(seconds * 1000, Math.pow(2, 30));
  return new Promise((resolve) => {
    setTimeout(resolve, milliSeconds);
  });
};

export function wait(ms: number, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(resolve, ms);
    if (signal) {
      // implement aborting logic for our async operation
      signal.addEventListener('abort', (event) => {
        clearTimeout(timerId);
        reject(event);
      });
    }
  });
}

type Time = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// Convert seconds to HH:MM:SS format
export function toTime(seconds: number) {
  const time = <Time>{};
  let secondsLeft: number;
  time.days = Math.trunc(seconds / (24 * 3600));
  secondsLeft = seconds - time.days * 24 * 3600;
  time.hours = Math.trunc(secondsLeft / 3600);
  secondsLeft = secondsLeft - time.hours * 3600;
  time.minutes = Math.trunc(secondsLeft / 60);
  secondsLeft = secondsLeft - time.minutes * 60;
  time.seconds = secondsLeft;
  return time;
}

/*
// Convert DD:HH:MM:SS format to seconds
export function toSeconds(timeArray) {
  let seconds = 0;
  const multiplier = [
    1,
    60,
    60 * 60,
    24 * 60 * 60,
  ]; // SS, MM, HH, DD
  for (let i = 0; i < timeArray.length; i++) {
    seconds += timeArray[i] * multiplier[i];
  }
  return seconds;
}
*/

// Convert Telldus state to text
export function stateToText(state: number) {
  let stateText;
  const telldusStates = [
    'ON', // 1
    'OFF', // 2
    'BELL', // 4
    'TOGGLE', // 8
    'DIM', // 16
    'LEARN', // 32
    'EXECUTE', // 64
    'UP', // 128
    'DOWN', // 256
    'STOP', // 512
    'RGB', // 1024
    'THERMOSTAT', // 2048
  ];
  if (state !== undefined) {
    const stateIndex = Math.round(Math.log2(state));
    stateText = telldusStates[stateIndex];
  } else {
    stateText = 'Undefined';
  }
  return stateText;
}

export function setSupportedMethods(commands: typeof COMMANDS) {
  return Object.values(commands).reduce((memo: number, num: number) => memo + num, 0);
}
