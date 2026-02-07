/** biome-ignore-all lint/style/useExportType: homebridge-lib typings */
declare module 'homebridge-lib/CustomHomeKitTypes' {
  import type { HomebridgeAPI } from 'homebridge';

  class CustomHomeKitTypes {
    /** Creates a new instance of `CustomHomeKitTypes`.
     * @param {!API} homebridge - Homebridge API.
     */
    constructor(homebridge: HomebridgeAPI);
    /** Valid HomeKit admin-only access.
     * @type {Object<string, Characteristic.Access>}
     * @readonly
     */
    get Access(): HomebridgeAPI.hap.Characteristic.Access;
    /** Valid HomeKit characteristic formats.
     * @type {Object<string, Format>}
     * @readonly
     */
    get Formats(): HomebridgeAPI.hap.Characteristic.Formats;
    /** Valid HomeKit characteristic permissions.
     * @type {Object<string, Perm>}
     * @readonly
     */
    get Perms(): HomebridgeAPI.hap.Characteristic.Perms;
    /** Standard HomeKit characteristic units.
     * @type {Object<string, Unit>}
     * @readonly
     */
    get Units(): HomebridgeAPI.hap.Characteristic.Units;
    /** {@link Characteristic} subclasses for custom HomeKit characteristics.
     * @abstract
     * @type {Object.<string, Class>}
     * @readonly
     */
    get Characteristics(): {
      [key: string]: {
        UUID: string;
      };
    };
    /** {@link Service} subclasses for custom HomeKit services.
     * @abstract
     * @type {Object.<string, Class>}
     * @readonly
     */
    get Services(): {
      [key: string]: {
        UUID: string;
      };
    };
    /** @link Characteristic} subclasses for standard HomeKit characteristics.
     * @type {Object<string, Class>}
     * @readonly
     */
    get hapCharacteristics(): {
      [key: string]: HomebridgeAPI.hap.Characteristic;
    };
    /** {@link Service} subclasses for custom HomeKit services.
     * @type {Object<string, Class>}
     * @readonly
     */
    get hapServices(): {
      [key: string]: HomebridgeAPI.hap.Service;
    };
    /** Creates a new subclass of {@link Characteristic}
     * for a custom HomeKit characteristic.
     *
     * The newly created subclass is stored under `key` in
     * {@link CustomHomeKitTypes#Characteristics}.
     *
     * @final
     * @param {!string} key - Key for the Characteristic subclass.
     * @param {!string} uuid - Custom characteristic UUID.
     * @param {Props} props - Custom characteristic properties.
     * @param {string} [displayName=key] - Name displayed in HomeKit.
     * @returns {Class} The new {@link Characteristic} subclass.
     * @throws {TypeError} When a parameter has an invalid type.
     * @throws {RangeError} When a parameter has an invalid value.
     * @throws {SyntaxError} On duplicate key.
     */
    createCharacteristicClass(
      key: string,
      uuid: string,
      props: {
        format: HomebridgeAPI.hap.Characteristic.Format;
        unit?: HomebridgeAPI.hap.Characteristic.Unit;
        minValue?: number;
        maxValue?: number;
        minStep?: number;
        maxLen?: number;
        validValues?: Array<string | number | boolean>;
        validValueRanges?: Array<
          [
            number,
            number,
          ]
        >;
        defaultValue?: string | number | boolean;
        description?: string;
        manufacturerDescription?: string;
        perms: HomebridgeAPI.hap.Characteristic.Perm[];
      },
      displayName?: string,
    ): {
      [key: string]: {
        UUID: string;
      };
    };
    /** Creates a new subclass of {@link Service}
     * for a custom HomeKit service.
     *
     * The newly created subclass is stored under
     * {@link CustomHomeKitTypes#Services}.
     *
     * @final
     * @param {!string} key - Key for the Service.
     * @param {!string} uuid - UUID for the Service.
     * @param {Class[]} Characteristics - {@link Characteristic}
     * subclasses for pre-defined characteristics.
     * @param {Class[]} [OptionalCharacteristics=[]] -
     * {@link Characteristic} subclasses for optional characteristics.
     * @returns {Class} The new {@link Service} subclass.
     * @throws {TypeError} When a parameter has an invalid type.
     * @throws {RangeError} When a parameter has an invalid value.
     * @throws {SyntaxError} On duplicate key.
     */
    createServiceClass(
      key: string,
      uuid: string,
      Characteristics: {
        key: string;
        characteristic: string | number;
      }[],
      OptionalCharacteristics?: never[],
    ): {
      [key: string]: {
        UUID: string;
      };
    };
    /** Return the full HAP UUID.
     * @final
     * @param {!string} id - The short HAP UUID.
     * @param {?string} [suffix='-0000-1000-8000-0026BB765291'] - The suffix for
     * the long UUID.<br>
     * The default value is used by the standard HomeKit services and
     * characteristics, as defined by Apple.
     * @returns {!string} The full HAP UUID.
     * @throws {TypeError} When a parameter has an invalid type.
     * @throws {RangeError} When a parameter has an invalid value.
     */
    static uuid(id: string, suffix?: string): string;
  }
  export { CustomHomeKitTypes };
}
