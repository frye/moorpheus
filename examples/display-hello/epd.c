/*
 * E-model initialization and refresh sequence adapted from Waveshare's
 * EPD_4in0e.c (2024-08-20). See WAVESHARE-LICENSE.txt and docs/display-bring-up.md.
 */
#include "epd.h"
#include "render.h"

#include "hardware/spi.h"
#include "pico/stdlib.h"

enum {
    PIN_DC = 8, PIN_CS = 9, PIN_CLK = 10, PIN_DIN = 11,
    PIN_RST = 12, PIN_BUSY = 13, PIN_PWR = 14,
    SPI_HZ = 4000000,
    SPI_TIMEOUT_US = 1000,
    BUSY_TIMEOUT_MS = 2000,
    REFRESH_TIMEOUT_MS = 60000
};

typedef enum {
    RESET_LOW, RESET_HIGH, RESET_WAIT, INIT, DATA_START, ROW,
    POWER_ON, BOOSTER, REFRESH, POWER_OFF, DEEP_SLEEP, FINISH,
    DELAY, BUSY, STOPPED
} state_t;

static struct {
    state_t state;
    state_t next;
    uint64_t deadline;
    uint32_t post_ms;
    uint16_t row;
    epd_result_t result;
} display;

static const uint8_t init_sequence[] = {
    0xAA, 6, 0x49, 0x55, 0x20, 0x08, 0x09, 0x18,
    0x01, 1, 0x3F,
    0x00, 2, 0x5F, 0x69,
    0x05, 4, 0x40, 0x1F, 0x1F, 0x2C,
    0x08, 4, 0x6F, 0x1F, 0x1F, 0x22,
    0x06, 4, 0x6F, 0x1F, 0x17, 0x17,
    0x03, 4, 0x00, 0x54, 0x00, 0x44,
    0x60, 2, 0x02, 0x00,
    0x30, 1, 0x08,
    0x50, 1, 0x3F,
    0x61, 4, 0x01, 0x90, 0x02, 0x58,
    0xE3, 1, 0x2F,
    0x84, 1, 0x01
};

static void output_pin(uint pin, bool level)
{
    gpio_init(pin);
    gpio_put(pin, level);
    gpio_set_dir(pin, GPIO_OUT);
}

static void power_down(void)
{
    gpio_put(PIN_RST, 0);
    gpio_put(PIN_DC, 0);
    gpio_put(PIN_CS, 0);
    gpio_set_function(PIN_CLK, GPIO_FUNC_SIO);
    gpio_set_function(PIN_DIN, GPIO_FUNC_SIO);
    gpio_put(PIN_CLK, 0);
    gpio_put(PIN_DIN, 0);
    gpio_set_dir(PIN_CLK, GPIO_OUT);
    gpio_set_dir(PIN_DIN, GPIO_OUT);
    gpio_put(PIN_PWR, 0);
    /* CS has an external pull-up; stop actively sinking it while powered off. */
    gpio_set_dir(PIN_CS, GPIO_IN);
    gpio_disable_pulls(PIN_CS);
}

static void fail(epd_result_t result)
{
    power_down();
    display.result = result;
    display.state = STOPPED;
}

static void delay_ms(uint32_t ms, state_t next)
{
    display.deadline = time_us_64() + (uint64_t)ms * 1000;
    display.next = next;
    display.state = DELAY;
}

static void wait_busy(uint32_t timeout_ms, uint32_t post_ms, state_t next)
{
    display.deadline = time_us_64() + (uint64_t)timeout_ms * 1000;
    display.post_ms = post_ms;
    display.next = next;
    display.state = BUSY;
}

static bool send_byte(bool data, uint8_t value)
{
    const uint64_t deadline = time_us_64() + SPI_TIMEOUT_US;
    gpio_put(PIN_DC, data);
    gpio_put(PIN_CS, 0);
    while (!spi_is_writable(spi1)) {
        if (time_us_64() >= deadline) {
            fail(EPD_SPI_TIMEOUT);
            return false;
        }
    }
    spi_get_hw(spi1)->dr = value;
    while (!spi_is_readable(spi1)) {
        if (time_us_64() >= deadline) {
            fail(EPD_SPI_TIMEOUT);
            return false;
        }
    }
    /* Consume RX even though the panel has no MISO connection. */
    (void)spi_get_hw(spi1)->dr;
    while (spi_is_busy(spi1)) {
        if (time_us_64() >= deadline) {
            fail(EPD_SPI_TIMEOUT);
            return false;
        }
    }
    gpio_put(PIN_CS, 1);
    return true;
}

static bool command(uint8_t value, const uint8_t *data, size_t size)
{
    if (!send_byte(false, value)) {
        return false;
    }
    for (size_t i = 0; i < size; ++i) {
        if (!send_byte(true, data[i])) {
            return false;
        }
    }
    return true;
}

void epd_start(void)
{
    output_pin(PIN_PWR, 0);
    output_pin(PIN_CS, 1);
    output_pin(PIN_DC, 0);
    output_pin(PIN_RST, 0);
    gpio_init(PIN_BUSY);
    gpio_set_dir(PIN_BUSY, GPIO_IN);
    gpio_disable_pulls(PIN_BUSY);

    spi_init(spi1, SPI_HZ);
    spi_set_format(spi1, 8, SPI_CPOL_0, SPI_CPHA_0, SPI_MSB_FIRST);
    gpio_set_function(PIN_CLK, GPIO_FUNC_SPI);
    gpio_set_function(PIN_DIN, GPIO_FUNC_SPI);
    display.row = 0;
    display.result = EPD_RUNNING;
    gpio_put(PIN_PWR, 1);
    gpio_put(PIN_RST, 1);
    delay_ms(20, RESET_LOW);
}

epd_result_t epd_poll(void)
{
    static uint8_t row[DISPLAY_ROW_BYTES];
    static const uint8_t zero = 0;
    static const uint8_t sleep_key = 0xA5;
    static const uint8_t booster[] = {0x6F, 0x1F, 0x17, 0x27};

    switch (display.state) {
    case DELAY:
        if (time_us_64() >= display.deadline) {
            display.state = display.next;
        }
        break;
    case BUSY:
        if (gpio_get(PIN_BUSY)) {
            delay_ms(display.post_ms, display.next);
        } else if (time_us_64() >= display.deadline) {
            fail(EPD_BUSY_TIMEOUT);
        }
        break;
    case RESET_LOW:
        gpio_put(PIN_RST, 0);
        delay_ms(2, RESET_HIGH);
        break;
    case RESET_HIGH:
        gpio_put(PIN_RST, 1);
        delay_ms(20, RESET_WAIT);
        break;
    case RESET_WAIT:
        wait_busy(BUSY_TIMEOUT_MS, 130, INIT);
        break;
    case INIT:
        for (size_t i = 0; i < sizeof(init_sequence);) {
            const uint8_t length = init_sequence[i + 1];
            if (!command(init_sequence[i], &init_sequence[i + 2], length)) {
                return display.result;
            }
            i += 2u + length;
        }
        wait_busy(BUSY_TIMEOUT_MS, 100, DATA_START);
        break;
    case DATA_START:
        if (command(0x10, NULL, 0)) {
            display.state = ROW;
        }
        break;
    case ROW:
        if (!render_row(display.row, row, sizeof(row))) {
            fail(EPD_RENDER_ERROR);
            break;
        }
        for (size_t i = 0; i < sizeof(row); ++i) {
            if (!send_byte(true, row[i])) {
                return display.result;
            }
        }
        if (++display.row == DISPLAY_HEIGHT) {
            display.state = POWER_ON;
        }
        break;
    case POWER_ON:
        if (command(0x04, NULL, 0)) {
            wait_busy(BUSY_TIMEOUT_MS, 300, BOOSTER);
        }
        break;
    case BOOSTER:
        if (command(0x06, booster, sizeof(booster))) {
            delay_ms(200, REFRESH);
        }
        break;
    case REFRESH:
        if (command(0x12, &zero, 1)) {
            wait_busy(REFRESH_TIMEOUT_MS, 100, POWER_OFF);
        }
        break;
    case POWER_OFF:
        if (command(0x02, &zero, 1)) {
            wait_busy(BUSY_TIMEOUT_MS, 100, DEEP_SLEEP);
        }
        break;
    case DEEP_SLEEP:
        if (command(0x07, &sleep_key, 1)) {
            delay_ms(2000, FINISH);
        }
        break;
    case FINISH:
        power_down();
        display.result = EPD_DONE;
        display.state = STOPPED;
        break;
    case STOPPED:
        break;
    }
    return display.result;
}
