#include "demo.h"
#include "layouts.h"
#include "pico/stdlib.h"

static demo_status_t status;

static void start_page(unsigned int page)
{
    if (!layouts_select(page)) {
        status.result = EPD_RENDER_ERROR;
        status.state = DEMO_FAULT;
        return;
    }
    status.page = page;
    status.result = EPD_RUNNING;
    status.state = DEMO_UPDATING;
    epd_start();
}

void demo_init(void)
{
    status.next_at = 0;
    start_page(0);
}

demo_status_t demo_poll(void)
{
    if (status.state == DEMO_UPDATING) {
        status.result = epd_poll();
        if (status.result == EPD_DONE) {
            // Anchor the cooldown after the driver's final power-down.
            status.next_at = time_us_64() + (uint64_t)DEMO_COOLDOWN_SECONDS * 1000000;
            status.state = DEMO_WAITING;
        } else if (status.result != EPD_RUNNING) {
            status.state = DEMO_FAULT;
        }
    } else if (status.state == DEMO_WAITING && time_us_64() >= status.next_at) {
        start_page((status.page + 1) % LAYOUT_COUNT);
    }
    return status;
}
