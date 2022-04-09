//% deprecated
namespace envirobit { }

namespace servers {
    function start() {
        jacdac.startSelfServers(() => [
            jacdac.createSimpleSensorServer("", 
            jacdac.SRV_TEMPERATURE,
            )
        ])
    }
    start()
}

namespace modules { }