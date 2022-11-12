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
async function getDeviceInfo(api, id, timeout = 3000) {
  const response = Promise.race([
    api.getDeviceInfo(id),
    setTimeout(timeout, 'Timeout')
  ])
  .catch(error => this.error('Error getting Telldus device info:', error))
  return response
}

// Function to turn on or off a Telldus device
async function setDevice(api, id, state) {
  const response = Promise.race([
    api.onOffDevice(id, state),
    setTimeout(3000, 'Timeout')
  ])
  .catch(error => this.error('Error setting Telldus device on/off:', error))
  return response
}

// Function to set dimmer level for Telldus device
async function dimDevice(api, id, level) {
  const response = Promise.race([
    api.commandDevice(id, 'dim', level * 2.54),
    setTimeout(3000, 'Timeout')
  ])
  .catch(error => this.error('Error setting Telldus device dim level:', error))
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
  .catch(error => this.error('Error getting Telldus sensor info:', error))
  return response
}

module.exports.getDevices = getDevices
module.exports.getDeviceInfo = getDeviceInfo
module.exports.setDevice = setDevice
module.exports.dimDevice = dimDevice
module.exports.getSensors = getSensors
module.exports.getSensorInfo = getSensorInfo