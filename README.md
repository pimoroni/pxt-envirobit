# enviro:bit

 [![Build Status](https://travis-ci.org/pimoroni/pxt-envirobit.svg?branch=master)](https://travis-ci.org/pimoroni/pxt-envirobit)

This package adds support for the Pimoroni enviro:bit to makecode.microbit.org.

An enviro:bit is required to use this package, grab yours here: https://shop.pimoroni.com/products/enviro-bit

To use this package, go to https://makecode.microbit.org/, click "Advanced" then "Add Package" and search for enviro:bit, or paste the URL of this GitHub repository in (https://github.com/pimoroni/pxt-envirobit). 

## JavaScript Reference

### Air & Weather

enviro:bit is equipped with a bme280 capable of reading the temperature, pressure and humidity of your environment.

The following functions return the temperature, pressure and humidity in standard formats with low precision - useful for basic programs and flows.

* `envirobit.getTemperature()` - Returns the temperature in degrees celcius as a whole number: 15, 16, 25, 26 etc
* `envirobit.getPressure()` - Returns the pressure in hPa as a whole number
* `envirobit.getHumidity()` - Returns the relative humidity (a percentage) as a whole number

Each of these functions has a "Fine" equivilent ( available in "Advanced" in block view ) which returns the same value with a higher precision - useful for logging or responding to small changes:

* `envirobit.getTemperatureFine()` - Returns the temperature in hundredths of a degree celcius as a whole number: eg: 1525 represents 15.25 degrees
* `envirobit.getPressure()` - Returns the pressure in pascals, 100 pascals = 1 hectopascal
* `envirobit.getHumidity()` - Returns the humdity in hundreths of a percent: eg: 7515 represents 75.15% relative humidity

For example, this script will scroll the current temperature across micro:bit's display:

```typescript
basic.forever(() => {
    basic.showNumber(envirobit.getTemperature())
})
```

### Colour & Light

enviro:bit is also equipped with a tcs3472 colour sensor which consists of multiple light sensors filtered with different coloured windows.

It measures the light level with a clear filter, plus the level of Red, Green and Blue light with appropriate filters.

The following functions get the proportional amount of each colour, adjusted against the light level to the range 0-255:

* `envirobit.getRed()`
* `envirobit.getGreen()`
* `envirobit.getBlue()`

To read the absolute light level, use `envirobit.getLight()`.

For example this script will toggle the micro:bit's LED display on when the light level is less than 50:

```typescript
basic.forever(() => {
    if (envirobit.getLight() < 500) {
        basic.showLeds(`
            . . # . .
            . # # # .
            # # # # #
            . # # # .
            . . # . .
            `)
    } else {
        basic.clearScreen()
    }
})
```

### Sound

Finally, enviro:bit has a mems microphone which senses the amount of noise in your environment. It's great for detecting loud sounds like claps or shouts so your program can respond to them.

* `envirobit.onClap(() => {})` - Perform an action when a clap is detected
* `envirobit.timeSinceLastClap()` - Get the time (in milliseconds) since a clap was last detected
* `envirobit.waitForClap(timeout=1000)` - DEPRECATED - Wait timeout milliseconds for a clap, return true if one is heard, false if not
* `envirobit.waitForDoubleClap(timeout=1000)` - DEPRECATED - Wait timeout milliseconds for a double clap, return true if one is heard, false if not

The sensitivity of `waitForClap` and `waitForDoubleClap` can be tweaked:

* `envirobit.setClapSensitivity(value)` - Set the sensitivity for clap detection (0-100), a higher number means quiter claps will be recognised but other noises might be too!

You can also get the sound level:

* `envirobit.getSoundLevel()` - Returns the current sound level, should return 0 to +-443.

Or the noise level, averaged over 5 samples:

* `envirobit.getNoiseLevel()` - Returns the current noise level, smoothed over time

For example this script will toggle micro:bit's LED display on and off when you clap:

```typescript
let lights = false

envirobit.setClapSensitivity(80)

envirobit.onClap(() => {
    lights = !(lights)
    if (lights) {
        basic.showLeds(`
            . . # . .
            . # # # .
            # # # # #
            . # # # .
            . . # . .
            `)
    } else {
        basic.clearScreen()
    }
})
```

And to do something on double clap and additionally clear the screen after no clap is heard for 2 seconds, you could do:

```typescript
envirobit.onClap(() => {
    if (envirobit.timeSinceLastClap() < 500) {
        basic.showIcon(IconNames.Yes)
    }
})
basic.forever(() => {
    if (envirobit.timeSinceLastClap() > 2000) {
        basic.clearScreen()
    }
})
```

To detect triple/quadruple claps you could increment a counter and perform your action when it reaches the desired number.

## License

MIT License

Copyright (c) 2018 Pimoroni Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Supported targets

* for PXT/microbit

```package
scrollbit=github:pimoroni/pxt-envirobit
```
