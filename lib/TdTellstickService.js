const homebridgeLib = require('homebridge-lib');
const {
  toEveDate,
  getTimestamp,
} = require('./utils/dateTimeHelpers');

class Tellstick extends homebridgeLib.ServiceDelegate {
  constructor(gateway, params = {}) {
    params.name = gateway.name;
    params.Service = gateway.Services.my.DeconzGateway;
    params.exposeConfiguredName = true;
    super(gateway, params);
    this.gateway = gateway;
    this.td = gateway.td;

    /*
    this.addCharacteristicDelegate({
      key: 'on',
      Characteristic: this.Characteristics.hap.On,
      value: false,
    });
    */
    this.addCharacteristicDelegate({
      key: 'lastUpdated',
      Characteristic: this.Characteristics.my.LastUpdated,
      value: toEveDate(getTimestamp()),
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'tokenExpiration',
      Characteristic: this.td.Characteristics.TokenExpires,
      value: toEveDate(getTimestamp()),
      // silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'nextRefresh',
      Characteristic: this.td.Characteristics.NextRefresh,
      value: toEveDate(getTimestamp()),
      // silent: true,
    });

    this.log('Tellstick service initialized');
  }
}

module.exports = Tellstick;
