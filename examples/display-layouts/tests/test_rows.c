#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "layouts.h"

static bool valid_colour(unsigned int colour)
{
    return colour == 0 || colour == 1 || colour == 2 ||
           colour == 3 || colour == 5 || colour == 6;
}

int main(void)
{
    struct {
        uint8_t before;
        uint8_t row[DISPLAY_ROW_BYTES];
        uint8_t after;
    } buffer = {.before = 0xA5, .after = 0x5A};

    assert(LAYOUT_COUNT == 5 && LAYOUT_FRAME_BYTES == 120000);
    for (unsigned int page = 0; page < LAYOUT_COUNT; ++page) {
        assert(layouts_select(page));
        assert(layout_names[page] != NULL && layout_names[page][0] != '\0');
        for (uint16_t y = 0; y < DISPLAY_HEIGHT; ++y) {
            assert(render_row(y, buffer.row, sizeof(buffer.row)));
            assert(memcmp(buffer.row, &layout_frames[page][y * DISPLAY_ROW_BYTES],
                          sizeof(buffer.row)) == 0);
            for (size_t i = 0; i < sizeof(buffer.row); ++i) {
                assert(valid_colour(buffer.row[i] >> 4));
                assert(valid_colour(buffer.row[i] & 15));
            }
            assert(buffer.before == 0xA5 && buffer.after == 0x5A);
        }
        for (unsigned int other = 0; other < page; ++other) {
            assert(memcmp(layout_frames[page], layout_frames[other],
                          LAYOUT_FRAME_BYTES) != 0);
        }
    }
    uint8_t previous[DISPLAY_ROW_BYTES];
    memcpy(previous, buffer.row, sizeof(previous));
    assert(!render_row(DISPLAY_HEIGHT, buffer.row, sizeof(buffer.row)));
    assert(!render_row(0, NULL, DISPLAY_ROW_BYTES));
    assert(!render_row(0, buffer.row, DISPLAY_ROW_BYTES - 1));
    assert(!render_row(0, buffer.row, DISPLAY_ROW_BYTES + 1));
    assert(memcmp(previous, buffer.row, sizeof(previous)) == 0);
    assert(!layouts_select(LAYOUT_COUNT));
    assert(render_row(DISPLAY_HEIGHT - 1, buffer.row, sizeof(buffer.row)));
    assert(memcmp(previous, buffer.row, sizeof(previous)) == 0);
    puts("PASS: five distinct frames, palette, exact rows, guards and invalid requests");
    return 0;
}
