//% weight=100 color=#000000 icon="\uf043" block="Enviro:Bit"
namespace envirobit {

    //% shim=envirobit::compensatePressure
    function compensatePressure(adc_p: number, var1: number, var2: number): number {
        return 0
    }

    //% shim=envirobit::setCompensationValues
    function setCompensationValues(dig_p7: number, dig_p8: number, dig_p9: number): void {
        return
    }

    class bme280 {
        is_setup: boolean
        addr: number
        dig_t1: uint16
        dig_t2: int16
        dig_t3: int16
        dig_p1: uint16
        dig_p2: int16
        dig_p3: int16
        dig_p4: int16
        dig_p5: int16
        dig_p6: int16
        dig_p7: int16
        dig_p8: int16
        dig_p9: int16
        dig_h1: uint8
        dig_h2: int16
        dig_h3: uint8
        dig_h4: int16
        dig_h5: int16
        dig_h6: int8

        temperature: number
        pressure: number
        humidity: number
        altitude: number
        //qnh: number

        constructor(addr: number) {
            this.is_setup = false
            this.addr = addr
        }

        setup(): void {
            if (this.is_setup) return
            this.is_setup = true
            //this.qnh = 101325 // hPa standard ISO atmosphere at sea level

            smbus.writeByte(this.addr, 0xe0, 0xb6) // Soft reset
            control.waitMicros(200000)
            smbus.writeByte(this.addr, 0xf4, 0b10110111) // x16 oversampling, normal mode
            control.waitMicros(200000)
            smbus.writeByte(this.addr, 0xf5, 0b10010000) // 500ms standby time, 16 filter coef
            control.waitMicros(200000)

            let compensation: number[] = smbus.unpack("<HhhHhhhhhhhhbB", smbus.readBuffer(this.addr, 0x88, 26))

            let temp: number[] = smbus.unpack("<hBbBbb", smbus.readBuffer(this.addr, 0xe1, 7))

            compensation.push(temp.shift()) // first two-byte number is dig_H2 (0xe1 / 0xe2)
            compensation.push(temp.shift()) // second single-byte number is dig_H3 (0xe3)

            let reg_e4: number = temp.shift()
            let reg_e5: number = temp.shift()
            let reg_e6: number = temp.shift()

            compensation.push((reg_e5 & 0x0f) | (reg_e4 << 4)) // dig_h4
            compensation.push((reg_e5 >> 4) | (reg_e6 << 4)) // dig_h5

            compensation.push(temp.shift()) // dig_h6 (0xe7)

            //serial.redirectToUSB()
            //serial.writeNumbers(compensation)
            //serial.writeLine("")

            this.dig_t1 = compensation.shift()
            this.dig_t2 = compensation.shift()
            this.dig_t3 = compensation.shift()
            this.dig_p1 = compensation.shift()
            this.dig_p2 = compensation.shift()
            this.dig_p3 = compensation.shift()
            this.dig_p4 = compensation.shift()
            this.dig_p5 = compensation.shift()
            this.dig_p6 = compensation.shift()
            this.dig_p7 = compensation.shift()
            this.dig_p8 = compensation.shift()
            this.dig_p9 = compensation.shift()
            compensation.shift() // Dispose of unused byte (0xa0)
            this.dig_h1 = compensation.shift()
            this.dig_h2 = compensation.shift()
            this.dig_h3 = compensation.shift()
            this.dig_h4 = compensation.shift()
            this.dig_h5 = compensation.shift()
            this.dig_h6 = compensation.shift()

            // Hand the necessary pressure compensation values over to C++ for later
            setCompensationValues(this.dig_p7, this.dig_p8, this.dig_p9);
        }

        getChipID(): number {
            this.setup()
            return smbus.readBuffer(this.addr, 0xd0, 1)[0]
        }

        update(): void {
            this.setup()
            let raw: Buffer = smbus.readBuffer(this.addr, 0xf7, 8)

            let raw_temp: number = (raw[3] << 12) + (raw[4] << 4) + (raw[5] >> 4)
            let raw_press: number = (raw[0] << 12) + (raw[1] << 4) + (raw[2] >> 4)
            let raw_hum: number = (raw[6] << 8) + raw[7]

            let var1: number = ((((raw_temp>>3) - (this.dig_t1<<1))) * (this.dig_t2)) >> 11;
            let var2: number = (((((raw_temp>>4) - (this.dig_t1)) * ((raw_temp>>4) - (this.dig_t1))) >> 12) * (this.dig_t3)) >> 14;
            let t_fine: number = var1 + var2;
            this.temperature = (t_fine * 5 + 128) >> 8;

            var1 = ((t_fine)>>1) - 64000;
            var2 = (((var1>>2) * (var1>>2)) >> 11 ) * (this.dig_p6);
            var2 = var2 + ((var1*(this.dig_p5))<<1);
            var2 = (var2>>2)+((this.dig_p4)<<16);
            var1 = (((this.dig_p3 * (((var1>>2) * (var1>>2)) >> 13 )) >> 3) + (((this.dig_p2) * var1)>>1))>>18;
            var1 =((((32768+var1))*(this.dig_p1))>>15);
            if (var1 == 0)
            {
                this.pressure = 0
            }
            else {
                // Dive into C++ to use unsigned 32bit integer type and avoid overflows =/
                this.pressure = compensatePressure(raw_press, var1, var2) 
            }


            let h: number = (t_fine - (76800));
            h = (((((raw_hum << 14) - ((this.dig_h4) << 20) - ((this.dig_h5) * h)) +
              (16384)) >> 15) * (((((((h * (this.dig_h6)) >> 10) * (((h *
              (this.dig_h3)) >> 11) + (32768))) >> 10) + (2097152)) *
              (this.dig_h2) + 8192) >> 14));
            h = (h - (((((h >> 15) * (h >> 15)) >> 7) * (this.dig_h1)) >> 4));
            h = (h < 0 ? 0 : h);
            this.humidity = (h > 419430400 ? 419430400 : h) >> 12;

            //this.altitude = 44330.0 * (1.0 - Math.pow(this.pressure / (this.qnh / 100.0), (1.0 / 5.255)))
        }
                
        /*setQNH(qnh: number): void {
            this.qnh = qnh
        }*/

        getTemperature(): number {
            this.update()
            return this.temperature
        }

        getPressure(): number {
            this.update()
            return this.pressure
        }

        getHumidity(): number {
            this.update()
            return this.humidity
        }

        /*getAltitude(): number {
            this.update()
            return this.altitude
        }*/
    }

    class tcs3472 {
        is_setup: boolean
        addr: number
        leds: DigitalPin

        constructor(addr: number, leds: DigitalPin = DigitalPin.P8) {
            this.is_setup = false
            this.addr = addr
            this.leds = leds
        }

        setup(): void {
            if (this.is_setup) return
            this.is_setup = true
            smbus.writeByte(this.addr, 0x80, 0x03)
            smbus.writeByte(this.addr, 0x81, 0x2b)
        }

        setIntegrationTime(time: number): void {
            this.setup()
            time = Math.clamp(0, 255, time * 10 / 24)
            smbus.writeByte(this.addr, 0x81, 255 - time)
        }

        setLEDs(state: number): void {
            pins.digitalWritePin(this.leds, state)
        }

        light(): number {
            return this.raw()[0]
        }

        rgb(): number[] {
            let result: number[] = this.raw()
            let clear: number = result.shift()
            for (let x: number = 0; x < result.length; x++) {
                result[x] = result[x] * 255 / clear
            }
            return result
        }

        raw(): number[] {
            this.setup()
            let result: Buffer = smbus.readBuffer(this.addr, 0xb4, pins.sizeOf(NumberFormat.UInt16LE) * 4)
            return smbus.unpack("HHHH", result)
        }
    }

    class sound {
        pin: AnalogPin
        offset: number
        threshold: number
        timeout: number
        clap_handler: Action
        polling: boolean

        constructor(pin: AnalogPin = AnalogPin.P2) {
            this.pin = pin
            this.offset = 580
            this.threshold = 25
            this.timeout = 100
            this.polling = false
        }

        startPoll(): void {
            if(this.polling) return
            control.inBackground(() => {
                while (true) {
                    this.poll()
                    basic.pause(100)
                }
            })
            this.polling = true
        }

        setOffset(offset: number) {
            this.offset = offset
        }

        read(): number {
            return pins.analogReadPin(this.pin) - this.offset
        }

        onClap(clap_handler: Action): void {
            this.clap_handler = clap_handler
            this.startPoll()
        }

        setSensitivity(threshold: number, timeout: number) {
            this.threshold = threshold
            this.timeout = timeout
        }

        poll(): void {
            if (this.waitForClap(this.threshold, this.timeout)) {
                this.clap_handler()
            }
        }

        waitForClap(threshold: number = 25, timeout: number = 500): boolean {
            let start: number = input.runningTime()
            while (input.runningTime() < start + timeout) {
                if (this.read() > threshold) {
                    while (this.read() > threshold) {
                        control.waitMicros(10)
                    }
                    return true
                }
                control.waitMicros(100)
            }
            return false
        }

        waitForDoubleClap(threshold: number = 25, distance: number = 500, timeout: number = 1000): boolean {
            let start: number = input.runningTime()
            while (input.runningTime() < start + timeout) {
                if (this.waitForClap(threshold, 50)) {
                    control.waitMicros(100000)
                    if (this.waitForClap(threshold, distance)) {
                        return true
                    }
                }
            }
            return false
        }
    }

    let _bme280: bme280 = new bme280(0x76)

    let _tcs3472: tcs3472 = new tcs3472(0x29, DigitalPin.P8)

    let _sound: sound = new sound(AnalogPin.P2)

    let sensitivity: number = 25

    export function getBME280ChipID(): number {
        return _bme280.getChipID()
    }

    //%
    export enum OnOff {
        Off = 0,
        On = 1
    }

    /**
     * Set how sensitive the microphone is when detecting claps
     * @param value - sensitivity (0-100)
     */
    //% blockId=envirobit_set_clap_sensitivity
    //% block="Set clap sensitivity to %value"
    //% value.min=0 value.max=100 value.defl=80
    //% subcategory="Sound"
    export function setClapSensitivity(value: number): void {
        value = Math.clamp(0, 100, value)
        sensitivity = 105 - value
    }

    /**
     * Perform an action when a clap is heard
     * @param clap_handler - function to run when a clap is detected
     */
    //% blockId=envirobit_on_clap
    //% block="When I hear a clap"
    //% subcategory="Sound"
    export function onClap(clap_handler: Action): void {
        _sound.onClap(clap_handler);
    }

    /**
     * Listen for two claps or loud sounds
     * Returns true if two claps are heard, false if not.
     * @param timeout - time (in ms) to wait (500-2500)
     */
    //% blockId=envirobit_wait_for_double_clap
    //% block="Wait %timeout|ms for a double clap"
    //% timeout.min=500 timeout.max=2500 timeout.defl=1000
    //% subcategory="Sound"
    export function waitForDoubleClap(timeout: number = 1000): boolean {
        return _sound.waitForDoubleClap(sensitivity, 500, timeout)
    }

    /**
     * Listen for a clap or loud sound
     * Returns true if a single clap is heard, false if not.
     * @param timeout - time (in ms) to wait (500-2500)
     */
    //% blockId=envirobit_wait_for_clap
    //% block="Wait %timeout|ms for a single clap"
    //% timeout.min=500 timeout.max=2500 timeout.defl=1000
    //% subcategory="Sound"
    export function waitForClap(timeout: number = 1000): boolean {
        return _sound.waitForClap(sensitivity, timeout)
    }

    /**
     * Read the current sound level from the microphone
     */
    //% blockId=envirobit_get_sound_level
    //% block="Get sound"
    //% subcategory="Sound"
    export function getSoundLevel(): number {
        return _sound.read()
    }

    /**
     * Set the colour sensor LEDs
     */
    //% blockId=envirobit_set_leds
    //% block="Set LEDs to %state"
    //% subcategory="Colour & Light"
    export function setLEDs(state: OnOff): void {
        _tcs3472.setLEDs(state)
    }

    /**
     * Get the light level
     */
    //% blockId=envirobit_get_light_clear
    //% block="Get light"
    //% subcategory="Colour & Light"
    export function getLight(): number {
        return _tcs3472.light()
    }

    /**
     * Get the amount of red the colour sensor sees
     */
    //% blockId=envirobit_get_light_red
    //% block="Get red"
    //% subcategory="Colour & Light"
    export function getRed(): number {
        return _tcs3472.rgb()[0]
    }

    /**
     * Get the amount of green the colour sensor sees
     */
    //% blockId=envirobit_get_light_green
    //% block="Get green"
    //% subcategory="Colour & Light"
    export function getGreen(): number {
        return _tcs3472.rgb()[1]
    }

    /**
     * Set the integration time of the colour sensor in ms
     */
    //% blockId=envirobit_set_integration_time
    //% block="Set colour integration time %time ms"
    //% time.min=0 time.max=612 value.defl=500
    //% subcategory="Expert"
    export function setColourIntegrationTime(time: number): void {
        return _tcs3472.setIntegrationTime(time)
    }

    /**
     * Get the amount of blue the colour sensor sees
     */
    //% blockId=envirobit_get_light_blue
    //% block="Get blue"
    //% subcategory="Colour & Light"
    export function getBlue(): number {
        return _tcs3472.rgb()[2]
    }

    /**
     * Return the temperature in degrees celcius
     */
    //% blockId=envirobit_get_temperature
    //% block="Get temperature"
    //% subcategory="Air & Weather"
    export function getTemperature(): number {
        return _bme280.getTemperature() / 100
    }

    /**
     * Return the temperature in degrees celcius * 100
     */
    //% blockId=envirobit_get_temperature_fine
    //% block="Get temperature (x100)"
    //% subcategory="Expert"
    export function getTemperatureFine(): number {
        return _bme280.getTemperature()
    }

    /**
     * Get the air pressure in hPa
     */
    //% blockId=envirobit_get_pressure
    //% block="Get pressure"
    //% subcategory="Air & Weather"
    export function getPressure(): number {
        return _bme280.getPressure() / 100
    }

    /**
     * Get the air pressure in pascals
     */
    //% blockId=envirobit_get_pressure_fine
    //% block="Get pressure (x100)"
    //% subcategory="Expert"
    export function getPressureFine(): number {
        return _bme280.getPressure()
    }

    /**
     * Get the relative humidity in %
     */
    //% blockId=envirobit_get_humidity
    //% block="Get humidity"
    //% subcategory="Air & Weather"
    export function getHumidity(): number {
        return _bme280.getHumidity() / 1024
    }

    /**
     * Get the relative humidity in % * 100
     */
    //% blockId=envirobit_get_humidity_fine
    //% block="Get humidity (x100)"
    //% subcategory="Expert"
    export function getHumidityFine(): number {
        return (_bme280.getHumidity() * 100) / 1024
    }

    /*
    //% blockId=envirobit_get_altitude
    //% block="Get altitude"
    //% subcategory="Air & Weather"
    export function getAltitude(): number {
        return _bme280.getAltitude()
    }
    */

}

namespace smbus {
    export function writeByte(addr: number, register: number, value: number): void {
        let temp = pins.createBuffer(2);
        temp[0] = register;
        temp[1] = value;
        pins.i2cWriteBuffer(addr, temp, false);
    }
    export function writeBuffer(addr: number, register: number, value: Buffer): void {
        let temp = pins.createBuffer(value.length + 1);
        temp[0] = register;
        for (let x = 0; x < value.length; x++) {
            temp[x + 1] = value[x];
        }
        pins.i2cWriteBuffer(addr, temp, false);
    }
    export function readBuffer(addr: number, register: number, len: number): Buffer {
        let temp = pins.createBuffer(1);
        temp[0] = register;
        pins.i2cWriteBuffer(addr, temp, false);
        return pins.i2cReadBuffer(addr, len, false);
    }
    function readNumber(addr: number, register: number, fmt: NumberFormat = NumberFormat.UInt8LE): number {
        let temp = pins.createBuffer(1);
        temp[0] = register;
        pins.i2cWriteBuffer(addr, temp, false);
        return pins.i2cReadNumber(addr, fmt, false);
    }
    export function unpack(fmt: string, buf: Buffer): number[] {
        let le: boolean = true;
        let offset: number = 0;
        let result: number[] = [];
        let num_format: NumberFormat = 0;
        for (let c = 0; c < fmt.length; c++) {
            switch (fmt.charAt(c)) {
                case '<':
                    le = true;
                    continue;
                case '>':
                    le = false;
                    continue;
                case 'c':
                case 'B':
                    num_format = le ? NumberFormat.UInt8LE : NumberFormat.UInt8BE; break;
                case 'b':
                    num_format = le ? NumberFormat.Int8LE : NumberFormat.Int8BE; break;
                case 'H':
                    num_format = le ? NumberFormat.UInt16LE : NumberFormat.UInt16BE; break;
                case 'h':
                    num_format = le ? NumberFormat.Int16LE : NumberFormat.Int16BE; break;
            }
            result.push(buf.getNumber(num_format, offset));
            offset += pins.sizeOf(num_format);
        }
        return result;
    }
}
