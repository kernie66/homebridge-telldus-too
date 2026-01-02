// homebridge-telldus-too/lib/api/TelldusApi.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//

import { HttpClient } from 'homebridge-lib/HttpClient';
import qs from 'qs';
import { COMMANDS } from '../TdConstants.js';
import { setSupportedMethods } from '../utils/utils.js';
import type { HttpError, HttpRequest, HttpResponse } from '../typings/HttpClient.js';

function setPath(path: string, queryString: {}) {
  return queryString ? `${path}?${qs.stringify(queryString)}` : path;
}

function checkFunction(handler: Function) {
  if (handler && typeof handler === 'function') {
    return handler;
  }
  return false;
}

class TelldusApi extends HttpClient {
  constructor(host: string, accessToken: string) {
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
        .on('error', (error: HttpError) => {
          this.lastError = error;
          if (this.errorHandler) {
            this.errorHandler(error);
          }
        })
        .on('request', (request: HttpRequest) => {
          if (this.requestHandler) {
            this.requestHandler(request);
          }
        })
        .on('response', (response: HttpResponse) => {
          this.lastResponse = response;
          if (this.responseHandler) {
            this.responseHandler(response);
          }
        });
    } catch (error) {
      let errorMessage = 'unknown error';
      if (error instanceof Error) {
        errorMessage = `${error.name}: ${error.message}`;
      }
      throw new Error(`TelldusAPI: Error initialising API client (${errorMessage})`);
    }
  }

  get getUrl() {
    return this.apiClient.url;
  }

  get getExpires() {
    return this.expires;
  }

  setRequestHandler(handler: Function) {
    this.requestHandler = checkFunction(handler);
  }

  setResponseHandler(handler: Function) {
    this.responseHandler = checkFunction(handler);
  }

  setErrorHandler(handler: Function) {
    this.errorHandler = checkFunction(handler);
  }

  setAccessToken(token: string) {
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

  _checkResponseOk(response: HttpResponse) {
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

  async getSensorInfo(id: string) {
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

  async getDeviceInfo(id: string, supportedMethods = setSupportedMethods(COMMANDS)) {
    const response = await this.apiClient.get(
      setPath('device/info', {
        id,
        supportedMethods,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  /*
  async setDeviceParameter(id, parameter, value) {
    return this.request({
      path: '/device/setParameter',
      qs: { id, parameter, value },
    });
  }
  */

  async bellDevice(id: string) {
    const response = await this.apiClient.get(
      setPath('device/bell', {
        id,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  async dimDevice(id: string, level: string) {
    const response = await this.apiClient.get(
      setPath('device/dim', {
        id,
        level,
      }),
      this.headers,
    );
    return this._checkResponseOk(response);
  }

  async onOffDevice(id: string, on: boolean) {
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
