#ifndef DISPLAY_LAYOUTS_H
#define DISPLAY_LAYOUTS_H

#include "render.h"

enum { LAYOUT_COUNT = 5, LAYOUT_FRAME_BYTES = DISPLAY_ROW_BYTES * DISPLAY_HEIGHT };

extern const uint8_t layout_frames[LAYOUT_COUNT][LAYOUT_FRAME_BYTES];
extern const char *const layout_names[LAYOUT_COUNT];

bool layouts_select(unsigned int page);

#endif
