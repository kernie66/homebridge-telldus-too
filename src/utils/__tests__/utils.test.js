import { describe, expect, it } from 'vitest';
import { COMMANDS } from '../../TdConstants.js';
import { setSupportedMethods } from '../utils.js';

describe('Test the different util functions', () =>
  it('sets the sum of all commands', () => {
    const sumOfCommands = setSupportedMethods(COMMANDS);
    console.log('Sum of commands:', sumOfCommands, {
      sumOfCommands,
    });
    expect(sumOfCommands).toBe(1023);
  }));
