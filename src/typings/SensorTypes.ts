import type EventEmitter from 'node:events';
import type { Logging } from 'homebridge';
import type NodeCache from 'node-cache';
import type TelldusApi from '../api/TelldusApi.js';
import type TdMyCustomTypes from '../TdMyCustomTypes.js';

export interface SensorParamsType {
  name: string;
  id: string;
  deviceId: number;
}

export interface SensorConfigTypes {
  name?: string;
  uuid?: string;
  id?: number;
  manufacturer?: string;
  model?: SensorModelType;
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
  deviceId: number;
  model: string;
  modelType: string;
  switchMuteTime?: number;
  delay?: number;
  repeats?: number;
  heartrate?: number;
  random?: boolean;
  lightbulb?: boolean;
  state: number;
}
export interface SensorAccessoryType extends Logging, EventEmitter {
  name: string;
  deviceId: number;
  model: string;
  modelType: string;
  switchMuteTime: number;
  delay: number;
  repeats: number;
  heartrate: number;
  Services: {
    hap: {
      Switch: Function;
      Lightbulb: Function;
    };
  };
  random: number;
  state: number;
  stateCache: NodeCache;
  telldusApi: TelldusApi;
  td: TdMyCustomTypes;
  platformBeatRate: number;
  logLevel: string;
  onUpdating: boolean;
}

export type SensorServiceParams = {
  name: string;
  lightbulb?: boolean;
  Service?: Function;
};

export type SensorType = 'temperature' | 'humidity' | 'temperaturehumidity' | 'wind' | 'rain' | 'unknown';
