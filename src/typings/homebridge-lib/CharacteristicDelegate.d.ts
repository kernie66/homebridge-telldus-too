import { Delegate } from 'homebridge-lib/Delegate';
/** Delegate of a HomeKit characteristic.
 * <br>See {@link CharacteristicDelegate}.
 * @name CharacteristicDelegate
 * @type {Class}
 * @memberof module:homebridge-lib
 */
/** Delegate of a HomeKit characteristic.
 *
 * A characteristic delegate manages a value that:
 * - Is persisted across homebridge restarts;
 * - Can be monitored through homebridge's log output;
 * - Can be monitored programmatically, through `didSet` events; and
 * - Mirrors the value of the associated HomeKit characteristic:
 *   - When the value is changed from HomeKit, the delegate's value is updated;
 *   - When the value is changed programmatically, the HomeKit characteristic
 * value is updated.
 *
 * A characteristic delegate might be created without an associated
 * characteristic, to manage a value that's hidden from HomeKit, but still
 * need to be persisted (e.g. credentials) or monitored (e.g. derived values).
 *
 * A characteristic delegate might be configured with asynchronous functions
 * to be called when HomeKit tries to read or update the characteristic value:
 * - The `willGet` function is called when HomeKit tries to reads the
 * characteristic value.<br>
 * It returns a promise that resolves to the value to return to HomeKit.
 * When the promise rejects, the previously cached value is returned.
 * - The `willSet` function is called when HomeKit tries to update the
 * characteristic value.<br>
 * It returns a promise that resolves to indicate that the accessory has
 * processed the new value.
 * When the promise rejects, the HomeKit characteristic is reset to the
 * previous value.
 *
 * HomeKit only sets or clears the error state of an accessory when it tries
 * to read or updates a characteristic value.
 * There's no way for an accessory to push the error state to HomeKit.
 * Because of this, the characteristic delegate never returns an error to
 * HomeKit.
 * To indicate that an accessory is in error, use the _Status Fault_
 * characteristic.
 *
 * Because the HomeKit app is unresponsive until the `getter` or `setter`
 * completes, the characteristic delegate provides timeout timers when calling
 * these functions.
 * Timeouts are handled as if the promise had rejected.
 *
 * @extends Delegate
 */
declare class CharacteristicDelegate extends Delegate {
  /** Create a new instance of a HomeKit characteristic delegate.
   *
   * Note that instances of `CharacteristicDelegate` are normally created by
   * invoking
   * {@link ServiceDelegate#addCharacteristicDelegate addCharacteristicDelegate()}
   * of the associated service delegate.
   * @param {!ServiceDelegate} serviceDelegate - Reference to the corresponding
   * HomeKit service delegate.
   * @param {!object} params - Parameters of the HomeKit characteristic
   * delegate.<br>
   * See
   * {@link ServiceDelegate#addCharacteristicDelegate addCharacteristicDelegate()}
   * @param {!string} params.key - The key for the characteristic delegate.<br>
   * Needs to be unique with the service delegate.
   * @param {?*} params.value - The initial value.<br>
   * Only used when the characteristic delegate is created for the first time.
   * Normally, the value is restored from persistent storage.
   * @param {?boolean} params.silent - Suppress homebridge log messages.
   * @param {?Characteristic} params.Characteristic - The type of the
   * associated HomeKit characteristic, from
   * {@link Delegate#Characteristic Characteristic}.
   * @param {?object} params.props - The properties of the associated HomeKit
   * characteristic.<br>
   * Overrides the properties from the characteristic type.
   * @param {?string} params.unit - The unit of the value of the HomeKit
   * characteristic.<br>
   * Overrides the unit from the characteristic type.
   * @param {?function} params.getter - Asynchronous function to be invoked
   * when HomeKit tries to read the characteristic value.<br>
   * This must be an `async` function returning a `Promise` to the new
   * characteristic value.
   * @param {?function} params.setter - Asynchronous function to be invoked
   * when HomeKit tries to update the characteristic value.<br>
   * This must be an `async` function returning a `Promise` that resolves
   * when the corresonding accessory has processed the updated value.
   * @param {integer} [params.timeout=1000] - Timeout (in msec) for blocking
   * HomeKit while waiting for the getter or setter.
   * @throws {TypeError} When a parameter has an invalid type.
   * @throws {RangeError} When a parameter has an invalid value.
   * @throws {SyntaxError} When a mandatory parameter is missing or an
   * optional parameter is not applicable.
   */
  constructor(serviceDelegate: any, params?: {});
  /** Destroy characteristic delegate and delete associated HomeKit characteristic.
   * @params {boolean} [delegateOnly=false] - Destroy the delegate, but keep the
   * associated HomeKit characteristic (including context).
   */
  _destroy(delegateOnly?: boolean): void;
  _hasPerm(perm: any): any;
  get _canRead(): any;
  get _canWrite(): any;
  get _canNotify(): any;
  get _writeResponse(): any;
  get _writeOnly(): any;
  get _notifyOnly(): boolean;
  /** Current log level (of the associated accessory delegate).
   *
   * The log level determines what type of messages are printed:
   *
   * 0. Print error and warning messages.
   * 1. Print error, warning, and log messages.
   * 2. Print error, warning, log, and debug messages.
   * 3. Print error, warning, log, debug, and verbose debug messages.
   *
   * Note that debug messages (level 2 and 3) are only printed when
   * Homebridge was started with the `-D` or `--debug` command line option.
   *
   * @type {!integer}
   * @readonly
   */
  get logLevel(): any;
  get displayName(): any;
  get _namePrefix(): string;
  validate(value: any): {
    value: any;
    s: string;
  };
  /** Value of associated Characteristic.
   */
  get value(): any;
  set value(v: any);
  /** Set the value of the associated HomeKit characteristic.
   */
  setValue(value: any): void;
  _onGet(callback: any): Promise<void>;
  _onSet(v: any, callback: any): Promise<void>;
}
export { CharacteristicDelegate };
