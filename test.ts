serial.redirectToUSB()
envirobit.setLEDs(1)

let led_state: boolean = false


envirobit.onClap(() => { 
    serial.writeLine("CLAP CLAP CLAP!")
})

basic.forever(() => { 
    serial.writeNumber(envirobit.getBME280ChipID())
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
    serial.writeLine("")

    envirobit.setLEDs(led_state ? 1 : 0)
    led_state = !led_state

    basic.pause(2000)
})
