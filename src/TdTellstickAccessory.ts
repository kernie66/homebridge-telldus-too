// homebridge-telldus-too/lib/TdTellstickAccessory.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//
// Homebridge plugin for Telldus.

import clipboard from 'clipboardy';
import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate';
import colors from 'yoctocolors';
import TelldusApi from './api/TelldusApi.js';
import type TdMyCustomTypes from './TdMyCustomTypes.js';
import type TdPlatform from './TdPlatform.js';
import TellstickService from './TellstickService.js';
import { errorHandler, requestHandler, responseHandler } from './utils/apiHandlers.js';
import { getTimestamp, toEveDate } from './utils/dateTimeHelpers.js';
import handleError from './utils/handleError.js';
import uuid from './utils/uuid.js';

type TellstickAccessoryValues = {
  accessToken: string;
  configAccessToken: string;
  tokenExpires: number;
  nextRefresh: number;
};
class TdTellstickAccessory extends AccessoryDelegate<TdPlatform, TellstickAccessoryValues> {
  service!: TellstickService;
  td: TdMyCustomTypes;
  givenAccessToken?: string;
  locale?: string;
  firmware?: string;
  telldusApi!: TelldusApi;
  lastRefresh!: number;
  accessTokenExpires!: number;
  nextRefresh!: number;
  handleError: typeof handleError;

  constructor(
    platform: TdPlatform,
    params: {
      config: {
        name: string;
        ipAddress: string;
        accessToken?: string;
        locale?: string;
      };
    },
  ) {
    super(platform, {
      id: uuid(params.config.name),
      name: 'Tellstick',
      manufacturer: 'Telldus',
      model: 'Tellstick',
      firmware: '0.0.0',
      software: '',
      category: platform.Accessory.Categories.BRIDGE,
    });

    this.givenAccessToken = params.config.accessToken;
    this.locale = params.config.locale;
    this.td = platform.td;
    this.handleError = handleError;
    // this.name = params.config.name;

    console.log('this.logLevel:', this.logLevel);
    this.debug('Initializing Tellstick accessory with name:', colors.green(this.name));
    // Persisted storage of the current access token
    this.addPropertyDelegate({
      key: 'accessToken',
      value: this.givenAccessToken,
      silent: true,
    });

    // Persisted storage of the config file access token
    this.addPropertyDelegate({
      key: 'configAccessToken',
      value: this.givenAccessToken,
      silent: true,
    });

    // Persisted storage of the expiration timestamp of the access token
    this.addPropertyDelegate({
      key: 'tokenExpires',
      value: getTimestamp(),
      silent: true,
    });

    // Persisted storage of the timestamp of the next access token refresh
    this.addPropertyDelegate({
      key: 'nextRefresh',
      value: getTimestamp(),
      silent: true,
    });

    this.debug('IP address:', colors.green(platform.config.ipAddress));
    this.debug('Config access token:', this.values.configAccessToken);
    this.debug('Current access token:', this.values.accessToken);

    // Try to initialise the gateway
    try {
      this.telldusApi = new TelldusApi(platform.config.ipAddress, this.values.accessToken);
      this.log('Telldus API URL:', colors.green(this.telldusApi.getUrl));
      this.telldusApi.setRequestHandler(requestHandler.bind(this));
      this.telldusApi.setResponseHandler(responseHandler.bind(this));
      this.telldusApi.setErrorHandler(errorHandler.bind(this));

      this.debug('Add Tellstick service');
      this.service = new TellstickService(this, {
        name: 'Tellstick Gateway',
        primaryService: true,
      });
      this.manageLogLevel(this.service.characteristicDelegate('logLevel'), true);
    } catch (error) {
      this.handleError({
        header: 'Tellstick Error',
        error,
        reason: `Error initializing the Tellstick gateway, check the error message and fix the issue`,
      });
      throw new Error(`Tellstick Accessory Error`);
    }

    this.debug('Accessory initialised');
    this.heartbeatEnabled = true;
    setImmediate(() => {
      this.emit('initialised');
    });
    this.on('identify', async () => {
      this.warn(colors.yellow('Identifying Tellstick'));
      this.warn('Current access token:', colors.green(this.values.accessToken));
      clipboard.writeSync(this.values.accessToken);
    });
  }

  async getNewAccessToken() {
    const newToken = await this.telldusApi.refreshAccessToken();
    if (newToken.expires) {
      this.lastRefresh = getTimestamp();
      this.accessTokenExpires = newToken.expires;
      this.nextRefresh = this.lastRefresh + (newToken.expires - this.lastRefresh) * 0.8;
      this.log('Telldus access token expires:', colors.green(toEveDate(newToken.expires)));
      this.log('Next scheduled token refresh:', colors.blueBright(toEveDate(this.nextRefresh)));
      this.values.accessToken = newToken.token;
      this.telldusApi.setAccessToken(newToken.token);
      this.values.tokenExpires = newToken.expires;
      this.values.nextRefresh = this.nextRefresh;
      this.service.values.tokenExpiration = toEveDate(newToken.expires);
      this.service.values.lastUpdated = toEveDate(this.lastRefresh);
      this.service.values.nextRefresh = toEveDate(this.nextRefresh);
      return true;
    } else {
      this.warn("Telldus access token couldn't be refreshed, maybe it already expired");
      return false;
    }
  }
}

export default TdTellstickAccessory;
