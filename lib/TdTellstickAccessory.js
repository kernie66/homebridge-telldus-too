const AccessoryDelegate = require('homebridge-lib/lib/AccessoryDelegate.js');
const HomebridgeTelldusApi = require('./api/HomebridgeTelldusApi.js');
const clc = require('cli-color');
const {
  requestHandler,
  responseHandler,
  errorHandler,
} = require('./utils/apiHandlers.js');
const {
  isoDateTimeToIntl,
  getTimestamp,
  timestampToIntl,
} = require('./utils/dateTimeHelpers.js');
const checkStatusCode = require('./utils/checkStatusCode.js');
const { wait } = require('./utils/utils.js');
const uuid = require('./utils/uuid.js');
const Tellstick = require('./TdTellstickService.js');
const Button = require('./ButtonService.js');

class TdTellstickAccessory extends AccessoryDelegate {
  constructor(platform, params) {
    super(platform, {
      id: uuid(params.config.name),
      name: 'Tellstick',
      manufacturer: 'Telldus',
      model: 'Tellstick',
      firmware: '0.0.0',
      software: null,
      category: platform.Accessory.Categories.BRIDGE,
    });

    this.givenAccessToken = params.config.accessToken;
    this.locale = params.config.locale;
    // this.name = params.config.name;
    this.td = platform.td;
    //this.log = platform.log;
    //this.debug = platform.debug;
    //this.error = platform.error;
    //this.once = platform.once;

    this.addPropertyDelegate({
      key: 'accessToken',
      value: this.givenAccessToken,
      // silent: true,
    }).on('didSet', (value) => {
      this.log('accessToken changed to %s', value);
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

      this.initGateway();
      this.refreshAccessToken();

      this.service = new Tellstick(this, {
        // name: 'Tellstick Gateway',
        primaryService: true,
      });

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
  }

  async initGateway() {
    this.log('Initializing gateway');
    // Try to connect to Telldus gateway, and try again if not successful
    let connected = false;
    do {
      // Check that Telldus is responding to the defined request parameters
      try {
        const sysInfo = await this.telldusApi.getSystemInfo();
        if (!sysInfo.ok) {
          if (!checkStatusCode(sysInfo, this)) {
            if (!sysInfo.body.product) {
              this.error(
                'Unknown response from Tellstick, check if the host address is correct and restart'
              );
              this.log('Will retry in 1 minute...');
              await wait(60 * 1000);
            }
          }
        } else {
          // this.name = sysInfo.body.product;
          this.log(
            'Telldus system type:',
            clc.green(sysInfo.body.product)
          );
          this.log(
            'Telldus system version:',
            clc.green(sysInfo.body.version)
          );
          this.firmware = sysInfo.body.version;
          this.log(
            'Telldus system time:',
            clc.green(
              isoDateTimeToIntl(sysInfo.body.time, this.locale)
            )
          );
          // this.refreshAccessToken();
          connected = true;
        }
      } catch (error) {
        this.debug('Full error:\n', error);
        this.error('Error getting system information from Telldus');
        this.error('Error name:', error.name);
        this.error('Error message:', error.message);
        this.log('Will retry in 1 minute...');
        await wait(60 * 1000);
      }
    } while (!connected);
  }

  async refreshAccessToken() {
    const newToken = await this.telldusApi.refreshAccessToken();
    this.log('New token:', newToken);
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
      this.log('Old API token:', this.values.accessToken);
      this.values.accessToken = newToken.token;
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
