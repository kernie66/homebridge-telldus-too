# Changelog

All notable changes to this project will be documented in this file.

## 1.1.0

### Fixes
- Added `Tellstick` accessory to persist gateway values
- Corrected use of refreshed access token, which is now persisted correctly
- Only uses access token from config file if it is updated, otherwise the refreshed access token is used
- Added information about last update, next refresh and expiration for the access token, visible in e.g. Eve.
- Added `Identify` support in e.g. Eve, which logs the current access token in the console for the `Tellstick` accessory, and the Telldus ID for sensors and switches.
- Probably last release supporting Node.js 18.

## 1.0.6

### Fixes
- Corrected auth token check
- Fixed error in error handler
- Retries if connection to Telldus device fails

## 1.0.5

### Fixes
- Ensure that dimmer brightness is **not** sent when dimmer is turned off :-)

## 1.0.4

### Fixes
- Ensures that dimmer brightness is sent when dimmer is turned on
- Corrected the brightness value sent to Telldus

## 1.0.3

### Fixes
- Corrected dimmer operation, incorrectly turned off after 60 s

### Bump dependencies
- NodeJS 18.16.0
- Homebridge 1.6.1
- homebridge-lib 6.3.16

## 1.0.1

- Corrected errors when Telldus gateway is offline

## 1.0.0

- First public release. Rewritten from "homebridge-telldus" as a platform using 'homebridge-lib', and added some features
