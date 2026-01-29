import type { Logging } from 'homebridge';
import type NodeCache from 'node-cache';
import type TelldusApi from '../api/TelldusApi.js';
import type TdMyCustomTypes from '../TdMyCustomTypes.js';

export interface SwitchParamsType {
  name: string;
  id: string;
  deviceId: number;
}

export interface SwitchConfigTypes {
  name?: string;
  uuid?: string;
  id?: number;
  manufacturer?: string;
  model?: string;
  modelType?: SwitchTypes;
  firmware?: string;
  state?: number;
  category?: string;
  delay?: number;
  random?: boolean;
  lightbulb?: boolean;
  methods?: number;
  protocol?: string;
}

export type SwitchTypes = 'switch' | 'dimmer' | 'bell' | 'Unknown';

export interface SwitchAccessoryParams extends AccessoryParams {
  deviceId: number;
  // model: string;
  modelType: string;
  switchMuteTime?: number;
  delay?: number;
  repeats?: number;
  heartrate?: number;
  random?: boolean;
  lightbulb?: boolean;
  state: number;
}
export interface SwitchAccessoryType extends Logging {
  name: string;
  deviceId: number;
  model: string;
  modelType: string;
  // switchMuteTime: number;
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

export type SwitchServiceParams = {
  name?: string;
  lightbulb?: boolean;
  Service?: Function;
  primaryService?: boolean;
};

export type SensorType = 'temperature' | 'humidity' | 'temperaturehumidity' | 'wind' | 'rain' | 'unknown';
