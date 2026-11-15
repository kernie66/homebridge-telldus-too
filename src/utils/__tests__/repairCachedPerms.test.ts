import type { API, PlatformAccessory } from 'homebridge';

import * as hap from '@homebridge/hap-nodejs';
import { describe, expect, it } from 'vite-plus/test';

import TdMyCustomTypes from '../../TdMyCustomTypes.js';
import { getExpectedPerms, repairCachedPerms } from '../repairCachedPerms.js';

const td = new TdMyCustomTypes({ hap } as unknown as API);
const validPerms = new Set<unknown>([
  hap.Perms.PAIRED_READ,
  hap.Perms.PAIRED_WRITE,
  hap.Perms.NOTIFY,
  hap.Perms.ADDITIONAL_AUTHORIZATION,
  hap.Perms.TIMED_WRITE,
  hap.Perms.HIDDEN,
  hap.Perms.WRITE_RESPONSE,
]);

// A cached accessory as restored by Homebridge, with the given perms on the custom 'Random' characteristic.
function cachedAccessory(perms: unknown[]) {
  const service = new hap.Service.Switch('Övre hallen');
  const random = service.addCharacteristic(td.Characteristics.Random as unknown as typeof hap.Characteristic);
  random.props.perms = perms as hap.Perms[];
  return { accessory: { services: [service] } as unknown as PlatformAccessory, service, random };
}

describe('Custom characteristic permissions', () => {
  it('only uses permissions that exist in HAP-NodeJS', () => {
    for (const [uuid, perms] of getExpectedPerms(td.Characteristics)) {
      expect(perms.length, uuid).toBeGreaterThan(0);
      for (const perm of perms) {
        expect(validPerms.has(perm), `${uuid}: ${String(perm)}`).toBe(true);
      }
    }
  });
});

describe('repairCachedPerms', () => {
  const expectedPerms = getExpectedPerms(td.Characteristics);

  it('restores permissions that were cached as null', () => {
    const { accessory, random } = cachedAccessory([null, 'ev', null]);

    const repaired = repairCachedPerms(accessory, expectedPerms);

    expect(repaired).toEqual([random.displayName]);
    expect(random.props.perms).toEqual(expectedPerms.get(random.UUID));
    expect(random.props.perms).toEqual([hap.Perms.PAIRED_READ, hap.Perms.NOTIFY, hap.Perms.PAIRED_WRITE]);
  });

  it('leaves valid cached permissions and standard characteristics alone', () => {
    const { accessory, service, random } = cachedAccessory([
      hap.Perms.PAIRED_READ,
      hap.Perms.NOTIFY,
      hap.Perms.PAIRED_WRITE,
    ]);
    const on = service.getCharacteristic(hap.Characteristic.On);
    const onPerms = [...on.props.perms];

    expect(repairCachedPerms(accessory, expectedPerms)).toEqual([]);
    expect(random.props.perms).toEqual([hap.Perms.PAIRED_READ, hap.Perms.NOTIFY, hap.Perms.PAIRED_WRITE]);
    expect(on.props.perms).toEqual(onPerms);
  });
});
