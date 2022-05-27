//% deprecated
namespace envirobit { }

namespace modules {
    /**
     * Envirobit temperature sensor
     */
    //% fixedInstance whenUsed block="envirobit temperature"
    export const envirobitTemperature = new TemperatureClient("envirobit temperature?dev=self")
    /**
     * Envirobit humidity sensor
     */
    //% fixedInstance whenUsed block="envirobit humidity"
    export const envirobitHumidity = new HumidityClient("envirobit humidity?dev=self")
    /**
     * Envirobit pressure sensor
     */
    //% fixedInstance whenUsed block="envirobit pressure"
    export const envirobitPressure = new AirPressureClient("envirobit pressure?dev=self")
    /**
     * Envirobit sound level sensor
     */
    //% fixedInstance whenUsed block="envirobit sound level"
    export const envirobitSoundLevel = new SoundLevelClient("envirobit sound level?dev=self")
    /**
     * Envirobit color sensor
     */
    //% fixedInstance whenUsed block="envirobit color"
    export const envirobitColor = new ColorClient("envirobit color?dev=self")
}

namespace servers {
    function start() {
        jacdac.productIdentifier = 0x3da1c67d
        jacdac.deviceDescription = "Pimoroni enviro:bit"
        jacdac.startSelfServers(() => {
            const servers = [
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_TEMPERATURE,
                    jacdac.TemperatureRegPack.Temperature,
                    () => envirobit.getTemperatureFine() / 100.0, {
                    statusCode: jacdac.SystemStatusCodes.Initializing
                }),
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_HUMIDITY,
                    jacdac.HumidityRegPack.Humidity,
                    () => envirobit.getHumidityFine() / 10000.0, {
                    statusCode: jacdac.SystemStatusCodes.Initializing
                }),
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_AIR_PRESSURE,
                    jacdac.AirPressureRegPack.Pressure,
                    () => envirobit.getPressureFine() / 100.0, {
                    statusCode: jacdac.SystemStatusCodes.Initializing
                }),
                jacdac.createSimpleSensorServer(
                    jacdac.SRV_SOUND_LEVEL,
                    jacdac.SoundLevelRegPack.SoundLevel,
                    () => envirobit.getSoundLevel() / 443, {
                        statusCode: jacdac.SystemStatusCodes.Initializing
                    }),
                jacdac.createMultiSensorServer(
                    jacdac.SRV_COLOR,
                    jacdac.ColorRegPack.Color,
                    () => [envirobit.getRed() / 255.0, envirobit.getGreen() / 255.0, envirobit.getBlue() / 255.0], {
                    statusCode: jacdac.SystemStatusCodes.Initializing
                })
            ]

            control.runInParallel(() => {
                envirobit.getTemperatureFine()
                envirobit.getHumidityFine()
                envirobit.getPressureFine()
                pause(400)
                for (const server of servers)
                    server.setStatusCode(jacdac.SystemStatusCodes.Ready)
            })

            return servers
        })
    }
    start()
}
