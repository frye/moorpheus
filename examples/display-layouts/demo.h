#ifndef DISPLAY_LAYOUTS_DEMO_H
#define DISPLAY_LAYOUTS_DEMO_H

#include <stdint.h>

#include "epd.h"

enum { DEMO_COOLDOWN_SECONDS = 180 };

typedef enum { DEMO_UPDATING, DEMO_WAITING, DEMO_FAULT } demo_state_t;

typedef struct {
    demo_state_t state;
    unsigned int page;
    epd_result_t result;
    uint64_t next_at;
} demo_status_t;

void demo_init(void);
demo_status_t demo_poll(void);

#endif
