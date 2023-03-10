[![npm][image-1]][1]
[![npm][image-2]][2]
[![npm][image-3]][3]

# Homebridge-Telldus-Too

[Homebridge][4] plugin for Telldus TellStick ZNet Lite local access.

This plugin is an alternative to the excellent [homebridge-telldus][5] plugin. I missed some functions so I decided to write my own version, with much help and inspiration from the original plugin. In fact, the [homebridge-telldus][6] plugin is the main reason that I bought my first Raspberry Pi, because I wanted to control my Telldus devices from HomeKit. And then I started to learn JavaScript and Node JS, and rediscovered the fun in programming.

The plugin exposes the Telldus switches and sensors to HomeKit. It automatically detects on/off and dimmer switches, bell switches, as well as temperature, temperature/humidity, rain and wind sensors. Switches and sensors can be ignored by their ID, to get rid of e.g. sensors that Telldus finds but you don't want to expose in HomeKit. It is also possible to forcefully disable and enable switches in HomeKit, e.g. to ignore them during the Christmas season without the need to change the automations.

Sensors are updated from Telldus at a configurable interval, which makes it possible to use e.g. a temperature sensor in automations for alerts of too high/low temperatures.

## How to install

* `sudo npm install -g homebridge-telldus-too` or use the Homebridge UI to search for "homebridge-telldus-too"
* Get your personal Telldus local access token, see below
* Create a platform in your config.json file, or use the Homebridge UI (recommended)
* Restart homebridge

## Example config.json:

	   "platforms": [
	     {
	       "platform": "TelldusToo"
	       "name": "TelldusLocal",
	       "ipAddress": "<IP address of your TellStick ZNet Lite>",
	       "accessToken": "<Access token for TellStick local authentication>"
	      }
	    ]

This exposes all detectable Telldus switches and sensors to HomeKit. There are more configuration options available, see below.

## Local access

This plugin doesn't support the online access to Telldus Live cloud servers, only the local network access. This means that only the Telldus ZNet versions are supported, as far as I know. The rationale is that the plugin should work in your home even without WAN access. If requested, the Telldus Live access may be added.

## Get Telldus local access token

How to get the Telldus token is described [here][7], but the process is implemented in [telldus-local-auth][8].

* Find the LAN IP address of your TellStick device
* Install telldus-local-auth: `npm i -g telldus-local-auth` (or run it directly with `npx telldus-local-auth`)
* Run in a terminal `telldus-local-auth <IP OF YOUR DEVICE> homebridge-telldus-too`. This will open a browser window. See further instructions in the terminal.
* Note the returned token. This is the `accessToken` value used in the configuration.

It is recommended to use a one year access token. But the plug-in will refresh the access token every restart, and also well before the access token expires (if no restarts occurs).

## Recommended usage

HomeKit does not support viewing the custom characteristics of this plugin. The characteristics of the switches and sensors are visible in e.g. the free Eve app. These custom characteristics can be updated and used in automation conditions. The "Controller for Homekit" app is also a good way of controlling your automations.

## Configuration options

The possible configuration parameters are shown in the table below. As the switches and sensors are autodetected, it would be a lot of manual configuration options to use all the features of this plugin from the configuration file. The majority of the parameters can be changed manually or programmatically by using Eve and Controller for HomeKit, see [Control values][9], and will keep the settings when the plugin is restarted. The configuration parameters below will be the default for new discovered switches.


| Parameter               | Default | Description                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | :-------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ipAddress`             | -       | IP address or local host name of your Telldus device.                                                                                                                                                                                                                                                                       |
| `accessToken`           | -       | Local access token for your Telldus device, obtained as described above.                                                                                                                                                                                                                                                    |
| `delay`                 | 60      | Maximum random delay in seconds, max value = 300 (5 minutes). The minimum delay is automatically set to 20% of this value. This will be the default value for all new switches.                                                                                                                                             |
| `random`                | `false` | Enables random delays between 20% of`delay` and `delay` seconds (boolean). Affects all new switches.                                                                                                                                                                                                                        |
| `repeats`               | 0       | Sets the number of repetitions (0 - 5) of each on/off command to the switches. Use this for switches in places where they may need several activations before they react. First repeat occurs 4 seconds after the first command, which increases by 1 second for each repetition. A new command will abort the repetitions. |
| `lightbulb`             | `false` | Sets all switches to be presented as lightbulbs instead of switches in Homekit. Set this if you prefer the way it looks in the original homebridge-telldus plug-in. This makes the switches appear as lamps.                                                                                                                |
| `dimmerAsSwitch` | `false` | Sets all dimmers to switches, which makes them function as a on/off switch in Homekit. |
| `ignoreUnnamedSwitches` | `false` | Ignores switches without names in Telldus (boolean).                                                                                                                                                                                                                                                                        |
| `ignoreUnnamedSensors`  | `false` | Ignores sensors without names in Telldus (boolean).                                                                                                                                                                                                                                                                         |
| `ignore`                | -       | A string of local Telldus switch and sensor IDs that you don't want to see in Homebridge, separated by commas. Use this for named switches and sensors that can't be removed in Telldus.                                                                                                                                    |
| `configHeartrate`       | 300     | Default heartrate interval for the sensor status checks. This is the rate at which the sensors are read from Telldus in seconds. Note that Telldus updates the values independent from this plug-in.                                                                                                                        |
| `randomize`             | `false` | When set to`true`, the heartrate of the sensor reading will be randomized +/-20% from the `configHeartrate` value. This lets you spread the access to the Telldus device so that not all sensors are read at the same time.                                                                                                 |

## Control values

The plugin provides a lot of control values that can be viewed and used in Eve and Controller for HomeKit. The control values can be used in conditions for automations and set in scenes. Each switch and sensor can be controlled individually and dynamically through these values, without restarting Homebridge. Note that most numerical values in Eve are set using sliders, while Controller for Homekit gives options for manual input.


| Value                                 | Description                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Last activation<br />*(Switch, Bell)* | The time that the switch was last commanded on or off, from the last restart of the plugin.                                                                                                                                                                                                                                   |
| Brightness<br />*(Dimmer)*            | In addition to on/off and the other values of a normal switch, a dimmer switch also has a brightness value that can be set. If the switch is off when the brightness is changed, the switch will be turned on. There is a delay of 1 second before the dim level is sent to the switch, to ensure that it is turned on first. |
| Disable random once<br />*(Switch)*   | Disables the random delay for the next activation (on or off), i.e. the switch will be controlled immediately (boolean).                                                                                                                                                                                                      |
| Enable random once<br />*(Switch)*    | Enables the random delay for the next activation (on or off), i.e. the switch will be controlled after a random delay (boolean).                                                                                                                                                                                              |
| Random<br />*(Switch)*                | Selects if the switch will use a random delay for on/off activations or a direct activation. Corresponds to the`random` parameter.<br />Note that activations have a slight delay even without random delay, to allow other parameters to take effect before the switch is controlled.                                        |
| Delay<br />*(Switch)*                 | Corresponds to the`delay` parameter, but can be set individually for each switch (0 - 300 seconds).                                                                                                                                                                                                                           |
| Repetitions (total)<br />*(Switch)*   | Set the number of repetitions (0 - 10) for the commands (on/off), in addition to the first activation. Corresponds to the`repeats` parameter.                                                                                                                                                                                 |
| Repetition (current)<br />*(Switch)*  | Shows the current repetition, when repeats are active after a command.                                                                                                                                                                                                                                                        |
| Disabled<br />*(Switch, Bell)*        | Disables the control of the switch and sets it to constantly**off**. Can be used to temporarily disable automations without the need to change the scenes.                                                                                                                                                                    |
| Enabled<br />*(Switch)*               | Disables the control of the switch and sets it to constantly**on**. Can be used to temporarily disable automations without the need to change the scenes.                                                                                                                                                                     |
| Status<br />*(Switch)*                | Shows the current status of the switch automation; "Delaying", "Repeating", "Automation done" or "Manual control".                                                                                                                                                                                                            |
| Observation time<br />*(Sensor)*      | Shows the time when the sensor was last updated by Telldus.                                                                                                                                                                                                                                                                   |
| Temperature offset<br />*(Sensor)*    | Used to adjust the temperature value shown in Homekit and used in automations. Use this when the Telldus sensor is not showing the correct temperature.                                                                                                                                                                       |
| Heartrate                             | Internal heartbeat rate used to check for updated values of each switch and sensor. For switches, it is used to check if the switch has been changed from e.g. the Telldus app outside the plug-in.                                                                                                                           |
| Log Level                             | Controls the amount of log entries in the Homebridge log. Set to 0 to only show warnings, if you feel your log is spammed. Default = 2.                                                                                                                                                                                       |

## Supported devices

The following Telldus types of devices are supported:

* On/off switches. Appears as switches in Homekit, unless the `lightbulb` parameter is set. This differs from the original [homebridge-telldus][10] plug-in, where they appear as lights.
* Dimmers. Not very useful anymore, with low-power lights that doesn't seem to work very well with the dimmer. Can be used as a normal on/off switch at 100% brightness. Appears as lights in Homekit, to be able to set the brightness. Use the `dimmerAsSwitch` configuration to force it to be defined as a normal on/off switch.
* Bell switches. These have different behaviour depending on what it is in Telldus. A doorbell will trigger the doorbell action in Telldus when activated. A chime will play the configured sound when activated. Maybe not that useful, but they are there if you find a use for them.
* Temperature and combined temperature/humidity sensors. These also generate history in Eve, so you can keep track of e.g. the temperature in the fridge over time.
* Rain sensors. At the moment, these just show the rain for last 1 hour and last 24 hours and a boolean to show if it is raining. These functions are in testing phase, so there is no guarantee for any kind of correctness (I haven't tested them yet).
* Wind sensors. Shows the wind direction, current average wind speed and gust. Also in testing phase.

Other devices are not supported for now. Mostly because I don't have them.

## Advanced usage

### Manual control

When using random delay switches, the response from the switch will be delayed also when the switch is changed manually in Homekit, Eve etc. To override the delay, repeat the command immediately two times (e.g. on - off - on). The plug-in will detect rapid changes as manual control and skip the delay.

### Change values in scenes

The control values can be changed by scenes using Eve and Controller for Homekit, if you want to use the same switch (e.g. to trigger your lights) but with different parameters for specific conditions. Just create a scene, change the values and turn on the switch. Note that these changes will be set until changed the next time.

*Hint: Disable random by default for switches and turn on "Enable random once" in the automation scenes. This way you (or your partner) gets an immediate response when controlling the switch manually, and a random delay in automations.*

## Why do we need this plugin?

The main purpose is to use it with the random feature. This way you can simulate your presence at home by switching lights on and off in a scene and get them to react at different times, like if you walked around an turned them on.

Another purpose is to use the sensor values as conditions in automations, e.g. to issue a temperature warning if a temperature sensor reports a value over or under a set value.

## Good to know

* **At each restart, the plug-in will get the current states of the switches from Telldus, to ensure that Homekit reflects the state that Telldus thinks the switches are in.**
* **When a switch is commanded from Homekit, there is a mute period of 15 seconds before the plug-in will start to check the states from the Telldus gateway again. It is assumed that the automation will be performed using Homekit, but manual and automatic control from the Telldus app is also supported and reflected in Homekit.**
* **Migrating from [homebridge-telldus][11] to this plug-in is unfortunately a manual job. Since the switches are now shown as switches, they are easy to distinguish from the old light switches. Both plug-ins can be active at the same time, so use both until everything is migrated. Use Controller for Homekit to take a backup of your home before you begin. Use Eve to find the automations that uses the old switches and change them to the new switches. If you use Controller for Homekit, it might be possible to restore the lights if you set `lightbulb` to `true`, but this is untested.**
* **Use the terminal to check the logs, e.g. `cat /var/lib/homebridge/homebridge.log | grep '[Tt]elldus'`. They contain a lot of information at start-up, like checks of the configuration values and lists of the names and IDs of the switches and sensors found. Especially useful if the plug-in doesn't behave as expected.**
* **Use the debug mode to get even more information from the plug-in. Or lower the log level to get less information.**

## Thanks

A big thanks to John Lemón and the other contributors for the original [homebridge-telldus][12] plug-in. As I mentioned earlier, this is the reason I got my first Raspberry Pi and started coding again.

The plug-in uses [Homebridge-Lib][13] by Eric Baauw, which was also used to create the Telldus API used in the plug-in. While this might be a bigger code base than the original plug-in, I had fun coding it and learning more about Node.js. Probably not the best coding practices, but it works for me as a hobby programmer.

[1]:	https://www.npmjs.com/package/homebridge-telldus-too
[2]:	https://www.npmjs.com/package/homebridge-telldus-too
[3]:	https://www.npmjs.com/package/homebridge-telldus-too
[4]:	https://www.npmjs.com/package/homebridge
[5]:	https://github.com/johnlemonse/homebridge-telldus
[6]:	https://github.com/johnlemonse/homebridge-telldus
[7]:	https://tellstick-server.readthedocs.io/en/latest/api/authentication.html
[8]:	https://github.com/mifi/telldus-local-auth
[9]:	#control-values
[10]:	https://github.com/johnlemonse/homebridge-telldus
[11]:	https://github.com/johnlemonse/homebridge-telldus
[12]:	https://github.com/johnlemonse/homebridge-telldus
[13]:	https://github.com/ebaauw/homebridge-lib

[image-1]:	https://badgen.net/npm/v/homebridge-telldus-too
[image-2]:	https://badgen.net/npm/dw/homebridge-telldus-too
[image-3]:	https://badgen.net/npm/dt/homebridge-telldus-too