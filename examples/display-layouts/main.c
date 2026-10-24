#include <inttypes.h>
#include <stdio.h>

#include "demo.h"
#include "layouts.h"
#include "pico/stdlib.h"

static const char *fault_message(epd_result_t result)
{
    switch (result) {
    case EPD_SPI_TIMEOUT:
        return "SPI timeout; check SPI setup.";
    case EPD_BUSY_TIMEOUT:
        return "BUSY timeout; check power and wiring.";
    case EPD_RENDER_ERROR:
        return "Invalid render request.";
    default:
        return "Unexpected display result.";
    }
}

int main(void)
{
    stdio_init_all();
    puts("SIMULATED layout demo; NOT an anchor alarm. No live sensors.");
    demo_init();
    uint64_t report_at = 0;
    demo_state_t previous_state = DEMO_FAULT;
    unsigned int previous_page = LAYOUT_COUNT;
    for (;;) {
        const demo_status_t status = demo_poll();
        const uint64_t now = time_us_64();
        if (status.state != previous_state || status.page != previous_page ||
            now >= report_at) {
            printf("DEMO %u/%u: %s. ", status.page + 1, LAYOUT_COUNT,
                   layout_names[status.page]);
            if (status.state == DEMO_UPDATING) {
                puts("Updating: one full refresh; simulated data.");
            } else if (status.state == DEMO_WAITING) {
                const uint64_t remaining = status.next_at > now ?
                    (status.next_at - now + 999999) / 1000000 : 0;
                printf("Sequence complete; display powered down. Next page in %"
                       PRIu64 " s. Check the image.\n", remaining);
            } else {
                printf("FAULT: %s Display powered down; cycling stopped until reset.\n",
                       fault_message(status.result));
            }
            report_at = now + 5000000;
            previous_state = status.state;
            previous_page = status.page;
        }
        sleep_ms(1);
    }
}
