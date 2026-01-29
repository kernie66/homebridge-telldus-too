import type EventEmitter from 'node:events';
import type { Logging } from 'homebridge';
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
  // model: string;
  // modelType: string;
  temperatureSensor: boolean;
  humiditySensor: boolean;
  windSensor: boolean;
  rainSensor: boolean;
  configHeartrate: number;
  randomize: boolean;
}
export interface SensorAccessoryType extends Logging, EventEmitter {
  name: string;
  sensorId: number;
  model: string;
  modelType: string;
  switchMuteTime: number;
  delay: number;
  repeats: number;
  heartrate: number;
  newHeartrate: number;
  Services: {
    hap: {
      Switch: Function;
      Lightbulb: Function;
      HumiditySensor: Function;
    };
    my: {
      Resource: Function;
    };
    eve: {
      TemperatureSensor: Function;
      HumiditySensor: Function;
    };
  };
  randomize: boolean;
  // state: number;
  // stateCache: NodeCache;
  telldusApi: TelldusApi;
  td: TdMyCustomTypes;
  platformBeatRate: number;
  configHeartrate: number;
  logLevel: string;
  onUpdating: boolean;
}

export interface SensorServiceParams {
  name?: string;
  lightbulb?: boolean;
  Service?: Function;
}

export type SensorType = 'temperature' | 'humidity' | 'temperaturehumidity' | 'wind' | 'rain' | 'unknown';
