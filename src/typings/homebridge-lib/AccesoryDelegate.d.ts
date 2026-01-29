declare module 'homebridge-lib/AccessoryDelegate' {
  import EventEmitter from 'node:events';

  class AccessoryDelegate extends EventEmitter {
    constructor(platform, params = {});
  }

  export { AccessoryDelegate };
}
