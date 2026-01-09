// import EventEmitter from 'node:events';
// import { HttpClient } from 'homebridge-lib/HttpClient';

import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { testDeviceInfo, testSystemInfo } from '../../../test/telldusApiFakeData.js';
import TelldusApi from '../TelldusApi.js';

const host = '192.168.1.254';
const accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImF1ZCI6ImhvbWVicmlkZ2UtdGVsbGR1cyIsImV4cCI6MTc3MTc5NTk1OH0.eyJyZW5ldyI6dHJ1ZSwidHRsIjozMTUzNjAwMH0._rrko5klp6pAsvEhOWQNw9hiNZVpBJbLpLS0I0bOAqQ';

describe('Test API functions', () => {
  it('gets system info', async () => {
    const testApi = new TelldusApi(host, accessToken);
    const systemInfo = await testApi.getSystemInfo();
    expect(systemInfo.request.headers.authorization).toBe('Bearer ' + accessToken);
    expect(systemInfo.body.product).toBe(testSystemInfo.product);
  });

  it('gets device list', async () => {
    const testApi = new TelldusApi(host, accessToken);
    const deviceList = await testApi.listDevices();
    // console.log('deviceList: %o', deviceList);
    expect(deviceList.body.device.length).toBe(3);
  });

  it('gets device info', async () => {
    const testApi = new TelldusApi(host, accessToken);

    // Test existing device ID
    const deviceInfoId4 = await testApi.getDeviceInfo(4);
    // console.log('Device info:', deviceInfoId4);

    const params = URL.parse(deviceInfoId4.request.url);
    const id = params?.searchParams.get('id');

    expect(deviceInfoId4.ok).toBeTruthy();
    expect(id).toBe('4');
    expect(deviceInfoId4.body.id).toBe(testDeviceInfo[0].id);

    // Test missing device ID
    const deviceInfoId1 = await testApi.getDeviceInfo(1);
    //console.log('Device info:', deviceInfoId1);

    expect(deviceInfoId1.ok).toBeFalsy();
    expect(deviceInfoId1.body.error).toBeDefined();
  });

  it('gets sensor list', async () => {
    const testApi = new TelldusApi(host, accessToken);
    const sensorList = await testApi.listSensors();
    //console.log('sensorList: %o', sensorList);
    expect(sensorList.body.sensor.length).toBe(7);
  });

  it('gets sensor info', async () => {
    const testApi = new TelldusApi(host, accessToken);

    // Test temp/humidity sensor
    const tempHumSensorInfo = await testApi.getSensorInfo(105);
    console.log('Sensor info:', tempHumSensorInfo);

    const params = URL.parse(tempHumSensorInfo.request.url);
    const id = params?.searchParams.get('id');

    expect(id).toBe('105');
    expect(tempHumSensorInfo.ok).toBeTruthy();
    expect(tempHumSensorInfo.body.id).toBe(105);

    // Test missing sensor ID
    const deviceInfoId1 = await testApi.getSensorInfo(1);
    console.log('Sensor info:', deviceInfoId1);

    expect(deviceInfoId1.ok).toBeFalsy();
    expect(deviceInfoId1.body.error).toBeDefined();
    expect(deviceInfoId1.body.error).toMatch(/could not be found/);
  });

  it('refreshes access token', async () => {
    const testApi = new TelldusApi(host, accessToken);
    const newToken = await testApi.refreshAccessToken();
    console.log('newToken', newToken);
    expect(newToken.expires).toBeDefined();
    expect(newToken.token).toBeDefined();

    await expect(async () => {
      await testApi.refreshAccessToken(); // throws error
    }).rejects.toThrow('Unable to refresh access token');
  });
});
