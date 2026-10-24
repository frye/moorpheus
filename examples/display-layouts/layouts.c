#include "layouts.h"

#include <string.h>

const char *const layout_names[LAYOUT_COUNT] = {
    "Watch Circle", "Big Number", "Instrument Grid", "Swing History", "Status Ledger"
};

static unsigned int current_page;

bool layouts_select(unsigned int page)
{
    if (page >= LAYOUT_COUNT) {
        return false;
    }
    current_page = page;
    return true;
}

bool render_row(uint16_t y, uint8_t *row, size_t size)
{
    if (row == NULL || size != DISPLAY_ROW_BYTES || y >= DISPLAY_HEIGHT) {
        return false;
    }
    memcpy(row, &layout_frames[current_page][(size_t)y * DISPLAY_ROW_BYTES], size);
    return true;
}
