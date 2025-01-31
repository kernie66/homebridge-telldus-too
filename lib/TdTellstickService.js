const { ServiceDelegate } = require('homebridge-lib');

class Tellstick extends ServiceDelegate {
  constructor(gateway, params = {}) {
    params.Service = gateway.Services.hap.Switch; // td.Services.TelldusGateway;
    params.exposeConfiguredName = true;
    super(gateway, params);
    this.gateway = gateway;
    this.td = gateway.td;

    this.addCharacteristicDelegate({
      key: 'on',
      Characteristic: this.Characteristics.hap.On,
      value: false,
    });

    this.addCharacteristicDelegate({
      key: 'lastUpdated',
      Characteristic: this.Characteristics.my.LastUpdated,
      silent: true,
    });

    this.addCharacteristicDelegate({
      key: 'statusActive',
      Characteristic: this.Characteristics.hap.StatusActive,
      value: true,
      silent: true,
    });
  }
}

module.exports = Tellstick;
