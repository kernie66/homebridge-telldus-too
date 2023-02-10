function checkSensorType(sensorInfo) {
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
  if (sensorInfo.data[0] && sensorInfo.data[0].name === 'wdir') {
    return 'wind';
  }
  // Check for rain sensor
  if (sensorInfo.data[0] && sensorInfo.data[0].name === 'rtot') {
    return 'rain';
  }
}

module.exports = checkSensorType;
