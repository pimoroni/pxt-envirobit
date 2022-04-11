//% deprecated
namespace envirobit { }

namespace modules {
    /**
     * Envirobit temperature sensor
     */
    //% fixedInstance whenUsed block="envirobit temperature"
    export const envirobitTemperature = new TemperatureClient("envirobit temperature?device=self")
}

namespace servers {
    function start() {
        jacdac.startSelfServers(() => [
            jacdac.createSimpleSensorServer(
                jacdac.SRV_TEMPERATURE,
                jacdac.TemperatureRegPack.Temperature,
                () => envirobit.getTemperature()
            )
        ])
    }
    start()
}
