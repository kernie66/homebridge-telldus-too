// Types for Switches

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
  modelType: string;
  switchMuteTime?: number;
  delay?: number;
  repeats?: number;
  heartrate?: number;
  random?: boolean;
  lightbulb?: boolean;
  state: number;
}

export type SwitchServiceParams = {
  name?: string;
  lightbulb?: boolean;
  Service?: unknown;
  primaryService?: boolean;
};
