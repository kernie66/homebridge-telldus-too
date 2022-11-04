// homebridge-telldus-too/index.js
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

'use strict'

const TdPlatform = require('./lib/TdPlatform')
const packageJson = require('./package.json')

module.exports = function (homebridge) {
  TdPlatform.loadPlatform(homebridge, packageJson, 'TelldusToo', TdPlatform)
}
