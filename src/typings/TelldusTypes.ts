import type { ResponseBodyError } from './HttpClientTypes.js';

export interface DeviceBaseType extends Partial<ResponseBodyError> {
  id: number;
  name: string;
  methods: number;
  state: number;
  statevalue: string;
  type: string;
}

export interface DeviceInfoType extends Partial<DeviceBaseType> {
  model: string;
  protocol: string;
}

export type SensorModelType =
  | 'temperature'
  | 'humidity'
  | 'temperaturehumidity'
  | 'wind'
  | 'rain'
  | 'unknown'
  | unknown;

export interface SensorBaseType extends Partial<ResponseBodyError> {
  id: number;
  name: string;
  model: SensorModelType;
  protocol: string;
  novalues?: boolean;
  sensorId: number;
  battery: number;
}

export interface SensorInfoType extends Partial<SensorBaseType> {
  lastUpdated: number;
  data: {
    lastUpdated: number;
    name: string;
    value: number;
    scale: number;
  }[];
}

export interface SystemInfoType extends Partial<ResponseBodyError> {
  product?: string;
  time?: string;
  version?: string;
}
