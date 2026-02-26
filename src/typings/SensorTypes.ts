// Types for Sensors

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

export interface SensorServiceParams {
  name?: string;
  lightbulb?: boolean;
  Service?: unknown;
}
