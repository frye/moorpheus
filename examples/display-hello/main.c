#include <stdio.h>

#include "epd.h"
#include "pico/stdlib.h"

static const char *result_message(epd_result_t result)
{
    switch (result) {
    case EPD_DONE:
        return "Update sequence complete; display powered down. Check the image.";
    case EPD_SPI_TIMEOUT:
        return "FAULT: SPI timeout; display powered down. Check the SPI setup.";
    case EPD_BUSY_TIMEOUT:
        return "FAULT: BUSY timeout; display powered down. Check power and wiring.";
    case EPD_RENDER_ERROR:
        return "FAULT: invalid render request; display powered down.";
    case EPD_RUNNING:
        return "Updating: Hello Moorpheus (one full refresh).";
    }
    return "FAULT: unknown display result.";
}

int main(void)
{
    stdio_init_all();
    puts("Display-only bench example; no anchor alarm.");
    epd_start();

    epd_result_t result = EPD_RUNNING;
    uint64_t report_at = 0;
    for (;;) {
        if (result == EPD_RUNNING) {
            const epd_result_t previous = result;
            result = epd_poll();
            if (result != previous) {
                report_at = 0;
            }
        }
        if (time_us_64() >= report_at) {
            puts(result_message(result));
            report_at = time_us_64() + 5000000;
        }
        sleep_ms(1);
    }
}
