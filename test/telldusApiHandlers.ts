import { HttpResponse, http } from 'msw';

export const testSystemInfo = {
  product: 'tellstick-znet-lite-v2',
  time: '2026-01-07T21:04:36.558663',
  version: '1.3.2',
};

export const testDeviceInfo = [
  {
    id: 4,
    methods: 0,
    model: 'selflearning-switch:proove',
    name: 'Window',
    protocol: 'arctech',
    state: 0,
    statevalue: '',
    type: 'device',
  },
  {
    error: 'Device "1" could not be found',
  },
];

export const telldusApiHandlers = [
  http.get('http://192.168.1.254/api/system/info', () => {
    return HttpResponse.json(testSystemInfo);
  }),
  http.get('http://192.168.1.254/api/device/info', ({ request }) => {
    const params = URL.parse(request.url);
    const id = params.searchParams.get('id');
    const index = id === '4' ? 0 : 1;
    return HttpResponse.json(testDeviceInfo[index]);
  }),
];
