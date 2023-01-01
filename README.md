[![npm](https://badgen.net/npm/v/homebridge-telldus-too)](https://www.npmjs.com/package/homebridge-telldus-too)
[![npm](https://badgen.net/npm/dw/homebridge-telldus-too)](https://www.npmjs.com/package/homebridge-telldus-too)
[![npm](https://badgen.net/npm/dt/homebridge-telldus-too)](https://www.npmjs.com/package/homebridge-telldus-too)

# Homebridge-Telldus-Too

[Homebridge](https://www.npmjs.com/package/homebridge) plugin for Telldus TellStick ZNet Lite local access.

This plugin is an alternative to the excellent [homebridge-telldus](https://github.com/johnlemonse/homebridge-telldus) plugin. I missed some functions so I decided to write my own version, with much help and inspiration from the original plugin. In fact, the [homebridge-telldus](https://github.com/johnlemonse/homebridge-telldus) plugin is the main reason that I bought my first Raspberry Pi, because I wanted to control my Telldus devices from HomeKit. And then I started to learn JavaScript and Node JS, and rediscovered the fun in programming.

The plugin exposes the Telldus switches and sensors to HomeKit. It automatically detects on/off and dimmer switches, and temperature, temperature/humidity, rain and wind sensors. Switches and sensors can be ignored by their ID, to get rid of e.g. sensors that Telldus finds but you don't want to expose in HomeKit. It is also possible to disable switches in HomeKit, e.g. to ignore them during the Christmas season without the need to change the automations.

Sensors are updated from Telldus at a configurable interval, which makes it possible to use e.g. a temperature sensor in automations for alerts of too high/low temperatures.


## How to install

* ```sudo npm install -g homebridge-telldus-too```
* Get your personal Telldus local access token, see below
* Create a platform in your config.json file, or use the Homebridge UI (recommended)
* Restart homebridge

## Example config.json:

 ```
    "platforms": [
      {
        "platform": "TelldusToo"
        "name": "TelldusLocal",
        "ipAddress": "<IP address of your TellStick ZNet Lite>",
        "accessToken": "<Access token for TellStick local authentication>"
       }
     ]
```
This exposes all detectable Telldus switches and sensors to HomeKit. There are more configuration options available, see below.

## Local access

This plugin doesn't support the online access to Telldus Live cloud servers, only the local network access. This means that only the Telldus ZNet versions are supported, as far as I know. The rationale is that the plugin should work in your home even without WAN access. If requested, the Telldus Live access may be added.

## Get Telldus local access token

How to get the Telldus token is described [here](https://tellstick-server.readthedocs.io/en/latest/api/authentication.html), but the process is implemented in [telldus-local-auth](https://github.com/mifi/telldus-local-auth).
* Find the LAN IP address of your TellStick device
* Install telldus-local-auth: ```npm i -g telldus-local-auth``` (or run it directly with ```npx telldus-local-auth```)
* Run in a terminal ```telldus-local-auth <IP OF YOUR DEVICE> homebridge-telldus-too```. This will open a browser window. See further instructions in the terminal.
* Note the returned token. This is the ```accessToken``` value used in the configuration.

## Recommended usage

HomeKit does not support viewing the custom characteristics of this plugin. The characteristics of the switches and sensors are visible in the free Eve app. These custom characteristics can be updated and used in automation conditions. The updates will be valid until the `Restore default` control is activated. The "Controller for Homekit" app is also a good way of controlling your automations.

## Configuration options

The possible configuration parameters are shown in the table below. I find them useful, but maybe I am a control freak :-). The parameters can be changed dynamically in Eve and Controller for HomeKit, see [Control values](#control-values), and will keep the settings when the plugin is restarted.

Parameter | Default | Description
----------|---------|----------------
`delay`   | 60      | (Maximum) delay in seconds, max value = 823999 (9 days, 23:59:59). Can also be given on the format `D:HH:MM:SS`, where D and HH are optional (e.g. 5:00 means 5 minutes = 300 seconds)
`minDelay` | 1      | Minimum delay in seconds or `D:HH:MM:SS`. Only valid when `random` is `true`. Will be set to `delay` if greater than `delay`.
`random`   | `false` | Enables random delays between `minDelay` and `delay` seconds (boolean).
`disableSensor`| `false` | Disables the motion sensor, i.e. only the switch will be available in HomeKit (boolean).
`startOnReboot` | `false` | Enables the delay switch when the plugin is restarted. Can be used e.g. to turn things on after power outage. Hint: Combine with a time of day condition, so your lights don't turn on while you sleep (boolean).
`singleActivation` | `false` | Disables the extension of the timer if the switch is activated repeatedly while on. Default is to restart the delay switch for each activation while on.
`repeats`   | 0      | The number of additional activations of the switch. Can be used to control different lights with several consecutive delays, see below (0 - 10, where 0 gives one activation of the switch, 1 gives two activations and so on). Set to -1 for infinite repeats.
`cron`      | Empty | Schedules the switch activation with a cron syntax. Add several schedules by separating the cron strings with ";".
`useConfig` | `true` | Use the values from the config file when Homebridge restarts. Set this to `false` to keep any changes to the parameters made in e.g. Eve or Controller for Homekit when Homebridge restarts.
`heartrate` | 15     | The time in seconds between polls in the plugin, see below.

## Control values

The plugin provides some control values that can be viewed and used in Eve and Controller for HomeKit. The control values can be used in conditions for automations and set in scenes. Each switch can be controlled individually and dynamically through these values, without restarting Homebridge. Note that numerical values in Eve are set using sliders, while Controller for Homekit gives options for manual input.

Value | Description
------|-------------
Last Motion  | The time that the motion sensor was last triggered by the delay switch. Includes a history graph when viewed in Eve.
Cron         | A text field where a new cron string can be entered. Eve remembers the string and is recommended to try out new schedules. Controller for Homekit shows the current string as a placeholder, but you cannot edit an existing string.
Cron schedule | Shows a readable interpretation of the cron string, limited to 64 characters. Use this to check that your cron strings gives the intended schedule.
Current timeout value | The actual delay value used by the switch. Only valid when the switch is On. Shows the calculated random delay or the fixed value.
Delay time (d/h/m/s) | Corresponds to the `delay` parameter, but separated in days,hours, minutes and seconds for better control using Eve sliders.
Delay time minimum (%) | Corresponds to the `minDelay` parameter, but given as a percentage of the maximum time. 0% = 1 second, 100% = `delay`.
Random enabled | Corresponds to the `random` parameter.
Repetition (current) | The current repetition count, only valid when the switch is active. The initial activation of the switch is 0. Can be used in automations to control different lights at different repetition cycles.
Repetitions (total) | Corresponds to the `repeats` parameter. The switch will be turned Off during the motion activation, then turned On again for the number of repetition times.
Restore default | Restores the configuration parameters to the default values from the configuration file.
Time left of timer | The time left before the delay time is up. Decremented by the heartbeat value. Used to continue the delay after a restart, if the delay was active.
Heartrate   | Internal heartbeat rate used e.g. to keep track of the time left of the timer. The heartbeat and the timers are not synced, so the time left may be off by up to the heartrate value. The default value of 15 s is recommended for most cases, unless the delay time is long. Corresponds to the `heartrate` parameter.
Log Level   | Controls the amount of log entries in the Homebridge log. Set to 0 to only show warnings, if you feel your log is spammed. Default = 2.

## Advanced usage

### Change values in scenes

The control values can be changed by scenes using Eve and Controller for Homekit, if you want to use the same switch (e.g. to trigger your lights) but with different parameters for specific conditions. Just create a scene, change the values and turn on the switch. Note that these changes will be set until changed the next time. Text values can only be set in scenes using Controller for Homekit, they are not visible in Eve scenes.

*Hint: You can create a scene that restores the control values to the default configuration, which is triggered by the motion sensor, to ensure that the changes are reset.*

### Stateful switch

A stateful switch can be created by setting the `delay` parameter to 0 s and the `random` parameter to `false`. The switch will trigger the motion sensor (if enabled) each time it is set to on, and will stay on until set to off. Set `singleActivation` to `true` to disable repeated motion sensor trigger when the switch is on.

*Hint: Set `startOnReboot` to `true` to get the switch set to on automatically when the plugin starts.*

## Why do we need this plugin?

The main purpose is to use it with the random feature. This way you can simulate your presence at home by switching lights on and off at
a random time around a configured starting time, e.g. set an automation to start at 7:00 PM, a delay of 1800 seconds and set random to true.
Now the motion switch will be triggered between 7:00 PM and 7:30 PM at a random time.

Other examples are, when using smart wall switch (to turn ON) and RGB light bulb (to switch color) together on the same scene can cause
no action on the bulb since the bulb might not even be ON when the command has been sent from homebridge.
For that, we need to set an automation to change the bulb color a few seconds after the wall switch ON command.

Another example is using this plugin to turn ON/OFF lights based on a motion/door sensor. This can be achieved by setting an automation
to turn ON a light when the delay swich is turned ON and turn OFF the light when the dedicated delay motion sensor is triggered. Use the minimum delay to make sure that the light is turned on long enough, e.g. to have time to unlock the door.

Also it can be use with any device that require a certain delay time from other devices (TV + RPi-Kodi / PC + SSH / etc...)

I also found that I used another plugin to trigger the delay switches by schedules, so I incorporated the cron feature in this plugin to get what I want to use myself.

## Good to know

* **When manually turning OFF the switch, the timer will stop and the motion sensor will NOT be triggered.**

* **When the delay switch is getting ON command while it's already ON, the timer will restart and the motion sensor trigger will be delayed. This can be disabled by the `singleActivation` configuration.**

* **If Homebridge or the plugin is restarted while a switch is active, the switch will continue the delay after the restart. This will override the `startOnReboot` configuration.**

* **If the switch delay is changed while the switch is on, the new delay value will be used the next time the switch is (re)started.**

## Thanks
This plugin is based on [homebridge-random-delay-switch](https://github.com/lisanet/homebridge-random-delay-switch), which in turn is based on [homebridge-delay-switch](https://github.com/nitaybz/homebridge-delay-switch) and [homebridge-automation-switches](https://github.com/grover/homebridge-automation-switches).

My purpose with this plugin was to turn it into a platform plugin by using [Homebridge-Lib](https://github.com/ebaauw/homebridge-lib) by Eric Baauw, and to learn how to write a plugin with a configuration schema.