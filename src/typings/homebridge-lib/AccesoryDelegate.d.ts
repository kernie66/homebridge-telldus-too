/** biome-ignore-all lint/style/useExportType: Don't export type in module declaration */
/** biome-ignore-all lint/correctness/noUnusedVariables: Global types for homebridge-lib */

declare module 'homebridge-lib/AccessoryDelegate' {
  import { Delegate } from 'homebridge-lib/Delegate';
  import type TdPlatform from '../../TdPlatform.ts';

  class AccessoryDelegate extends Delegate {
    id: string;
    name: string;
    category?: string;
    manufacturer: string;
    model: string;
    hardware?: string;
    software: string;
    logLevel: number;
    //    heartrate: number;
    firmware: string;
    serialNumber: string;
    heartbeatEnabled: boolean;

    manageLogLevel(delegate: unknown, forPlatform: boolean);
    addPropertyDelegate: (params: { key: string; value?: unknown; silent?: boolean; unit?: string }) => void;

    constructor(platform: TdPlatform, params = {});
  }

  export { AccessoryDelegate };
}
interface AccessoryParams {
  id: string;
  name: string;
  category?: string;
  manufacturer: string;
  model: string;
  firmware: string;
  hardware?: string;
  software?: string;
  logLevel?: number;
}
