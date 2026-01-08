// import EventEmitter from 'node:events';
// import { HttpClient } from 'homebridge-lib/HttpClient';

import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  testDeviceInfo,
  testSystemInfo,
} from '../../../test/telldusApiFakeData.js';
import TelldusApi from '../TelldusApi.js';

const host = '192.168.1.254';
const accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImF1ZCI6ImhvbWVicmlkZ2UtdGVsbGR1cyIsImV4cCI6MTc3MTc5NTk1OH0.eyJyZW5ldyI6dHJ1ZSwidHRsIjozMTUzNjAwMH0._rrko5klp6pAsvEhOWQNw9hiNZVpBJbLpLS0I0bOAqQ';

describe('Test API functions', () => {
  it('gets system info', async () => {
    const testApi = new TelldusApi(host, accessToken);
    const systemInfo = await testApi.getSystemInfo();
    expect(systemInfo.request.headers.authorization).toBe(
      'Bearer ' + accessToken
    );
    expect(systemInfo.body.product).toBe(testSystemInfo.product);
  });

  it('gets device list', async () => {
    const testApi = new TelldusApi(host, accessToken);
    const deviceList = await testApi.listDevices();
    console.log('deviceList: %o', deviceList);
    expect(deviceList.body.device.length).toBe(3);
  });

  it('gets device info', async () => {
    const testApi = new TelldusApi(host, accessToken);

    // Test existing device ID
    const deviceInfoId4 = await testApi.getDeviceInfo(4);
    console.log('Device info:', deviceInfoId4);

    const params = URL.parse(deviceInfoId4.request.url);
    const id = params?.searchParams.get('id');

    expect(deviceInfoId4.ok).toBeTruthy();
    expect(id).toBe('4');
    expect(deviceInfoId4.body.id).toBe(testDeviceInfo[0].id);

    // Test missing device ID
    const deviceInfoId1 = await testApi.getDeviceInfo(1);
    console.log('Device info:', deviceInfoId1);

    expect(deviceInfoId1.ok).toBeFalsy();
    expect(deviceInfoId1.body.error).toBeDefined();
  });
});
