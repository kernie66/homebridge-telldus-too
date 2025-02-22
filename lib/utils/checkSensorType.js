// checkSensorType function
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//

// Function to determine the type of Telldus sensor
export default function checkSensorType(sensorInfo) {
  let sensorType;
  // Check the obvious models
  if (
    sensorInfo.model === 'temperature' ||
    sensorInfo.model === 'temperaturehumidity'
  ) {
    return sensorInfo.model;
  }
  // Check for temperature and possibly humidity sensor
  if (sensorInfo.data[0] && sensorInfo.data[0].name === 'temp') {
    sensorType = 'temperature';
    if (
      sensorInfo.data[1] &&
      sensorInfo.data[1].name === 'humidity'
    ) {
      sensorType = sensorType + 'humidity';
    }
    return sensorType;
  }
  // Check for wind sensor
  const windTypes = ['wdir', 'wavg', 'wgust'];
  if (
    sensorInfo.data[0] &&
    windTypes.includes(sensorInfo.data[0].name)
  ) {
    return 'wind';
  }
  // Check for rain sensor
  const rainTypes = ['rrate', 'rtot'];
  if (
    sensorInfo.data[0] &&
    rainTypes.includes(sensorInfo.data[0].name)
  ) {
    return 'rain';
  }
}
