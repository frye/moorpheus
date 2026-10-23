#include "render.h"

#include <string.h>

enum { SCALE = 4, GLYPH_WIDTH = 5, GLYPH_HEIGHT = 7, CELL_WIDTH = 6 };

static const char message[] = "Hello Moorpheus";

/* Original 5-by-7 glyphs, row bits from left (bit 4) to right (bit 0). */
static const struct {
    char character;
    uint8_t rows[GLYPH_HEIGHT];
} glyphs[] = {
    {'H', {17, 17, 17, 31, 17, 17, 17}},
    {'e', { 0,  0, 14, 17, 31, 16, 14}},
    {'l', {12,  4,  4,  4,  4,  4, 14}},
    {'o', { 0,  0, 14, 17, 17, 17, 14}},
    {'M', {17, 27, 21, 21, 17, 17, 17}},
    {'r', { 0,  0, 22, 25, 16, 16, 16}},
    {'p', { 0,  0, 30, 17, 30, 16, 16}},
    {'h', {16, 16, 22, 25, 17, 17, 17}},
    {'u', { 0,  0, 17, 17, 17, 19, 13}},
    {'s', { 0,  0, 15, 16, 14,  1, 30}},
    {' ', { 0,  0,  0,  0,  0,  0,  0}}
};

enum {
    MESSAGE_LENGTH = sizeof(message) - 1,
    TEXT_WIDTH = (MESSAGE_LENGTH * CELL_WIDTH - 1) * SCALE,
    TEXT_HEIGHT = GLYPH_HEIGHT * SCALE,
    TEXT_X = (DISPLAY_WIDTH - TEXT_WIDTH) / 2,
    TEXT_Y = (DISPLAY_HEIGHT - TEXT_HEIGHT) / 2
};

_Static_assert((int)TEXT_WIDTH <= (int)DISPLAY_WIDTH, "Message must fit on the panel");
_Static_assert((int)TEXT_HEIGHT <= (int)DISPLAY_HEIGHT, "Message must fit on the panel");

bool render_row(uint16_t y, uint8_t *row, size_t size)
{
    if (row == NULL || size != DISPLAY_ROW_BYTES || y >= DISPLAY_HEIGHT) {
        return false;
    }
    memset(row, 0x11, size);
    if (y < TEXT_Y || y >= TEXT_Y + TEXT_HEIGHT) {
        return true;
    }

    const uint16_t glyph_y = (y - TEXT_Y) / SCALE;
    for (size_t letter = 0; letter < MESSAGE_LENGTH; ++letter) {
        const uint8_t *bits = NULL;
        for (size_t i = 0; i < sizeof(glyphs) / sizeof(glyphs[0]); ++i) {
            if (glyphs[i].character == message[letter]) {
                bits = glyphs[i].rows;
                break;
            }
        }
        if (bits == NULL) {
            return false;
        }
        for (uint16_t column = 0; column < GLYPH_WIDTH; ++column) {
            if ((bits[glyph_y] & (1u << (GLYPH_WIDTH - 1 - column))) == 0) {
                continue;
            }
            for (uint16_t dx = 0; dx < SCALE; ++dx) {
                const uint16_t x = TEXT_X + letter * CELL_WIDTH * SCALE +
                                   column * SCALE + dx;
                row[x / 2] &= (x % 2 == 0) ? 0x0f : 0xf0;
            }
        }
    }
    return true;
}
