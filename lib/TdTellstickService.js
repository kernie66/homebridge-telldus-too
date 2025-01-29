const { ServiceDelegate } = require('homebridge-lib');

class Tellstick extends ServiceDelegate {
  constructor(gateway, params = {}) {
    params.Service = gateway.td.Services.TelldusGateway;
    params.exposeConfiguredName = true;
    super(gateway, params);
    this.gateway = gateway;

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

    this.addCharacteristicDelegate({
      key: 'search',
      Characteristic: this.Characteristics.my.Search,
      value: false,
    }).on('didSet', (value, fromHomeKit) => {
      if (fromHomeKit) {
        this.gateway.values.search = value;
      }
    });

    this.addCharacteristicDelegate({
      key: 'transitionTime',
      Characteristic: this.Characteristics.my.TransitionTime,
      value: this.gateway.defaultTransitionTime,
    });
    this.values.transitionTime = this.gateway.defaultTransitionTime;
  }
}

module.exports = Tellstick;
