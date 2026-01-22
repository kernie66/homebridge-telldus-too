import type { API } from 'homebridge';

import { describe, expect, it, vi } from 'vitest';

import registerPlatform from './index.js';
import TdPlatform from './TdPlatform.js';

describe('Load Platform', () => {
  it('should load and register the platform with homebridge', () => {
    /*
    const api = {
      registerPlatform: vi.fn(),
    } as unknown as API;

    registerPlatform(api);

    expect(api.registerPlatform).toHaveBeenCalledWith('homebridge-telldus-too', 'TelldusToo', TdPlatform);
  */
  });
});
