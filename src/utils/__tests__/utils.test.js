import { describe, expect, it } from 'vitest';
import { COMMANDS, TELLDUS_STATES } from '../../TdConstants.js';
import { setSupportedMethods, stateToText } from '../utils.js';

describe('Test the different util functions', () => {
  it('sets the sum of all commands', () => {
    const sumOfCommands = setSupportedMethods(COMMANDS);
    console.log({
      sumOfCommands,
    });
    expect(sumOfCommands).toBe(1023);
  });

  it('converts a state number to a state text', () => {
    for (let state = 0; state < TELLDUS_STATES.length; state++) {
      const stateText = stateToText(2 ** state);
      expect(stateText).toBe(TELLDUS_STATES[state]);
    }
  });
});
