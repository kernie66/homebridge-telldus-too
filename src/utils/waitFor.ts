import { setTimeout } from 'node:timers/promises';
import figlet from 'figlet';
import type { Delegate } from 'homebridge-lib/Delegate';
import { getErrorMessage } from './utils.js';

interface WaitForParams {
  waitMinutes?: number;
  header?: string;
  error?: unknown;
  reason?: string;
}

// Waits for a specified number of minutes before retrying an operation,
// with optional logging of a header, error message, and reason for the retry.
// If waitMinutes is set to 0, it will log the messages without waiting before retrying.
export default async function waitFor(this: Delegate, { waitMinutes = 1, header, error, reason }: WaitForParams = {}) {
  if (header) {
    this.error(`\n${figlet.textSync(header)}`);
  }
  if (error) {
    const errorMessage = getErrorMessage(error);
    this.log(errorMessage);
    await setTimeout(100); // Small delay to ensure the error message is logged before the retry message is displayed
  }
  if (reason) {
    this.warn(reason);
  }
  if (waitMinutes > 0) {
    this.warn(`Will retry in ${waitMinutes} minute(s)...`);
    await setTimeout(waitMinutes * 60 * 1000);
  }
}
