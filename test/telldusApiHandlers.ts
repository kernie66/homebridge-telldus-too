import { HttpResponse, http } from 'msw';
import {
  testSystemInfo,
  testDeviceList,
  testDeviceInfo,
} from './telldusApiFakeData';

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
];
