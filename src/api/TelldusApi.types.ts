import type { SensorModelType } from '../typings/SensorTypes.js';

export type RefreshTokenResponse = {
  error?: string;
  expires: number;
  token: string;
};

export interface DeviceListType extends ResponseBodyError {
  device: Array<{
    id: number;
    methods: number;
    name: string;
    state: number;
    statevalue: string;
    type: string;
  }>;
}

export interface DeviceInfoType extends ResponseBodyError {
  id: number;
  name: string;
  methods: number;
  state: number;
  statevalue: string;
  type: string;
  model: string;
  protocol: string;
}

export interface SensorListType extends ResponseBodyError {
  sensor: Array<{
    battery: number;
    id: number;
    model: SensorModelType;
    name: string;
    novalues?: boolean;
    protocol: string;
    sensorId: number;
  }>;
}

export interface SensorInfoType extends ResponseBodyError {
  id: number;
  name: string;
  model: SensorModelType;
  protocol: string;
  novalues?: boolean;
  sensorId: number;
  battery: number;
  lastUpdated: number;
  data: Array<{
    lastUpdated: number;
    name: string;
    scale: number;
    value: number;
  }>;
}

export interface SystemInfoType extends ResponseBodyError {
  product?: string;
  time?: string;
  version?: string;
}

export interface TurnOnOffType extends ResponseBodyError {
  status: string;
}

export interface ResponseBodySuccess {
  reply: string;
}

export interface ResponseBodyError {
  error?: string;
}
