// Types for Config.json
// This file defines the structure of the configuration JSON file for the Homebridge plugin.

export interface ConfigJson {
  name: string;
  platform?: string;
  ipAddress: string;
  accessToken: string;
  random?: boolean;
  delay?: number;
  repeats?: number;
  lightbulb?: boolean;
  dimmerAsSwitch?: boolean;
  ignoreUnnamedSwitches?: boolean;
  ignoreUnnamedSensors?: boolean;
  ignore?: string;
  configHeartrate?: number;
  randomize?: boolean;
  locale?: string;
  ignoreIds?: number[];
}
