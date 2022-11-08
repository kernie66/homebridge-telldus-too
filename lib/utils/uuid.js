// uuid function
// Copyright © 2022 Kenneth Jagenheim. All rights reserved.
//

const { v5: uuidv5, NIL: NIL_UUID } = require('uuid');

const UUID_NAMESPACE = uuidv5("homebridge-telldus-too", NIL_UUID)

const regExp = {
  uuid: /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/,
  uuidPrefix: /^[0-9A-F]{1,8}$/,
  uuidSuffix: /^-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/
}

function uuid (name) {
  if (!name) {
    throw new TypeError('uuid: name cannot be empty')
  }
  if (typeof name !== 'string') {
    throw new TypeError('uuid: not a string')
  }
  const newUuid = uuidv5(name, UUID_NAMESPACE).toUpperCase()
  if (!regExp.uuid.test(newUuid)) {
    throw new RangeError(`uuid: ${newUuid}: invalid uuid`)
  }
  return newUuid
}

module.exports = uuid