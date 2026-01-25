import type { SensorModelType } from '../typings/SensorTypes.js';

export type RefreshTokenResponse = {
  expires: number;
  token: string;
  error?: string;
};

export interface DeviceListType extends ResponseBodyError {
  device: {
    id: number;
    name: string;
    methods: number;
    state: number;
    statevalue: string;
    type: string;
  }[];
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
  sensor: {
    id: number;
    name: string;
    model: SensorModelType;
    protocol: string;
    novalues?: boolean;
    sensorId: number;
    battery: number;
  }[];
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
  data: {
    lastUpdated: number;
    name: string;
    value: number;
    scale: number;
  }[];
}

export interface SystemInfoType extends ResponseBodyError {
  product?: string;
  time?: string;
  version?: string;
}

export interface ResponseBodySuccess {
  reply: string;
}

export interface ResponseBodyError {
  error?: string;
}
