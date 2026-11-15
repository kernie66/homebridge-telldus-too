// homebridge-telldus-too/lib/utils/repairCachedPerms.ts
//
// Repair permissions of custom characteristics restored from the accessory cache.

import type { Perms, PlatformAccessory } from 'homebridge';

type CharacteristicClass = (new () => { props: { perms: Perms[] } }) & { UUID: string };

/**
 * Builds a map from characteristic UUID to the permissions defined for it.
 *
 * @param characteristicClasses - The custom characteristic classes, e.g. `td.Characteristics`.
 */
export function getExpectedPerms(characteristicClasses: Record<string, unknown>): Map<string, Perms[]> {
  const expectedPerms = new Map<string, Perms[]>();
  for (const Characteristic of Object.values(characteristicClasses) as CharacteristicClass[]) {
    expectedPerms.set(Characteristic.UUID, new Characteristic().props.perms);
  }
  return expectedPerms;
}

/**
 * Homebridge restores cached characteristics with the props they were saved with, not the props of the
 * current characteristic definition. Earlier versions of this plugin used `Perms.READ` and `Perms.WRITE`, which are
 * `undefined` in Homebridge 2.x, so the cache can contain e.g. `[null, "ev", null]`. HAP-NodeJS then
 * excludes the whole accessory. This resets the permissions of every custom characteristic whose cached
 * permissions differ from the current definition.
 *
 * @param accessory - The restored accessory.
 * @param expectedPerms - The current permissions per characteristic UUID, from `getExpectedPerms()`.
 * @returns The display names of the repaired characteristics.
 */
export function repairCachedPerms(
  accessory: Pick<PlatformAccessory, 'services'>,
  expectedPerms: Map<string, Perms[]>,
): string[] {
  const repaired: string[] = [];
  for (const service of accessory.services) {
    for (const characteristic of service.characteristics) {
      const perms = expectedPerms.get(characteristic.UUID);
      if (perms == null) {
        continue;
      }
      const cachedPerms: (Perms | null | undefined)[] = characteristic.props.perms ?? [];
      const isSame = cachedPerms.length === perms.length && cachedPerms.every((perm, i) => perm === perms[i]);
      if (!isSame) {
        characteristic.setProps({ perms: [...perms] });
        repaired.push(characteristic.displayName);
      }
    }
  }
  return repaired;
}
