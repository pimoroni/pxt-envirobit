#include "pxt.h"
using namespace pxt;

namespace envirobit {
    int32_t dig_P7;
    int32_t dig_P8;
    int32_t dig_P9;

    uint8_t dig_H1;
    int8_t dig_H2;
    uint8_t dig_H3;
    int16_t dig_H4;
    int16_t dig_H5;
    int8_t dig_H6;

    //%
    void setCompensationValues(int32_t _dig_P7, int32_t _dig_P8, int32_t _dig_P9)
    {
        dig_P7 = _dig_P7;
        dig_P8 = _dig_P8;
        dig_P9 = _dig_P9;
    }

    //%
    int32_t compensatePressure(int32_t adc_P, int32_t var1, int32_t var2)
    {
        uint32_t p;

        p = (((uint32_t)(((int32_t)1048576) - adc_P) - (var2 >> 12))) * 3125;

        if (p < 0x80000000)
        {
            p = (p << 1) / ((uint32_t)var1);
        }
        else
        {
            p = (p / (uint32_t)var1) * 2;
        }

        var1 = (((int32_t)dig_P9) * ((int32_t)(((p >> 3) * (p >> 3)) >> 13))) >> 12;
        var2 = (((int32_t)(p >> 2)) * ((int32_t)dig_P8)) >> 13;
        p = (uint32_t)((int32_t)p + ((var1 + var2 + dig_P7) >> 4));

        return p;
    }

    //%
    void setHumidityCompensationValuesA(uint8_t _dig_H1, int8_t _dig_H2, uint8_t _dig_H3)
    {
        dig_H1 = _dig_H1;
        dig_H2 = _dig_H2;
        dig_H3 = _dig_H3;
    }

    //%
    void setHumidityCompensationValuesB(int16_t _dig_H4, int16_t _dig_H5, int8_t _dig_H6)
    {
        dig_H4 = _dig_H4;
        dig_H5 = _dig_H5;
        dig_H6 = _dig_H6;
    }

    //%
    uint32_t compensateHumidity(int32_t adc_H, int32_t t_fine)
    {
        int32_t v_x1_u32r;
        v_x1_u32r = (t_fine - ((int32_t)76800));
        v_x1_u32r = (((((adc_H << 14) - (((int32_t)dig_H4) << 20) - (((int32_t)dig_H5) * v_x1_u32r)) + 
        ((int32_t)16384)) >> 15) * (((((((v_x1_u32r * ((int32_t)dig_H6)) >> 10) * (((v_x1_u32r * 
        ((int32_t)dig_H3)) >> 11) + ((int32_t)32768))) >> 10) + ((int32_t)2097152)) *
        ((int32_t)dig_H2) + 8192) >> 14));
        v_x1_u32r = (v_x1_u32r - (((((v_x1_u32r >> 15) * (v_x1_u32r >> 15)) >> 7) * ((int32_t)dig_H1)) >> 4));
        v_x1_u32r = (v_x1_u32r < 0 ? 0 : v_x1_u32r);
        v_x1_u32r = (v_x1_u32r > 419430400 ? 419430400 : v_x1_u32r);
        return (uint32_t)(v_x1_u32r>>12);
    }

}