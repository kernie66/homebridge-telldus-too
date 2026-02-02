declare module 'homebridge-lib/Delegate' {
  import type TdPlatform from '../../TdPlatform.ts';
  import EventEmitter from 'node:events';

  class Delegate extends EventEmitter {
    Services: {
      hap: {
        Switch: () => void;
        Lightbulb: () => void;
        HumiditySensor: () => void;
      };
      my: {
        Resource: () => void;
        DeconzGateway: () => void;
      };
      eve: {
        TemperatureSensor: () => void;
        HumiditySensor: () => void;
      };
    };

    log: (message: string | Error, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    fatal: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
    vdebug: (message: string, ...args: unknown[]) => void;

    constructor(platform: TdPlatform, params = {});
  }
}
