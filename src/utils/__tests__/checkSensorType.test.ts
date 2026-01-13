import { describe, expect, it } from 'vitest';
import { testSensorInfo } from '../../api/__tests__/telldusApiFakeData';
import checkSensorType from '../checkSensorType';

describe('Test Telldus sensor type checker', () => {
  it('checks normal temperature/humidity sensor', () => {
    const tempSensor = checkSensorType(testSensorInfo[0]);
    expect(tempSensor).toBe('temperaturehumidity');
  });

  it('checks unknown temperature/humidity sensor', () => {
    const tempSensor = checkSensorType(testSensorInfo[1]);
    expect(tempSensor).toBe('temperaturehumidity');
  });

  it('checks wind sensor', () => {
    const windSensor = checkSensorType(testSensorInfo[2]);
    expect(windSensor).toBe('wind');
  });

  it('checks rain sensor', () => {
    const rainSensor = checkSensorType(testSensorInfo[3]);
    expect(rainSensor).toBe('rain');
  });
});
