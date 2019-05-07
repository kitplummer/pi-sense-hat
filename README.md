# pi-sense-hat

An event-based wrapper around the python sense-hat library, based on the [node-red-node-pi-sense-hat](https://www.npmjs.com/package/node-red-node-pi-sense-hat) library.

## Usage

### Examples
Example code is provided in plain javascript and typescript, in the `./examples` folder.

### Events

A SenseHat instance generates readings from the various sensors on the Sense HAT, grouped into
three different event types:
* `motion`
* `environment`
* `joystick`

#### Motion events

Motion events include readings from the accelerometer, gyroscope and magnetometer,
as well as the current compass heading. They are sent at a rate of approximately 10
per second. The `motion` event passes an object with the
following values:

  - `acceleration.x/y/z` : the acceleration intensity in Gs
  - `gyroscope.x/y/z` : the rotational intensity in radians/s
  - `orientation.roll/pitch/yaw` : the angle of the axis in degrees
  - `compass` : the direction of North in degrees

#### Environment events

Environment events include readings from the temperature, humidity and pressure
sensors. They are sent at a rate of approximately 1 per second.  The `environment` event passes an object
with the following values:

  - `temperature` : degrees Celsius
  - `humidity` : percentage of relative humidity
  - `pressure` : Millibars

#### Joystick events

Joystick events are sent when the Sense HAT joystick is interacted with. The
 `joystick` event passes object with the following values:

  - `key` : one of `UP`, `DOWN`, `LEFT`, `RIGHT`, `ENTER`
  - `state` : the state of the key:
    - `0` : the key has been released
    - `1` : the key has been pressed
    - `2` : the key is being held down


### Output Methods

These methods send commands to the 8x8 LED display on the Sense HAT.

#### Set the colour of individual pixels

`setPixelColour(x, y, colour, x2, y2, colour...)`


`x` and `y` must either be a value from 0 to 7, a `*` to indicate the entire row
or column, or a range such as `3-6`.

`colour` must be one of:

  - the well-known <a href="https://en.wikipedia.org/wiki/Web_colors" target="_new">HTML colour names</a> - eg `red` or `aquamarine`,
  - the <a href="http://cheerlights.com/cheerlights-api/">CheerLights colour names</a>,
  - a HEX colour value - eg `#aa9900`
  - an RGB triple - `190,255,0`
  - or simply `off`

To set the entire screen to red: 

```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.setPixelColour('*','*','red')
```

To set the four corners of the display to red, green (#00ff00), yellow and blue (0,0,255):

```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.setPixelColour(0,0,'red',0,7,'#00ff00',7,7,'yellow',7,0,0,0,255)
```

To set a 3-pixel wide column to purple: 
```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.setPixelColour('4-6','*','purple')
```


#### Rotate the screen

rotate(angle:0|90|180|270)

`angle` must be 0, 90, 180 or 270.

Example:
```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.rotate(180);
```

#### Flip the screen

`flip(horizontal=true)`

To flip on the horizontal or vertical axis respectively.

Example:

```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.flip(true); 
```

#### Display a message

`displayMessage(text:string, colour:string="white", background:string="off", speed:number=3)`

If the text is a single character, it will be displayed without scrolling. To
scroll a single character, append a blank space after it - `"A "`.

The following message properties can be used to customise the appearance:
  - `text` - the text to be displayed. If the text is a single character, it will be displayed without scrolling. To scroll a single character, append a blank space after it - `"A "`.
  - `colour` - the colour of the text, default: `white`
  - `background` - the colour of the background, default: `off`
  - `speed` - the scroll speed. A value in the range 1 (slower) to 5 (faster), default: `3`

Example:
```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.displayMessage("Hello world", "blue", "green", 4);
```

#### Set the screen brightness

`brightness(high=true)`

`To flip on the horizontal or vertical axis respectively.

Example:

```javascript
let senseHat = require('../dist/sense-hat').create();
senseHat.brightness(true); 
```


## Credits

The library was based on the [node-red-pi](https://github.com/node-red/node-red-nodes/tree/master/hardware/sensehat) library under the terms of the Apache 2.0 license agreement:

Directly copied:
* sensehat.py
* scripts/checklib.sh

Adapted:
* readme.md
* src/sense-hat.ts (adpated from sensehat.js)
* colours.ts (adapted from colours.js)
