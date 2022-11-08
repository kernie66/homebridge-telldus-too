// homebridge-telldus-too/TdApi.js

const { setTimeout } = require('node:timers/promises')

// Function to get devices from Telldus
async function getDevices(api) {
  const response = Promise.race([
    api.listDevices(),
    setTimeout(3000, 'Timeout')
  ])
    .catch(error => this.error('Error getting Telldus devices:', error))
  return response
}

// Function to get device information from Telldus
async function getDeviceInfo(api, id) {
  const response = Promise.race([
    api.getDeviceInfo(id),
    setTimeout(3000, 'Timeout')
  ])
  return response
}

// Function to get sensors from Telldus
async function getSensors(api) {
  const response = Promise.race([
    api.listSensors(),
    setTimeout(3000, 'Timeout')
  ])
    .catch(error => this.error('Error getting Telldus sensors:', error))
  return response
}

// Function to get sensor information from Telldus
async function getSensorInfo(api, id) {
  const response = Promise.race([
    api.getSensorInfo(id),
    setTimeout(3000, 'Timeout')
  ])
  return response
}

module.exports.getDevices = getDevices
module.exports.getDeviceInfo = getDeviceInfo
module.exports.getSensors = getSensors
module.exports.getSensorInfo = getSensorInfo