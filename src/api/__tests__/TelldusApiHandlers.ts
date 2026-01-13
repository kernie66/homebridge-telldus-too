import { HttpResponse, http } from 'msw';
import {
  testDeviceInfo,
  testDeviceList,
  testRefreshToken,
  testSensorInfo,
  testSensorList,
  testSuccessMessage,
  testSystemInfo,
} from './telldusApiFakeData';

let counter = 0;
export const telldusApiHandlers = [
  http.get('http://192.168.1.254/api/system/info', () => {
    return HttpResponse.json(testSystemInfo);
  }),

  http.get('http://192.168.1.254/api/devices/list', () => {
    return HttpResponse.json(testDeviceList);
  }),

  http.get('http://192.168.1.254/api/device/info', ({ request }) => {
    const params = URL.parse(request.url);
    const id = params.searchParams.get('id');
    const index = id === '4' ? 0 : 1;
    return HttpResponse.json(testDeviceInfo[index]);
  }),

  http.get('http://192.168.1.254/api/sensors/list', () => {
    return HttpResponse.json(testSensorList);
  }),

  http.get('http://192.168.1.254/api/sensor/info', ({ request }) => {
    const params = URL.parse(request.url);
    const id = params.searchParams.get('id');
    switch (id) {
      case '105':
        return HttpResponse.json(testSensorInfo[0]);
      case '166':
        return HttpResponse.json(testSensorInfo[1]);
      case '167':
        return HttpResponse.json(testSensorInfo[2]);
      case '168':
        return HttpResponse.json(testSensorInfo[3]);
      case '169':
        return HttpResponse.json(testSensorInfo[4]);
      case '188':
        return HttpResponse.json(testSensorInfo[5]);
      case '247':
        return HttpResponse.json(testSensorInfo[6]);
    }
    // Return error response for unknown IDs
    return HttpResponse.json(testDeviceInfo[1]);
  }),

  http.get('http://192.168.1.254/api/device/turnOn', () => {
    return HttpResponse.json(testSuccessMessage);
  }),

  http.get('http://192.168.1.254/api/device/turnOff', () => {
    return HttpResponse.json(testSuccessMessage);
  }),

  http.get('http://192.168.1.254/api/refreshToken', () => {
    const index = counter === 0 ? 0 : 1; // Return token on first call, error on second
    counter += 1;
    return HttpResponse.json(testRefreshToken[index]);
  }),
];
