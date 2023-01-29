'use strict';

const axios = require('axios');
const assert = require('assert');
// const crypto = require('crypto');
// const querystring = require('querystring');
const querystring = require('qs');
const https = require('https');
const http = require('http');
const Debug = require('debug');
const nodeFetch = require('node-fetch');
const makeURL = require('../utils/makeURL');
// const OAuth = require('oauth-1.0a');

const debug = Debug('telldus-api');

function getFinalUrl(url, qs) {
  return qs ? `${url}?${querystring.stringify(qs)}` : url;
}

const commands = {
  on: 0x0001, // 1
  off: 0x0002, // 2
  bell: 0x0004, // 4
  toggle: 0x0008, // 8
  dim: 0x0010, // 16
  learn: 0x0020, // 32
  execute: 0x0040, // 64
  up: 0x0080, // 128
  down: 0x0100, // 256
  stop: 0x0200, // 512
};

const supportedMethods = Object.values(commands).reduce(
  (memo, num) => memo + num,
  0
);

// https://github.com/johnlemonse/homebridge-telldus/issues/76
async function fetch(url, opts) {
  return nodeFetch(url, {
    ...opts,
    agent: ({ protocol }) =>
      protocol === 'http:'
        ? new http.Agent()
        : new https.Agent({ minVersion: 'TLSv1' }),
  });
}

async function importAxiosMultiApi() {
  const createApiFetcher = await (
    await import('axios-multi-api')
  ).createApiFetcher;
  return createApiFetcher;
}

async function getTelldusApi(host, accessToken) {
  const checkedUrl = makeURL(host);
  if (!checkedUrl) {
    throw new TypeError('MyTelldusAPI: IP address not a valid value');
  }
  this.apiUrl = new URL(checkedUrl + '/api').href;
  this.accessToken = accessToken;
  this.axiosMultiApi = importAxiosMultiApi();

  this.api = this.axiosMultiApi.createApiFetcher({
    apiUrl: this.apiUrl,
    endpoints: {
      getSystemInfo: {
        method: 'get',
        url: '/system/info',
      },

      // No need to specify method: 'get' for GET requests
      getPosts: {
        url: '/posts/:subject',
      },

      updateUserDetails: {
        method: 'post',
        url: '/user-details/update/:userId',
      },

      // ...
      // You can add many more endpoints & keep the codebase clean
    },
    onError(error) {
      this.log('Request failed', error);
    },
    // Optional: default headers (axios config is supported)
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
    },
  });
}

class MyTelldusApi {
  constructor(host, accessToken) {
    const checkedUrl = makeURL(host);
    if (!checkedUrl) {
      throw new TypeError(
        'MyTelldusAPI: IP address not a valid value'
      );
    }
    this.apiUrl = new URL(checkedUrl + '/api').href;
    this.accessToken = accessToken;
    this.axiosMultiApi = importAxiosMultiApi();

    this.api = this.axiosMultiApi.createApiFetcher({
      apiUrl: this.apiUrl,
      endpoints: {
        getSystemInfo: {
          method: 'get',
          url: '/system/info',
        },

        // No need to specify method: 'get' for GET requests
        getPosts: {
          url: '/posts/:subject',
        },

        updateUserDetails: {
          method: 'post',
          url: '/user-details/update/:userId',
        },

        // ...
        // You can add many more endpoints & keep the codebase clean
      },
      onError(error) {
        this.log('Request failed', error);
      },
      // Optional: default headers (axios config is supported)
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    /*
    const checkedUrl = makeURL(host);
    if (!checkedUrl) {
      throw new TypeError('TelldusAPI: host not a valid value');
    }
    const apiUrl = new URL(checkedUrl + '/api').href;

    this.apiUrl = apiUrl;
    this.accessToken = accessToken;

    this.api = axios.create({
      baseURL: this.apiUrl,
      timeout: 2000,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
*/
    this.lastRefresh = 0;
  }

  get getUrl() {
    return this.apiUrl;
  }

  async getSystemInfo() {
    const response = await this.api.get('/system/info');
    return response;
  }

  async listSensors() {
    const response = await this.api.get('/sensors/list');
    return response;
  }

  async getSensorInfo(id) {
    const response = this.api.get('/sensor/info', { params: { id } });
    return response;
  }
  /*
  async setSensorName(id, name) {
    return this.request({
      path: '/sensor/setName',
      qs: { id, name },
    });
  }

  async setSensorIgnore(id, ignore) {
    return this.request({
      path: '/sensor/setIgnore',
      qs: { id, ignore },
    });
  }

  async listClients() {
    return this.request({ path: '/clients/list' });
  }

  async listDevices() {
    const response = await this.request({
      path: '/devices/list',
      qs: { supportedMethods },
    });
    return response.device;
  }

  async getDeviceInfo(id) {
    return this.request({
      path: '/device/info',
      qs: { id, supportedMethods },
    });
  }

  async addDevice(device) {
    return this.request({ path: '/device/setName', qs: device });
  }

  async deviceLearn(id) {
    return this.request({ path: '/device/learn', qs: { id } });
  }

  async setDeviceModel(id, model) {
    return this.request({
      path: '/device/setModel',
      qs: { id, model },
    });
  }

  async setDeviceName(id, name) {
    return this.request({
      path: '/device/setName',
      qs: { id, name },
    });
  }

  async setDeviceParameter(id, parameter, value) {
    return this.request({
      path: '/device/setParameter',
      qs: { id, parameter, value },
    });
  }

  async setDeviceProtocol(id, protocol) {
    return this.request({
      path: '/device/setProtocol',
      qs: { id, protocol },
    });
  }

  async removeDevice(id) {
    return this.request({ path: '/device/remove', qs: { id } });
  }

  async bellDevice(id) {
    return this.request({ path: '/device/bell', qs: { id } });
  }

  async dimDevice(id, level) {
    return this.request({ path: '/device/dim', qs: { id, level } });
  }

  async onOffDevice(id, on) {
    return this.request({
      path: `/device/turn${on ? 'On' : 'Off'}`,
      qs: { id },
    });
  }

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

  async listEvents() {
    return this.request({ path: '/events/list' });
  }

  /**
   * Returns device history
   * @param id device id
   * @param from timestamp in seconds
   * @param to timestamp in seconds
   * @returns {*} a Promise
   */

  /*
  async deviceHistory(id, from, to) {
    return this.request({
      path: '/device/history',
      qs: { id, from, to },
    });
  }
  */
}

/*
class TelldusLocalApi extends TelldusApi {
  constructor({
    host,
    accessToken,
    tokenRefreshIntervalSeconds = 60 * 60,
  }) {
    super();

    this.host = host;
    this.accessToken = accessToken;
    this.tokenRefreshIntervalSeconds = tokenRefreshIntervalSeconds;

    this.lastRefresh = 0;
    let options = {
      method: 'GET',
      url: 'http://192.168.1.118/api/system/info',
      headers: {
        cookie:
          '_03b47=http%3A%2F%2F10.0.0.56%3A80; PHPSESSID=d83e9074bea65ec1ef0a80f6b0afb07a; HASRV=jane',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImF1ZCI6ImhvbWVicmlkZ2UtdGVsbGR1cy10b28iLCJleHAiOjE3MDE2MzkzNTl9.eyJyZW5ldyI6dHJ1ZSwidHRsIjozMTUzNjAwMH0.X_H2N8fZY1bZ0d7f5c8unNChUh3oD6B3y_rY2ylQTNo',
      },
    };
  }

  getBaseUrl() {
    return `http://${this.host}/api`;
  }

  async refreshAccessToken() {
    if (
      new Date().getTime() - this.lastRefresh <
      this.tokenRefreshIntervalSeconds * 1000
    )
      return;
    this.lastRefresh = new Date().getTime();

    const response = await fetch(
      `${this.getBaseUrl()}/refreshToken?token=${this.accessToken}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    assert(response.status, 200);

    const body = await response.json();

    if (!body.expires) {
      debug(body);
      throw new Error(
        `Unable to refresh access token: ${body.error}`
      );
    }

    debug(
      'Refrehed access token, expires',
      new Date(body.expires * 1000).toISOString()
    );
  }

  async request({ method = 'GET', path, qs }) {
    await this.refreshAccessToken();

    const finalUrl = getFinalUrl(`${this.getBaseUrl()}${path}`, qs);

    const response = await fetch(finalUrl, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.error(error);
      });

    assert.equal(response.status, 200);
    return response.json();
  }
}

/*
class TelldusLiveApi extends TelldusApi {
  constructor(config) {
    super();
    this.config = config;
  }

  async request({ method = 'GET', path, qs }) {
    const telldusLiveBaseUrl = 'https://api.telldus.com/json';

    const {
      key,
      secret,
      tokenKey,
      tokenSecret,
    } = this.config;

    const oauth = OAuth({
      consumer: {
        key,
        secret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function: (baseString, key2) => crypto.createHmac('sha1', key2).update(baseString).digest('base64'),
    });

    const finalUrl = getFinalUrl(`${telldusLiveBaseUrl}${path}`, qs);

    const response = await fetch(finalUrl, {
      method,
      headers: {
        ...oauth.toHeader(oauth.authorize(
          { url: finalUrl, method },
          { key: tokenKey, secret: tokenSecret },
        )),
      },
    });

    assert.equal(response.status, 200);
    return response.json();
  }
}
*/
module.exports.MyTelldusApi = MyTelldusApi; //, TelldusLiveApi };
module.exports.getTelldusApi = getTelldusApi;
