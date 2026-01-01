// homebridge-telldus-too/lib/api/TelldusApi.js
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//

// const homebridgeLib = require('homebridge-lib');
// const querystring = require('qs');
import { HttpClient } from 'homebridge-lib/HttpClient';
import qs from 'qs';
import { COMMANDS } from '../TdConstants.js';
import { setSupportedMethods } from '../utils/utils.js';

function setPath(path, queryString) {
  return queryString ? `${path}?${qs.stringify(qs)}` : path;
}

function checkFunction(handler) {
  if (handler && typeof handler === 'function') {
    return handler;
  }
  return false;
}

class TelldusApi extends HttpClient {
  constructor(host, accessToken) {
    super();

    this.host = host;
    this.setAccessToken(accessToken);
    this.expires = 0;
    try {
      this.apiClient = new HttpClient({
        https: false,
        host: this.host,
        // headers: this.headers,
        json: true,
        maxSockets: 1,
        keepAlive: false,
        path: '/api/',
        timeout: 15, //this.config.timeout,
        validStatusCodes: [
          200,
          401,
          403,
          404,
        ],
      });
      this.apiClient
        .on('error', (error) => {
          this.lastError = error;
          if (this.errorHandler) {
            this.errorHandler(error);
          }
        })
        .on('request', (request) => {
          if (this.requestHandler) {
            this.requestHandler(request);
          }
        })
        .on('response', (response) => {
          this.lastResponse = response;
          if (this.responseHandler) {
            this.responseHandler(response);
          }
        });
    } catch (error) {
      // console.log('Error:', error);
      throw new TypeError(`TelldusAPI: Error initialising API client (${error.name}: ${error.message})`);
    }
  }

  get getUrl() {
    return this.apiClient.url;
  }

  get getExpires() {
    return this.expires;
  }

  setRequestHandler(handler) {
    this.requestHandler = checkFunction(handler);
  }

  setResponseHandler(handler) {
    this.responseHandler = checkFunction(handler);
  }

  setErrorHandler(handler) {
    this.errorHandler = checkFunction(handler);
  }

  setAccessToken(token) {
    this.accessToken = token;
    this.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  getLastResponse() {
    return this.lastResponse;
  }

  getLastError() {
    return this.lastError;
  }

  _checkResponseOk(response) {
    response.ok = false;
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      if (!response.body.error) {
        response.ok = true;
      }
    }
    return response;
  }

  async getSystemInfo() {
    const response = await this.apiClient.get('system/info', this.headers);
    return this._checkResponseOk(response);
  }

  async listSensors() {
    const response = await this.apiClient.get('sensors/list', this.headers);
    return this._checkResponseOk(response);
  }

  async getSensorInfo(id) {
    const response = await this.apiClient.get(
      setPath('sensor/info', {
        id,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  async listDevices(supportedMethods = setSupportedMethods(COMMANDS)) {
    const response = await this.apiClient.get(
      setPath('devices/list', {
        supportedMethods,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  async getDeviceInfo(id, supportedMethods = setSupportedMethods(COMMANDS)) {
    if (supportedMethods) {
      const response = await this.apiClient.get(
        setPath('device/info', {
          id,
          supportedMethods,
        }),
        this.headers,
      );
      return this._checkResponseOk(response);
    }
    return {
      ok: false,
      supportedMethods: supportedMethods,
    };
  }

  /*
  async setDeviceParameter(id, parameter, value) {
    return this.request({
      path: '/device/setParameter',
      qs: { id, parameter, value },
    });
  }
  */

  async bellDevice(id) {
    const response = await this.apiClient.get(
      setPath('device/bell', {
        id,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  async dimDevice(id, level) {
    const response = await this.apiClient.get(
      setPath('device/dim', {
        id,
        level,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  async onOffDevice(id, on) {
    const response = await this.apiClient.get(
      setPath(`device/turn${on ? 'On' : 'Off'}`, {
        id,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  /*
  async stopDevice(id) {
    return this.request({ path: '/device/stop', qs: { id } });
  }

  async upDownDevice(id, up) {
    return this.request({
      path: `/device/${up ? 'up' : 'down'}`,
      qs: { id },
    });
  }

  async commandDevice(id, command, value) {
    if (!commands[command])
      throw new Error('Invalid command supplied');
    return this.request({
      path: '/device/command',
      qs: { id, method: command, value },
    });
  }
  */
  async refreshAccessToken() {
    const token = this.accessToken;
    const response = await this.apiClient.get(
      setPath('refreshToken', {
        token,
      }),
      this.headers,
    );

    if (!response.body.expires) {
      throw new Error(`Unable to refresh access token: ${response.body.error}`);
    }

    return response.body;
  }
}

export default TelldusApi;
