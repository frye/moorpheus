#ifndef DISPLAY_HELLO_EPD_H
#define DISPLAY_HELLO_EPD_H

typedef enum {
    EPD_RUNNING,
    EPD_DONE,
    EPD_SPI_TIMEOUT,
    EPD_BUSY_TIMEOUT,
    EPD_RENDER_ERROR
} epd_result_t;

void epd_start(void);
epd_result_t epd_poll(void);

#endif
