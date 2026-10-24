#include <assert.h>
#include <stdio.h>

#include "demo.h"
#include "layouts.h"

static uint64_t now;
static unsigned int starts;
static unsigned int polls;
static unsigned int selected;
static bool select_fails;
static epd_result_t driver_result;

uint64_t time_us_64(void) { return now; }
void epd_start(void) { ++starts; }
epd_result_t epd_poll(void) { ++polls; return driver_result; }
bool layouts_select(unsigned int page)
{
    assert(page < LAYOUT_COUNT);
    selected = page;
    return !select_fails;
}

static void reset(void)
{
    now = 1234567;
    starts = 0;
    polls = 0;
    select_fails = false;
    driver_result = EPD_RUNNING;
    demo_init();
}

int main(void)
{
    reset();
    for (unsigned int step = 0; step < 12; ++step) {
        demo_status_t status = demo_poll();
        assert(status.state == DEMO_UPDATING && status.page == step % 5);
        assert(selected == step % 5 && starts == step + 1);
        now += 250000000;
        status = demo_poll();
        assert(status.state == DEMO_UPDATING && starts == step + 1);
        driver_result = EPD_DONE;
        status = demo_poll();
        assert(status.state == DEMO_WAITING);
        assert(status.next_at == now + 180000000);
        const unsigned int previous_polls = polls;
        now = status.next_at - 1;
        assert(demo_poll().state == DEMO_WAITING);
        assert(starts == step + 1 && polls == previous_polls);
        ++now;
        driver_result = EPD_RUNNING;
        status = demo_poll();
        assert(status.state == DEMO_UPDATING);
        assert(status.page == (step + 1) % 5 && starts == step + 2);
        assert(polls == previous_polls);
    }

    const epd_result_t faults[] = {
        EPD_SPI_TIMEOUT, EPD_BUSY_TIMEOUT, EPD_RENDER_ERROR
    };
    for (size_t i = 0; i < sizeof(faults) / sizeof(faults[0]); ++i) {
        reset();
        driver_result = faults[i];
        demo_status_t status = demo_poll();
        assert(status.state == DEMO_FAULT && status.result == faults[i]);
        const unsigned int previous_polls = polls;
        for (unsigned int j = 0; j < 10; ++j) {
            now += 1000000000;
            assert(demo_poll().state == DEMO_FAULT);
        }
        assert(starts == 1 && polls == previous_polls && selected == 0);
    }
    reset();
    driver_result = EPD_DONE;
    demo_status_t status = demo_poll();
    now = status.next_at + 50000000;
    select_fails = true;
    status = demo_poll();
    assert(status.state == DEMO_FAULT && status.result == EPD_RENDER_ERROR);
    assert(starts == 1);
    puts("PASS: page order, wrap, exact cooldown boundary, long BUSY and latched faults");
    return 0;
}
