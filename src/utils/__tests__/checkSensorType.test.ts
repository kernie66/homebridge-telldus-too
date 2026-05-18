import { describe, expect, it } from 'vite-plus/test';

import { testSensorInfo } from '../../api/__tests__/TelldusApiFakeData.js';
import { SensorInfoType } from '../../api/TelldusApi.types.js';
import checkSensorType from '../checkSensorType.js';

describe('Test Telldus sensor type checker', () => {
  it('checks normal temperature/humidity sensor', () => {
    const tempSensor = checkSensorType(testSensorInfo[0] as SensorInfoType);
    expect(tempSensor).toBe('temperaturehumidity');
  });

  it('checks unknown temperature/humidity sensor', () => {
    const tempSensor = checkSensorType(testSensorInfo[1] as SensorInfoType);
    expect(tempSensor).toBe('temperaturehumidity');
  });

  it('checks wind sensor', () => {
    const windSensor = checkSensorType(testSensorInfo[2] as SensorInfoType);
    expect(windSensor).toBe('wind');
  });

  it('checks rain sensor', () => {
    const rainSensor = checkSensorType(testSensorInfo[3] as SensorInfoType);
    expect(rainSensor).toBe('rain');
  });
});
