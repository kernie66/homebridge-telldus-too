const AccessoryDelegate = require('homebridge-lib/lib/AccessoryDelegate.js');
const HomebridgeTelldusApi = require('./api/HomebridgeTelldusApi.js');
const clc = require('cli-color');
const {
  requestHandler,
  responseHandler,
  errorHandler,
} = require('./utils/apiHandlers.js');
const { isoDateTimeToIntl } = require('./utils/dateTimeHelpers.js');
const checkStatusCode = require('./utils/checkStatusCode.js');
const { wait } = require('./utils/utils.js');
const uuid = require('./utils/uuid.js');

class TdTellstick extends AccessoryDelegate {
  constructor(platform, params) {
    super(platform, {
      id: uuid(params.config.name),
      name: params.config.name,
      manufacturer: 'Telldus',
      model: 'Tellstick',
      firmware: '0.0.0',
      software: null,
      category: platform.Accessory.Categories.BRIDGE,
    });

    this.givenAccessToken = params.config.accessToken;
    this.log = platform.log;
    this.debug = platform.debug;
    this.error = platform.error;

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

    this.log('Access token: %s', this.values.accessToken);

    // Try to initialise the plugin
    try {
      this.telldusApi = new HomebridgeTelldusApi(
        platform.config.ipAddress,
        this.values.accessToken
      );
      this.log('Telldus API URL:', clc.green(this.telldusApi.getUrl));
      this.telldusApi.setRequestHandler(requestHandler.bind(this));
      this.telldusApi.setResponseHandler(responseHandler.bind(this));
      this.telldusApi.setErrorHandler(errorHandler.bind(this));
      this.once('heartbeat', this.init);
    } catch (error) {
      this.debug('Full error:\n', error);
      this.error('Error initialising the plug-in, suspending...');
      this.error('Error name:', error.name);
      this.error('Error message:', error.message);
      // sleep(Math.pow(2, 25));
    }
  }

  async init() {
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
                'Unknown response from Telldus, check if the host address is correct and restart'
              );
              this.log('Will retry in 1 minute...');
              await wait(60 * 1000);
            }
          }
        }
        this.log(
          'Telldus system type:',
          clc.green(sysInfo.body.product)
        );
        this.log(
          'Telldus system version:',
          clc.green(sysInfo.body.version)
        );
        this.log(
          'Telldus system time:',
          clc.green(
            isoDateTimeToIntl(sysInfo.body.time, this.config.locale)
          )
        );
        // this.refreshAccessToken();
        connected = true;
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
}

module.exports = TdTellstick;
