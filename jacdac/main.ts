//% deprecated
namespace envirobit { }

namespace modules {
    /**
     * Envirobit temperature sensor
     */
    //% fixedInstance whenUsed block="envirobit temperature"
    export const envirobitTemperature = new TemperatureClient("envirobit temperature?device=self")
    /**
     * Envirobit humidity sensor
     */
    //% fixedInstance whenUsed block="envirobit humidity"
    export const envirobitHumidity = new HumidityClient("envirobit humidity?device=self")
    /**
     * Envirobit pressure sensor
     */
    //% fixedInstance whenUsed block="envirobit pressure"
    export const envirobitPressure = new AirPressureClient("envirobit pressure?device=self")
    /**
     * Envirobit sound level sensor
     */
    //% fixedInstance whenUsed block="envirobit sound level"
    export const envirobitSoundLevel = new SoundLevelClient("envirobit sound level?device=self")
    /**
     * Envirobit color sensor
     */
    //% fixedInstance whenUsed block="envirobit color"
    export const envirobitColor = new ColorClient("envirobit color?device=self")
}

namespace servers {
    function start() {
        jacdac.startSelfServers(() => [
            jacdac.createSimpleSensorServer(
                jacdac.SRV_TEMPERATURE,
                jacdac.TemperatureRegPack.Temperature,
                () => envirobit.getTemperatureFine() / 100.0
            ),
            jacdac.createSimpleSensorServer(
                jacdac.SRV_HUMIDITY,
                jacdac.HumidityRegPack.Humidity,
                () => envirobit.getHumidityFine() / 10000.0
            ),
            jacdac.createSimpleSensorServer(
                jacdac.SRV_AIR_PRESSURE,
                jacdac.AirPressureRegPack.Pressure,
                () => envirobit.getPressureFine() / 100.0
            ),
            jacdac.createSimpleSensorServer(
                jacdac.SRV_SOUND_LEVEL,
                jacdac.SoundLevelRegPack.SoundLevel,
                () => envirobit.getSoundLevel() / 443.0
            ),
            jacdac.createMultiSensorServer(
                jacdac.SRV_COLOR,
                jacdac.ColorRegPack.Color,
                () => [envirobit.getRed() / 255.0, envirobit.getGreen() / 255.0, envirobit.getBlue() / 255.0]
            )
        ])
    }
    start()
}
