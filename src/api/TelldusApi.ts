// homebridge-telldus-too/lib/api/TelldusApi.ts
// Copyright © 2022-2026 Kenneth Jagenheim. All rights reserved.
//

import { HttpClient } from 'homebridge-lib/HttpClient';
import qs from 'qs';
import { COMMANDS } from '../TdConstants.js';
import type { HttpError, HttpRequest, HttpResponse } from '../typings/HttpClientTypes.js';
import type {
  DeviceBaseType,
  DeviceInfoType,
  SensorBaseType,
  SensorInfoType,
  SystemInfoType,
} from '../typings/TelldusTypes.js';
import { getErrorMessage, setSupportedMethods } from '../utils/utils.js';
import type { RefreshTokenResponse, RequestResponse } from './TelldusApi.types.js';

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
  host: string;
  expires: number;
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

  checkResponseOk<T>(response: HttpResponse<T>) {
    const requestResponse = {
      ok: false,
      body: response.body,
      request: response.request,
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: response.headers,
      parsedBody: response.parsedBody,
    };
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      if (!response.body.error) {
        requestResponse.ok = true;
      }
    }
    return requestResponse;
  }

  async getSystemInfo(): Promise<RequestResponse<SystemInfoType>> {
    const response: HttpResponse<SystemInfoType> = await this.apiClient.get('system/info', this.headers);
    return this.checkResponseOk<SystemInfoType>(response);
  }

  async listSensors(): Promise<RequestResponse<SensorBaseType[]>> {
    const response: HttpResponse<SensorBaseType[]> = await this.apiClient.get('sensors/list', this.headers);
    return this.checkResponseOk<SensorBaseType[]>(response);
  }

  async getSensorInfo(id: number): Promise<RequestResponse<SensorInfoType>> {
    const response: HttpResponse<SensorInfoType> = await this.apiClient.get(
      setPath('sensor/info', {
        id,
      }),
      this.headers,
    );
    return this.checkResponseOk(response);
  }

  async listDevices(supportedMethods = setSupportedMethods(COMMANDS)): Promise<RequestResponse<DeviceBaseType[]>> {
    const response: HttpResponse<DeviceBaseType[]> = await this.apiClient.get(
      setPath('devices/list', {
        supportedMethods,
      }),
      this.headers,
    );
    return this.checkResponseOk(response);
  }

  async getDeviceInfo(
    id: number,
    supportedMethods = setSupportedMethods(COMMANDS),
  ): Promise<RequestResponse<DeviceInfoType>> {
    const response: HttpResponse<DeviceInfoType> = await this.apiClient.get(
      setPath('device/info', {
        id,
        supportedMethods,
      }),
      this.headers,
    );
    return this.checkResponseOk(response);
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
    return this.checkResponseOk(response);
  }

  async dimDevice(id: string, level: number) {
    const response = await this.apiClient.get(
      setPath('device/dim', {
        id,
        level,
      }),
      this.headers,
    );
    return this.checkResponseOk(response);
  }

  async onOffDevice(id: string, on: boolean) {
    const response = await this.apiClient.get(
      setPath(`device/turn${on ? 'On' : 'Off'}`, {
        id,
      }),
      this.headers,
    );
    return this.checkResponseOk(response);
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
