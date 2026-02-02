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
