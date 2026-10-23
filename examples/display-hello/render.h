#ifndef DISPLAY_HELLO_RENDER_H
#define DISPLAY_HELLO_RENDER_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

enum {
    DISPLAY_WIDTH = 400,
    DISPLAY_HEIGHT = 600,
    DISPLAY_ROW_BYTES = DISPLAY_WIDTH / 2
};

bool render_row(uint16_t y, uint8_t *row, size_t size);

#endif
