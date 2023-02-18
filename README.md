[![npm](https://badgen.net/npm/v/homebridge-telldus-too)](https://www.npmjs.com/package/homebridge-telldus-too)
[![npm](https://badgen.net/npm/dw/homebridge-telldus-too)](https://www.npmjs.com/package/homebridge-telldus-too)
[![npm](https://badgen.net/npm/dt/homebridge-telldus-too)](https://www.npmjs.com/package/homebridge-telldus-too)

# Homebridge-Telldus-Too

[Homebridge](https://www.npmjs.com/package/homebridge) plugin for Telldus TellStick ZNet Lite local access.

This plugin is an alternative to the excellent [homebridge-telldus](https://github.com/johnlemonse/homebridge-telldus) plugin. I missed some functions so I decided to write my own version, with much help and inspiration from the original plugin. In fact, the [homebridge-telldus](https://github.com/johnlemonse/homebridge-telldus) plugin is the main reason that I bought my first Raspberry Pi, because I wanted to control my Telldus devices from HomeKit. And then I started to learn JavaScript and Node JS, and rediscovered the fun in programming.

The plugin exposes the Telldus switches and sensors to HomeKit. It automatically detects on/off and dimmer switches, bell switches, as well as temperature, temperature/humidity, rain and wind sensors. Switches and sensors can be ignored by their ID, to get rid of e.g. sensors that Telldus finds but you don't want to expose in HomeKit. It is also possible to forcefully disable and enable switches in HomeKit, e.g. to ignore them during the Christmas season without the need to change the automations.

Sensors are updated from Telldus at a configurable interval, which makes it possible to use e.g. a temperature sensor in automations for alerts of too high/low temperatures.

## How to install

* ```sudo npm install -g homebridge-telldus-too``` or use the Config UI to search for "homebridge-telldus-too"
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

HomeKit does not support viewing the custom characteristics of this plugin. The characteristics of the switches and sensors are visible in the free Eve app. These custom characteristics can be updated and used in automation conditions. The "Controller for Homekit" app is also a good way of controlling your automations.

## Configuration options

The possible configuration parameters are shown in the table below. As the switches and sensors are autodetected, it would be a lot of manual configuration options to use all the features of this plugin from the configuration file. The majority of the parameters can be changed manually or programmatically by using Eve and Controller for HomeKit, see [Control values](#control-values), and will keep the settings when the plugin is restarted. The configuration parameters below will be the default for new discovered switches.


| Parameter               | Default | Description                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ipAddress`             | -       | IP address or local host name of your Telldus device.                                                                                                                                                                                                                                                                       |
| `accessToken`           | -       | Local access token for your Telldus device, obtained as described above.                                                                                                                                                                                                                                                    |
| `delay`                 | 60      | Maximum random delay in seconds, max value = 300 (5 minutes). The minimum delay is automatically set to 20% of this value. This will be the default value for all new switches.                                                                                                                                             |
| `random`                | `false` | Enables random delays between 20% of`delay` and `delay` seconds (boolean). Affects all new switches.                                                                                                                                                                                                                        |
| `repeats`               | 0       | Sets the number of repetitions (0 - 5) of each on/off command to the switches. Use this for switches in places where they may need several activations before they react. First repeat occurs 4 seconds after the first command, which increases by 1 second for each repetition. A new command will abort the repetitions. |
| `ignoreUnnamedSwitches` | `false` | Ignores switches without names in Telldus (boolean).                                                                                                                                                                                                                                                                        |
| `ignoreUnnamedSensors`  | `false` | Ignores sensors without names in Telldus (boolean).                                                                                                                                                                                                                                                                         |
| `ignore`                | -       | A string of local Telldus switch and sensor IDs that you don't want to see in Homebridge, separated by commas. Use this for named switches and sensors that can't be removed in Telldus.                                                                                                                                    |
| `configHeartrate`       | 300     | Heartrate interval for the sensor status checks. This is the rate at which the sensors are read from Telldus in seconds. Note that Telldus updates the values independent from this plug-in.                                                                                                                                |
| `randomize`             | `false` | When set to`true`, the heartrate of the sensor reading will be randomized +/-20% from the `configHeartrate` value. This is to spread the access to the Telldus device so that not all sensors are read at the same time.                                                                                                    |

## Control values

The plugin provides a lot of control values that can be viewed and used in Eve and Controller for HomeKit. The control values can be used in conditions for automations and set in scenes. Each switch and sensor can be controlled individually and dynamically through these values, without restarting Homebridge. Note that most numerical values in Eve are set using sliders, while Controller for Homekit gives options for manual input.


| Value                                 | Description                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Last activation<br />*(Switch, Bell)* | The time that the switch was last commanded on or off, from the last restart of the plugin.                                                                                                                                                                                                                                   |
| Brightness<br />*(Dimmer)*            | In addition to on/off and the other values of a normal switch, a dimmer switch also has a brightness value that can be set. If the switch is off when the brightness is changed, the switch will be turned on. There is a delay of 1 second before the dim level is sent to the switch, to ensure that it is turned on first. |
| Disable random once<br />*(Switch)*   | Disables the random delay for the next activation (on or off), i.e. the switch will be controlled immediately (boolean).                                                                                                                                                                                                      |
| Enable random once<br />*(Switch)*    | Enables the random delay for the next activation (on or off), i.e. the switch will be controlled after a random delay (boolean).                                                                                                                                                                                              |
| Random<br />*(Switch)*                | Selects if the switch will use a random delay for on/off activations or a direct activation. Corresponds to the `random` parameter.<br />Note that activations have a slight delay, to allow other parameters to take effect before the switch is controlled.                                                                  |
| Delay<br />*(Switch)*                 | Corresponds to the `delay` parameter, but can be set individually for each switch (0 - 300 seconds).                                                                                                                                                                                                                           |
| Repetitions (total)<br />*(Switch)*   | Set the number of repetitions (0 - 10) for the commands (on/off), in addition to the first activation. Corresponds to the `repeats` parameter.                                                                                                                                                                                 |
| Repetition (current)<br />*(Switch)*  | Shows the current repetition, when repeats are active after a command.                                                                                                                                                                                                                                                        |
| Repetition (current)                  | The current repetition count, only valid when the switch is active. The initial activation of the switch is 0. Can be used in automations to control different lights at different repetition cycles.                                                                                                                         |
| Repetitions (total)                   | Corresponds to the `repeats` parameter. The switch will be turned Off during the motion activation, then turned On again for the number of repetition times.                                                                                                                                                                   |
| Disabled<br />*(Switch, Bell)*        | Disables the control of the switch and sets it to constantly **off**. Can be used to temporarily disable automations without the need to change the scenes.                                                                                                                                                                    |
| Enabled<br />*(Switch)*               | Disables the control of the switch and sets it to constantly **on**. Can be used to temporarily disable automations without the need to change the scenes.                                                                                                                                                                     |
| Status<br />*(Switch)*                | Shows the current status of the switch automation; "Delaying", "Repeating", "Automation done" or "Manual control".                                                                                                                                                                                                            |
| Observation time<br />*(Sensor)*      | Shows the time when the sensor was last updated by Telldus.                                                                                                                                                                                                                                                                   |
| Temperature offset<br />*(Sensor)*    | Used to adjust the temperature value shown in Homekit and used in automations. Use this when the Telldus sensor is not showing the correct temperature.                                                                                                                                                                       |
| Heartrate                             | Internal heartbeat rate used e.g. to keep track of the time left of the timer. The heartbeat and the timers are not synced, so the time left may be off by up to the heartrate value. The default value of 15 s is recommended for most cases, unless the delay time is long. Corresponds to the `heartrate` parameter.        |
| Log Level                             | Controls the amount of log entries in the Homebridge log. Set to 0 to only show warnings, if you feel your log is spammed. Default = 2.                                                                                                                                                                                       |

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
