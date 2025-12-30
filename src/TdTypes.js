// homebridge-telldus-too/lib/TdTypes.js
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//
// Custom HomeKit Characteristics and common functions.

import { CustomHomeKitTypes } from 'homebridge-lib/CustomHomeKitTypes';
import uuid from './utils/uuid.js';
//const homebridgeLib = require('homebridge-lib');
//const uuid = require('./utils/uuid');

class TdTypes extends CustomHomeKitTypes {
  constructor(homebridge) {
    super(homebridge);

    this.createCharacteristicClass(
      'Delay',
      uuid('0A0'),
      {
        format: this.Formats.UINT32,
        unit: this.Units.SECONDS,
        minValue: 0,
        maxValue: 300,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Delay time'
    );

    this.createCharacteristicClass(
      'MinDelay',
      uuid('0A1'),
      {
        format: this.Formats.UINT32,
        unit: this.Units.SECONDS,
        minValue: 0,
        perms: [
          this.Perms.READ,
          this.Perms.NOTIFY,
          this.Perms.WRITE,
          this.Perms.HIDDEN,
        ],
      },
      'Delay time (minimum)'
    );

    this.createCharacteristicClass(
      'TimeOut',
      uuid('0A2'),
      {
        format: this.Formats.UINT32,
        unit: this.Units.SECONDS,
        minValue: 0,
        //      maxValue: 3600,
        perms: [this.Perms.READ, this.Perms.NOTIFY],
      },
      'Current timeout value'
    );

    this.createCharacteristicClass(
      'Repeats',
      uuid('0A3'),
      {
        format: this.Formats.INT8,
        minValue: 0,
        maxValue: 10,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Repetitions (total)'
    );

    this.createCharacteristicClass(
      'Repetition',
      uuid('Repetition'),
      {
        format: this.Formats.UINT8,
        minValue: 0,
        maxValue: 10,
        perms: [this.Perms.READ, this.Perms.NOTIFY],
      },
      'Repetition (current)'
    );

    this.createCharacteristicClass(
      'Random',
      uuid('0A9'),
      {
        format: this.Formats.BOOL,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Random enabled'
    );

    this.createCharacteristicClass(
      'EnableRandomOnce',
      uuid('EnableRandomOnce'),
      {
        format: this.Formats.BOOL,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Enable random once'
    );

    this.createCharacteristicClass(
      'DisableRandomOnce',
      uuid('DisableRandomOnce'),
      {
        format: this.Formats.BOOL,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Disable random once'
    );

    this.createCharacteristicClass(
      'Disabled',
      uuid('Disabled'),
      {
        format: this.Formats.BOOL,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Disabled'
    );

    this.createCharacteristicClass(
      'Enabled',
      uuid('Enabled'),
      {
        format: this.Formats.BOOL,
        perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      },
      'Enabled'
    );

    this.createCharacteristicClass(
      'Status',
      uuid('Status'),
      {
        format: this.Formats.STRING,
        perms: [this.Perms.READ, this.Perms.NOTIFY],
      },
      'Status'
    );

    this.createCharacteristicClass(
      'LastActivation',
      uuid('LastActivation'),
      {
        format: this.Formats.STRING,
        perms: [this.Perms.READ, this.Perms.NOTIFY],
      },
      'Last activation'
    );

    this.createCharacteristicClass(
      'TokenExpires',
      uuid('TokenExpires'),
      {
        format: this.Formats.STRING,
        perms: [this.Perms.READ, this.Perms.NOTIFY],
      },
      'Token Expires'
    );

    this.createCharacteristicClass(
      'NextRefresh',
      uuid('NextRefresh'),
      {
        format: this.Formats.STRING,
        perms: [this.Perms.READ, this.Perms.NOTIFY],
      },
      'Next Refresh'
    );

    this.createServiceClass(
      'TelldusGateway',
      uuid('TelldusGateway'),
      [
        this.Characteristics.LastUpdated,
        this.hapCharacteristics.StatusActive,
      ]
    );
  }
}

export default TdTypes;
