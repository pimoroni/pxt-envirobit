serial.redirectToUSB()
envirobit.setLEDs(1)

let led_state: boolean = false

let clap_toggle: boolean = false

let clap_count: number = 0


envirobit.onClap(() => { 
    if (envirobit.timeSinceLastClap() < 500) {
        clap_count += 1
    }
    serial.writeLine("CLAP CLAP CLAP!")
    if (clap_toggle) {
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
    clap_toggle = !clap_toggle
})

basic.forever(() => {
    serial.writeNumber(envirobit.getBME280ChipID())
    serial.writeString(" C: ")
    serial.writeNumber(clap_count)
    serial.writeString(" T: ")
    serial.writeNumber(envirobit.getTemperature())
    serial.writeString(" P:")
    serial.writeNumber(envirobit.getPressure())
    serial.writeString(" H:")
    serial.writeNumber(envirobit.getHumidity())
    serial.writeString(" R:")
    serial.writeNumber(envirobit.getRed())
    serial.writeString(" G:")
    serial.writeNumber(envirobit.getGreen())
    serial.writeString(" B:")
    serial.writeNumber(envirobit.getBlue())
    serial.writeString(" S:")
    serial.writeNumber(envirobit.getSoundLevel())
    serial.writeString(" N:")
    serial.writeNumber(envirobit.getNoiseLevel())
    serial.writeLine("")

    if (envirobit.timeSinceLastClap() > 2000) {
        clap_count = 0
    }

    envirobit.setLEDs(led_state ? 1 : 0)
    led_state = !led_state

    basic.pause(2000)
})
