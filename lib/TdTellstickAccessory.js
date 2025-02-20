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

class TdTellstickAccessory extends AccessoryDelegate {
  constructor(platform, params) {
    super(platform, {
      id: uuid(params.config.name + 'GW'),
      name: 'Tellstick',
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

    // Persisted storage of the current access token
    this.addPropertyDelegate({
      key: 'accessToken',
      value: this.givenAccessToken,
      // silent: true,
      // }).on('didSet', (value) => {
      // this.accessToken = value;
    });

    // Persisted storage of the config file access token
    this.addPropertyDelegate({
      key: 'configAccessToken',
      value: this.givenAccessToken,
      // silent: true,
      // }).on('didSet', (value) => {
      // this.accessToken = value;
    });

    // Persisted storage of the expiration timestamp of the access token
    this.addPropertyDelegate({
      key: 'tokenExpires',
      value: getTimestamp(),
      // silent: true,
      // }).on('didSet', (value) => {
      // this.accessToken = value;
    });

    // Persisted storage of the timestamp of the next access token refresh
    this.addPropertyDelegate({
      key: 'nextRefresh',
      value: getTimestamp(),
      // silent: true,
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

      this.manageLogLevel(
        this.service.characteristicDelegate('logLevel'),
        true
      );
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
      this.log(clc.yellow('Identifying Tellstick'));
      this.log(
        'Current access token:',
        clc.green(this.values.accessToken)
      );
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
      this.telldusApi.setAccessToken(newToken.token);
      this.values.tokenExpires = newToken.expires;
      this.values.nextRefresh = this.nextRefresh;
      this.service.values.tokenExpiration = toEveDate(
        newToken.expires
      );
      this.service.values.lastUpdated = toEveDate(this.lastRefresh);
      this.service.values.nextRefresh = toEveDate(this.nextRefresh);
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
