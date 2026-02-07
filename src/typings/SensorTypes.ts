import type { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate';
import type TelldusApi from '../api/TelldusApi.js';
import type TdMyCustomTypes from '../TdMyCustomTypes.js';

export interface SensorParamsType {
  name: string;
  id: string;
  sensorId: number;
}

export interface SensorConfigTypes {
  name?: string;
  uuid?: string;
  id?: number;
  manufacturer?: string;
  model?: string;
  temperatureSensor?: boolean;
  humiditySensor?: boolean;
  windSensor?: boolean;
  rainSensor?: boolean;
  firmware?: string;
  category?: string;
  randomize?: boolean;
  configHeartrate?: number;
  protocol?: string;
}

export type SensorModelType = 'temperature' | 'humidity' | 'temperaturehumidity' | 'wind' | 'rain' | 'unknown';

export type SensorTypes = 'switch' | 'dimmer' | 'bell' | 'Unknown';

export interface SensorAccessoryParams extends AccessoryParams {
  sensorId: number;
  temperatureSensor: boolean;
  humiditySensor: boolean;
  windSensor: boolean;
  rainSensor: boolean;
  configHeartrate: number;
  heartrate?: number;
  randomize: boolean;
}
export interface SensorAccessoryType extends AccessoryDelegate {
  name: string;
  sensorId: number;
  model: string;
  modelType: string;
  switchMuteTime: number;
  delay: number;
  repeats: number;
  heartrate: number;
  newHeartrate: number;
  // Services: {
  //   hap: {
  //     Switch: () => void;
  //     Lightbulb: () => void;
  //     HumiditySensor: () => void;
  //   };
  //   my: {
  //     Resource: () => void;
  //   };
  //   eve: {
  //     TemperatureSensor: () => void;
  //     HumiditySensor: () => void;
  //   };
  // };
  randomize: boolean;
  telldusApi: TelldusApi;
  td: TdMyCustomTypes;
  platformBeatRate: number;
  configHeartrate: number;
  logLevel: number;
}

export interface SensorServiceParams {
  name?: string;
  lightbulb?: boolean;
  Service?: () => void;
}

export type SensorType = 'temperature' | 'humidity' | 'temperaturehumidity' | 'wind' | 'rain' | 'unknown';
