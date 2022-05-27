forever(function() {
    pause(1000)
    console.logValue("temp", modules.envirobitTemperature.temperature())
    console.logValue("humi", modules.envirobitHumidity.humidity())
    console.logValue("pres", modules.envirobitPressure.pressure())
    console.logValue("sound", modules.envirobitSoundLevel.soundLevel())
})