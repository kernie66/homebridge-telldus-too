// utils.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//

import type { COMMANDS } from '../TdConstants.js';
import { TELLDUS_STATES, WIND_DIRECTIONS, WIND_DIRECTIONS_SE } from '../TdConstants.js';

export function windDirection(degrees: number) {
  const realDegrees = degrees < 0 ? 0 : degrees % 360;
  return WIND_DIRECTIONS[(realDegrees * 16) % 360];
}

export function windDirectionSE(degrees: number) {
  const realDegrees = degrees < 0 ? 0 : degrees % 360;
  return WIND_DIRECTIONS_SE[realDegrees];
}

// Simple wait function that can be used with async/await and supports aborting with an AbortSignal
export function wait(ms: number, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(resolve, ms);
    if (signal) {
      // implement aborting logic for our async operation
      signal.addEventListener('abort', (event: Event) => {
        clearTimeout(timerId);
        reject(event);
      });
    }
  });
}

// Convert Telldus state to text for logging and debugging purposes
export function stateToText(state: number | undefined) {
  if (state === undefined || state === 0) {
    return 'Undefined';
  }
  const stateIndex = Math.log2(state);
  if (stateIndex < 0 || stateIndex >= TELLDUS_STATES.length) {
    return 'Undefined';
  }
  return TELLDUS_STATES[stateIndex];
}

export function setSupportedMethods(commands: typeof COMMANDS) {
  return Object.values(commands).reduce((memo: number, num: number) => memo + num, 0);
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
