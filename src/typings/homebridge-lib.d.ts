/** biome-ignore-all lint/correctness/noUnusedVariables: Global types for homebridge-lib */
declare module 'homebridge-lib/Accessory';
declare module 'homebridge-lib/Characteristic';
declare module 'homebridge-lib/HttpClient';
declare module 'homebridge-lib/ServiceDelegate';
declare module 'homebridge-lib/AccessoryDelegate';
declare module 'homebridge-lib/CharacteristicDelegate';
declare module 'homebridge-lib/Platform';
declare module 'homebridge-lib/OptionParser';
declare module 'homebridge-lib/CustomHomeKitTypes';

interface AccessoryParams {
  id: string;
  name: string;
  category?: string;
  manufacturer: string;
  model: string;
  firmware: string;
  hardware?: string;
  software?: string;
  logLevel?: string;
}
