const { ServiceDelegate } = require('homebridge-lib');

const buttonEvent = {
  PRESS: 0,
  HOLD: 1,
  SHORT_RELEASE: 2,
  LONG_RELEASE: 3,
  DOUBLE_PRESS: 4,
  TRIPLE_PRESS: 5,
  QUADRUPLE_PRESS: 6,
  SHAKE: 7,
  DROP: 8,
  TILT: 9,
};

let homeKitEvent;

class Button extends ServiceDelegate {
  static get SINGLE() {
    return 0x01;
  }
  static get DOUBLE() {
    return 0x02;
  }
  static get LONG() {
    return 0x04;
  }

  props(bitmap) {
    if (homeKitEvent == null) {
      homeKitEvent = {
        SINGLE_PRESS:
          this.Characteristics.hap.ProgrammableSwitchEvent
            .SINGLE_PRESS,
        DOUBLE_PRESS:
          this.Characteristics.hap.ProgrammableSwitchEvent
            .DOUBLE_PRESS,
        LONG_PRESS:
          this.Characteristics.hap.ProgrammableSwitchEvent.LONG_PRESS,
      };
    }

    switch (bitmap) {
      case Button.SINGLE:
        return {
          minValue: homeKitEvent.SINGLE_PRESS,
          maxValue: homeKitEvent.SINGLE_PRESS,
          validValues: [homeKitEvent.SINGLE_PRESS],
        };
      case Button.SINGLE | Button.DOUBLE:
        return {
          minValue: homeKitEvent.SINGLE_PRESS,
          maxValue: homeKitEvent.DOUBLE_PRESS,
          validValues: [
            homeKitEvent.SINGLE_PRESS,
            homeKitEvent.DOUBLE_PRESS,
          ],
        };
      case Button.SINGLE | Button.LONG:
        return {
          minValue: homeKitEvent.SINGLE_PRESS,
          maxValue: homeKitEvent.LONG_PRESS,
          validValues: [
            homeKitEvent.SINGLE_PRESS,
            homeKitEvent.LONG_PRESS,
          ],
        };
      case Button.SINGLE | Button.DOUBLE | Button.LONG:
        return {
          minValue: homeKitEvent.SINGLE_PRESS,
          maxValue: homeKitEvent.LONG_PRESS,
          validValues: [
            homeKitEvent.SINGLE_PRESS,
            homeKitEvent.DOUBLE_PRESS,
            homeKitEvent.LONG_PRESS,
          ],
        };
      case Button.DOUBLE:
        return {
          minValue: homeKitEvent.DOUBLE_PRESS,
          maxValue: homeKitEvent.DOUBLE_PRESS,
          validValues: [homeKitEvent.DOUBLE_PRESS],
        };
      case Button.DOUBLE | Button.LONG:
        return {
          minValue: homeKitEvent.DOUBLE_PRESS,
          maxValue: homeKitEvent.LONG_PRESS,
          validValues: [
            homeKitEvent.DOUBLE_PRESS,
            homeKitEvent.LONG_PRESS,
          ],
        };
      case Button.LONG:
        return {
          minValue: homeKitEvent.LONG_PRESS,
          maxValue: homeKitEvent.LONG_PRESS,
          validValues: [homeKitEvent.LONG_PRESS],
        };
    }
  }

  constructor(accessory, params = {}) {
    params.Service =
      accessory.Services.hap.StatelessProgrammableSwitch;
    params.subtype = params.button;
    params.exposeConfiguredName = true;
    super(accessory, params);
    this.button = params.button;

    this.addCharacteristicDelegate({
      key: 'event',
      Characteristic:
        this.Characteristics.hap.ProgrammableSwitchEvent,
      props: this.props(params.events),
    });

    this.addCharacteristicDelegate({
      key: 'index',
      Characteristic: this.Characteristics.hap.ServiceLabelIndex,
      value: params.button,
    });
  }

  homeKitValue(value, oldValue = 0, repeat = false) {
    const button = Math.floor(value / 1000);
    if (button !== this.button) {
      return null;
    }
    const oldButton = Math.floor(oldValue / 1000);
    const event = value % 1000;
    const oldEvent = oldValue % 1000;
    switch (event) {
      case buttonEvent.PRESS:
        // Wait for Hold or Release after press.
        return null;
      case buttonEvent.SHORT_RELEASE:
        return homeKitEvent.SINGLE_PRESS;
      case buttonEvent.HOLD:
        if (repeat) {
          return homeKitEvent.SINGLE_PRESS;
        }
      // falls through
      case buttonEvent.LONG_RELEASE:
        if (
          repeat ||
          (button === oldButton && oldEvent === buttonEvent.HOLD)
        ) {
          // Already issued action on previous Hold.
          return null;
        }
      // falls through
      case buttonEvent.TRIPLE_PRESS:
      case buttonEvent.QUADRUPLE_PRESS:
      case buttonEvent.SHAKE:
        return homeKitEvent.LONG_PRESS;
      case buttonEvent.DOUBLE_PRESS:
      case buttonEvent.DROP:
        return homeKitEvent.DOUBLE_PRESS;
      case buttonEvent.TILT:
      default:
        return null;
    }
  }

  update(value, oldValue, repeat) {
    const event = this.homeKitValue(value, oldValue, repeat);
    if (event !== null) {
      this.values.event = event;
    }
  }

  updateRotation() {
    this.values.event = homeKitEvent.SINGLE_PRESS;
  }
}

module.exports = Button;
