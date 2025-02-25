// homebridge-telldus-too/lib/TdConstants.js

export const FULL_COMMANDS = Object.freeze({
  TURNON: 1,
  TURNOFF: 2,
  BELL: 4,
  TOGGLE: 8,
  DIM: 16,
  LEARN: 32,
  EXECUTE: 64,
  UP: 128,
  DOWN: 256,
  STOP: 512,
  RGB: 1024,
  THERMOSTAT: 2048,
});

export const COMMANDS = {
  on: 0x0001, // 1
  off: 0x0002, // 2
  bell: 0x0004, // 4
  toggle: 0x0008, // 8
  dim: 0x0010, // 16
  learn: 0x0020, // 32
  execute: 0x0040, // 64
  up: 0x0080, // 128
  down: 0x0100, // 256
  stop: 0x0200, // 512
};
