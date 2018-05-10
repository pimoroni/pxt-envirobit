#include "pxt.h"
using namespace pxt;

namespace envirobit {
    int32_t dig_P7;
    int32_t dig_P8;
    int32_t dig_P9;

    //%
    void setCompensationValues(int32_t _dig_P7, int32_t _dig_P8, int32_t _dig_P9){
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
}