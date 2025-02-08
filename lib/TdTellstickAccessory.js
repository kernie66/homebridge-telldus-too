const AccessoryDelegate = require('homebridge-lib/lib/AccessoryDelegate.js');
const HomebridgeTelldusApi = require('./api/HomebridgeTelldusApi.js');
const clc = require('cli-color');
const {
  requestHandler,
  responseHandler,
  errorHandler,
} = require('./utils/apiHandlers.js');
const {
  getTimestamp,
  toEveDate,
  timestampToIntl,
} = require('./utils/dateTimeHelpers.js');
const uuid = require('./utils/uuid.js');
const Tellstick = require('./TdTellstickService.js');
const Button = require('./ButtonService.js');

class TdTellstickAccessory extends AccessoryDelegate {
  constructor(platform, params) {
    super(platform, {
      id: uuid(params.config.name + 'GW'),
      name: 'Tellstick GW',
      manufacturer: 'Telldus',
      model: 'Tellstick',
      firmware: '0.0.0',
      software: null,
      category: platform.Accessory.Categories.BRIDGE,
    });

    this.givenAccessToken = params.config.accessToken;
    this.locale = params.config.locale;
    this.td = platform.td;
    // this.name = params.config.name;

    this.addPropertyDelegate({
      key: 'accessToken',
      value: this.givenAccessToken,
      // silent: true,
      // }).on('didSet', (value) => {
      // this.accessToken = value;
    });

    this.addPropertyDelegate({
      key: 'tokenExpires',
      value: getTimestamp(),
      // silent: true,
      // }).on('didSet', (value) => {
      // this.accessToken = value;
    });

    this.debug(
      'Found access token for IP:',
      clc.green(platform.config.ipAddress)
    );

    // Try to initialise the gateway
    try {
      this.telldusApi = new HomebridgeTelldusApi(
        platform.config.ipAddress,
        this.values.accessToken
      );
      this.log('Telldus API URL:', clc.green(this.telldusApi.getUrl));
      this.telldusApi.setRequestHandler(requestHandler.bind(this));
      this.telldusApi.setResponseHandler(responseHandler.bind(this));
      this.telldusApi.setErrorHandler(errorHandler.bind(this));

      this.log('Add Tellstick service');
      this.service = new Tellstick(this, {
        name: 'Tellstick Gateway',
        primaryService: true,
      });

      this.log('Add Tellstick button service');
      this.buttonService = new Button(this, {
        name: this.name + ' Button',
        button: 1,
        events: Button.SINGLE | Button.DOUBLE | Button.LONG,
      });
    } catch (error) {
      this.debug('Full error:\n', error);
      this.error('Error initialising the plug-in, suspending...');
      this.error('Error name:', error.name);
      this.error('Error message:', error.message);
      // sleep(Math.pow(2, 25));
    }

    this.debug('Accessory initialised');
    this.heartbeatEnabled = true;
    setImmediate(() => {
      this.emit('initialised');
    });
    this.on('identify', async () => {
      this.log('Identifying Tellstick');
    });
  }

  async getNewAccessToken() {
    const newToken = await this.telldusApi.refreshAccessToken();
    if (newToken.expires) {
      this.lastRefresh = getTimestamp();
      this.accessTokenExpires = newToken.expires;
      this.nextRefresh =
        this.lastRefresh +
        (newToken.expires - this.lastRefresh) * 0.9;
      this.log(
        'Telldus access token expires:',
        clc.green(timestampToIntl(newToken.expires, this.locale))
      );
      this.log(
        'Next scheduled token refresh:',
        clc.blueBright(timestampToIntl(this.nextRefresh, this.locale))
      );
      this.values.accessToken = newToken.token;
      this.values.tokenExpires = newToken.expires;
      this.service.values.tokenExpiration = toEveDate(
        newToken.expires
      );
      this.service.values.lastUpdated = toEveDate(this.lastRefresh);
      return true;
    } else {
      this.warn(
        "Telldus access token couldn't be refreshed, maybe it already expired"
      );
      return false;
    }
  }
}

module.exports = TdTellstickAccessory;
