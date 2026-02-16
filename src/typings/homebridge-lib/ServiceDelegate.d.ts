/** biome-ignore-all lint/style/useExportType: Don't export type in module declaration */
/** biome-ignore-all lint/correctness/noUnusedVariables: Global types for homebridge-lib */

declare module 'homebridge-lib/ServiceDelegate' {
  import { History } from './History.js';
  import { Delegate } from 'homebridge-lib/Delegate';

  type CharacteristicType = {
    [key: string]: {
      Formats: unknown;
      Perms: unknown;
      Units: unknown;
    };
  };

  type CharacteristicsType = {
    eve: {
      [key: string]: unknown;
    };
    hap: {
      [key: string]: unknown;
      TemperatureDisplayUnits: {
        CELSIUS: number;
        FAHRENHEIT: number;
      };
    };
    my: {
      [key: string]: unknown;
    };
  };

  class ServiceDelegate<T> extends Delegate {
    name: string;
    silent?: boolean;
    values: T; // Record<string, boolean | number | string | Date | windDirection>;
    Characteristic: CharacteristicType;
    Characteristics: CharacteristicsType;

    addCharacteristicDelegate(params: {
      key: string;
      Characteristic: unknown;
      unit?: string;
      value?: unknown;
      silent?: boolean;
      props?: Record<string, unknown>;
    }): CharacteristicDelegate;

    characteristicDelegate(key: string): CharacteristicDelegate;

    constructor(accessoryDelegate: unknown, params = {});

    static History: typeof History;
  }

  ServiceDelegate.History = History;
  export { ServiceDelegate };
}
