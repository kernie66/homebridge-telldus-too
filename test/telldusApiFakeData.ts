export const testSystemInfo = {
  product: 'tellstick-znet-lite-v2',
  time: '2026-01-07T21:04:36.558663',
  version: '1.3.2',
};

export const testDeviceList = {
  device: [
    {
      id: 3,
      methods: 0,
      name: 'Living room',
      state: 0,
      statevalue: '',
      type: 'device',
    },
    {
      id: 4,
      methods: 0,
      name: 'Window',
      state: 0,
      statevalue: '',
      type: 'device',
    },
    {
      id: 5,
      methods: 0,
      name: 'Test',
      state: 0,
      statevalue: '',
      type: 'device',
    },
  ],
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

export const testSensorList = {
  sensor: [
    {
      battery: 254,
      id: 105,
      model: 'temperaturehumidity',
      name: 'Bedroom',
      novalues: true,
      protocol: 'fineoffset',
      sensorId: 105,
    },
    {
      battery: 254,
      id: 166,
      model: 'F824',
      name: 'Indoor',
      novalues: true,
      protocol: 'oregon',
      sensorId: 166,
    },
    {
      battery: 253,
      id: 167,
      model: '1984',
      name: 'Wind',
      novalues: true,
      protocol: 'oregon',
      sensorId: 167,
    },
    {
      battery: 254,
      id: 168,
      model: 'F824',
      name: 'Outside',
      novalues: true,
      protocol: 'oregon',
      sensorId: 168,
    },
    {
      battery: 253,
      id: 169,
      model: '2914',
      name: 'Rain',
      novalues: true,
      protocol: 'oregon',
      sensorId: 169,
    },
    {
      battery: 254,
      id: 188,
      model: 'temperature',
      name: 'Freezer',
      novalues: true,
      protocol: 'fineoffset',
      sensorId: 188,
    },
    {
      battery: 253,
      id: 247,
      model: '1984',
      name: '',
      novalues: true,
      protocol: 'oregon',
      sensorId: 247,
    },
  ],
};

export const testSensorInfo = [
  {
    battery: 254,
    data: [
      {
        lastUpdated: 1693258519,
        name: 'temp',
        scale: 0,
        value: 18.699999999999999,
      },
      {
        lastUpdated: 1693258519,
        name: 'humidity',
        scale: 0,
        value: 60.0,
      },
    ],
    id: 105,
    lastUpdated: 1693258519,
    model: 'temperaturehumidity',
    name: 'Bedroom',
    protocol: 'fineoffset',
    sensorId: 105,
  },
  {
    battery: 253,
    data: [
      {
        lastUpdated: 1722272815,
        name: 'wavg',
        scale: 0,
        value: 0.29999999999999999,
      },
      {
        lastUpdated: 1722272815,
        name: 'wgust',
        scale: 0,
        value: 0.69999999999999996,
      },
      {
        lastUpdated: 1722272815,
        name: 'wdir',
        scale: 0,
        value: 112.5,
      },
    ],
    id: 167,
    lastUpdated: 1722272815,
    model: '1984',
    name: 'Wind',
    protocol: 'oregon',
    sensorId: 167,
  },
  {
    battery: 253,
    data: [
      {
        lastUpdated: 1722272640,
        name: 'rtot',
        scale: 0,
        value: 350.5,
      },
      {
        lastUpdated: 1722272640,
        name: 'rrate',
        scale: 0,
        value: 0.0,
      },
    ],
    id: 169,
    lastUpdated: 1722272640,
    model: '2914',
    name: 'Rain',
    protocol: 'oregon',
    sensorId: 169,
  },
];

export const testRefreshToken = [
  {
    expires: 1799447338,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImF1ZCI6ImhvbWVicmlkZ2UtdGVsbGR1cyIsImV4cCI6MTc5OTQ0NzMzOH0.eyJyZW5ldyI6dHJ1ZSwidHRsIjozMTUzNjAwMH0.wWcVWF05jWfYBOv2XahXwZAygVQY29EqxhfnXyVWBHM',
  },
  {
    error: 'Invalid token supplied',
  },
];
