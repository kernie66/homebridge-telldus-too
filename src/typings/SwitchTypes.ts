import type NodeCache from 'node-cache';
import type TelldusApi from '../api/TelldusApi.js';
import type { ThisLoggers } from './thisTypes.js';

export interface SwitchServiceTypes extends ThisLoggers {
  deviceId: string;
  model: string;
  modelType: string;
  random: number;
  delay: number;
  repeats: number;
  heartrate: number;
  td: MyTelldusTypes;
  state: number;
  stateCache: unknown;
  telldusApi: TelldusApi;
  switchMuteTime: number;
  timeout: number;
  switchOn: boolean;
  lastSwitchOn: boolean;
  acDelay: AbortController | null;
  acRepeat: AbortController | null;
  timerActive: boolean;
  activeTimeout: NodeJS.Timeout | null;
  endStatus: string;
  dimming: boolean;
  acDim: AbortController | null;
}

export interface SwitchAccessoryType extends ThisLoggers {
  name: string;
  deviceId: string;
  model: string;
  modelType: string;
  switchMuteTime: number;
  delay: number;
  repeats: number;
  heartrate: number;
  timeout: number;
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
  td: MyTelldusTypes;
  platformBeatRate: number;
  logLevel: string;
  onUpdating: boolean;
}

export type SwitchServiceParams = {
  name: string;
  lightbulb?: boolean;
  Service?: Function;
  timeout: number;
};

export type MyTelldusTypes = {
  Characteristics: {
    EnableRandomOnce: Function;
    DisableRandomOnce: Function;
    Disabled: Function;
    Enabled: Function;
    Random: Function;
    Delay: Function;
    MinDelay: Function;
    TimeOut: Function;
    Repeats: Function;
    Repetition: Function;
    Status: Function;
    Heartrate: Function;
    SwitchMuteTime: Function;
    LastActivation: Function;
    TokenExpires: Function;
    NextRefresh: Function;
  };
};
