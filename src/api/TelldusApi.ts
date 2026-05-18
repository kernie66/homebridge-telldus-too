// homebridge-telldus-too/lib/api/TelldusApi.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//

import { HttpClient } from 'homebridge-lib/HttpClient';
import queryString from 'query-string';

import type {
  DeviceInfoType,
  DeviceListType,
  ResponseBodyError,
  SensorInfoType,
  SensorListType,
  SystemInfoType,
  TurnOnOffType,
} from '../api/TelldusApi.types.js';
import type { RefreshTokenResponse } from './TelldusApi.types.js';

import { COMMANDS } from '../TdConstants.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import { setSupportedMethods } from '../utils/utils.js';

function setPath(
  path: string,
  qs: {
    [key: string]: unknown;
  },
) {
  return qs ? `${path}?${queryString.stringify(qs)}` : path;
}

const checkFunction = <T>(handler: T): T | false => {
  if (handler && typeof handler === 'function') {
    return handler;
  }
  return false;
};
// Set the maximum number of listeners for HttpClient to prevent memory leak warnings when multiple accessories
// are used. The default is 10, which is too low for this plugin when multiple accessories are used.
HttpClient.setMaxListeners(50);
class TelldusApi extends HttpClient {
  apiClient: HttpClient;
  headers: {
    [key: string]: string;
  } = {};
  accessToken!: string;
  lastResponse!: HttpResponse<ResponseBodyError>;
  lastError!: HttpError;
  requestHandler: ((request: HttpRequest) => void) | false = false;
  responseHandler: ((response: HttpResponse<ResponseBodyError>) => void) | false = false;
  errorHandler: ((error: HttpError) => void) | false = false;
  expires: number;

  constructor(host: string, accessToken: string) {
    super({});

    this.host = host;
    this.setAccessToken(accessToken);
    this.expires = 0;
    try {
      this.apiClient = new HttpClient({
        https: false,
        host: this.host,
        json: true,
        maxSockets: 1,
        keepAlive: false,
        path: '/api/',
        timeout: 15, //this.config.timeout,
        validStatusCodes: [200, 401, 403, 404],
      });
      this.apiClient
        .on('error', this.onErrorHandler)
        .on('request', this.onRequestHandler)
        .on('response', this.onResponseHandler);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      throw new Error(`TelldusAPI: Error initialising API client (${errorMessage})`);
    }
  }

  get getUrl() {
    return this.apiClient.url;
  }

  get getExpires() {
    return this.expires;
  }

  onErrorHandler = (error: HttpError) => {
    this.lastError = error;
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  };

  onRequestHandler = (request: HttpRequest) => {
    if (this.requestHandler) {
      this.requestHandler(request);
    }
  };

  onResponseHandler = (response: HttpResponse<ResponseBodyError>) => {
    this.lastResponse = response;
    if (this.responseHandler) {
      this.responseHandler(response);
    }
  };

  setRequestHandler(handler: (request: HttpRequest) => void) {
    this.requestHandler = checkFunction(handler);
  }

  setResponseHandler(handler: (response: HttpResponse<ResponseBodyError>) => void) {
    this.responseHandler = checkFunction(handler);
  }

  setErrorHandler(handler: (error: HttpError) => void) {
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

  checkResponseOk<T>(response: HttpResponse<T extends ResponseBodyError ? T : T & ResponseBodyError>) {
    const ok = (response.statusCode >= 200 && response.statusCode <= 299 && !response.body.error) || false;
    return ok;
  }

  async getSystemInfo() {
    const response: HttpResponse<SystemInfoType> = await this.apiClient.get('system/info', this.headers);
    response.ok = this.checkResponseOk<SystemInfoType>(response);
    return response;
  }

  async listSensors() {
    const response: HttpResponse<SensorListType> = await this.apiClient.get('sensors/list', this.headers);
    response.ok = this.checkResponseOk<SensorListType>(response);
    return response;
  }

  async getSensorInfo(id: number) {
    const response: HttpResponse<SensorInfoType> = await this.apiClient.get(
      setPath('sensor/info', {
        id,
      }),
      this.headers,
    );
    response.ok = this.checkResponseOk<SensorInfoType>(response);
    return response;
  }

  async listDevices(supportedMethods = setSupportedMethods(COMMANDS)) {
    const response: HttpResponse<DeviceListType> = await this.apiClient.get(
      setPath('devices/list', {
        supportedMethods,
      }),
      this.headers,
    );
    response.ok = this.checkResponseOk(response);
    return response;
  }

  async getDeviceInfo(id: number, supportedMethods = setSupportedMethods(COMMANDS)) {
    const response: HttpResponse<DeviceInfoType> = await this.apiClient.get(
      setPath('device/info', {
        id,
        supportedMethods,
      }),
      this.headers,
    );
    response.ok = this.checkResponseOk(response);
    return response;
  }

  /*
  async setDeviceParameter(id, parameter, value) {
    return this.request({
      path: '/device/setParameter',
      qs: { id, parameter, value },
    });
  }
  */

  async bellDevice(id: number) {
    const response = await this.apiClient.get(
      setPath('device/bell', {
        id,
      }),
      this.headers,
    );
    response.ok = this.checkResponseOk(response);
    return response;
  }

  async dimDevice(id: number, level: number) {
    const response = await this.apiClient.get(
      setPath('device/dim', {
        id,
        level,
      }),
      this.headers,
    );
    response.ok = this.checkResponseOk(response);
    return response;
  }

  async onOffDevice(id: number, on: boolean) {
    const response: HttpResponse<TurnOnOffType> = await this.apiClient.get(
      setPath(`device/turn${on ? 'On' : 'Off'}`, {
        id,
      }),
      this.headers,
    );
    response.ok = this.checkResponseOk(response);
    return response;
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

  async refreshAccessToken(): Promise<RefreshTokenResponse> {
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
