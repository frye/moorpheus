#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "epd.h"
#include "render.h"
#include "hardware/spi.h"
#include "pico/stdlib.h"

static spi_inst_t instance;
spi_inst_t *const spi1 = &instance;
static uint64_t now;
static bool levels[30];
static bool directions[30];
static bool pulls_disabled[30];
static bool force_busy;
static bool refresh_stuck;
static unsigned int spi_fault;
static uint8_t current_command;
static uint8_t commands[32];
static size_t command_count;
static size_t pixel_bytes;
static uint8_t expected_row[DISPLAY_ROW_BYTES];
static uint64_t refresh_at;
static uint64_t finish_at;
static unsigned int bytes_in_cs;

void gpio_init(uint pin) { assert(pin < 30); }
void gpio_put(uint pin, bool level)
{
    if (pin == 9 && level) {
        bytes_in_cs = 0;
    }
    levels[pin] = level;
}
void gpio_set_dir(uint pin, bool output) { directions[pin] = output; }
void gpio_set_function(uint pin, uint function)
{
    assert(pin == 10 || pin == 11);
    assert(function == GPIO_FUNC_SPI || function == GPIO_FUNC_SIO);
}
void gpio_disable_pulls(uint pin) { pulls_disabled[pin] = true; }
bool gpio_get(uint pin)
{
    assert(pin == 13);
    if (force_busy) {
        return false;
    }
    if (current_command == 0x12) {
        return !refresh_stuck && now - refresh_at >= 19000000;
    }
    return true;
}
uint64_t time_us_64(void) { return now++; }

unsigned int spi_init(spi_inst_t *spi, unsigned int hz)
{
    assert(spi == spi1 && hz == 4000000);
    return hz;
}
void spi_set_format(spi_inst_t *spi, unsigned int bits, unsigned int cpol,
                    unsigned int cpha, unsigned int order)
{
    assert(spi == spi1 && bits == 8 && cpol == SPI_CPOL_0);
    assert(cpha == SPI_CPHA_0 && order == SPI_MSB_FIRST);
}
spi_hw_t *spi_get_hw(spi_inst_t *spi) { return &spi->hw; }
bool spi_is_writable(const spi_inst_t *spi)
{
    assert(spi == spi1);
    return spi_fault != 1;
}
bool spi_is_readable(const spi_inst_t *spi)
{
    if (spi_fault == 2) {
        return false;
    }
    const uint8_t value = (uint8_t)spi->hw.dr;
    assert(!levels[9]);
    assert(bytes_in_cs++ == 0);
    if (!levels[8]) {
        assert(command_count < sizeof(commands));
        commands[command_count++] = value;
        current_command = value;
        if (value == 0x12) {
            refresh_at = now;
        } else if (value == 0x02) {
            finish_at = now;
        }
    } else if (current_command == 0x10) {
        assert(pixel_bytes < DISPLAY_ROW_BYTES * DISPLAY_HEIGHT);
        if (pixel_bytes % DISPLAY_ROW_BYTES == 0) {
            assert(render_row(pixel_bytes / DISPLAY_ROW_BYTES,
                              expected_row, sizeof(expected_row)));
        }
        assert(value == expected_row[pixel_bytes % DISPLAY_ROW_BYTES]);
        ++pixel_bytes;
    }
    return true;
}
bool spi_is_busy(const spi_inst_t *spi)
{
    assert(spi == spi1);
    return spi_fault == 3;
}

static void reset_mock(void)
{
    now = 0;
    memset(levels, 0, sizeof(levels));
    memset(directions, 0, sizeof(directions));
    memset(pulls_disabled, 0, sizeof(pulls_disabled));
    force_busy = false;
    refresh_stuck = false;
    spi_fault = 0;
    current_command = 0;
    command_count = 0;
    pixel_bytes = 0;
    refresh_at = 0;
    finish_at = 0;
    bytes_in_cs = 0;
}

static epd_result_t run(void)
{
    epd_result_t result = EPD_RUNNING;
    for (unsigned int i = 0; i < 70000 && result == EPD_RUNNING; ++i) {
        result = epd_poll();
        now += 1000;
    }
    assert(result != EPD_RUNNING);
    assert(!levels[14] && !levels[12] && !levels[8]);
    assert(!levels[10] && !levels[11]);
    assert(!directions[9] && pulls_disabled[9]);
    assert(!directions[13] && pulls_disabled[13]);
    const size_t count = command_count;
    for (unsigned int i = 0; i < 10; ++i) {
        assert(epd_poll() == result);
    }
    assert(command_count == count);
    return result;
}

static uint8_t pixel(const uint8_t *row, unsigned int x)
{
    return (row[x / 2] >> ((x % 2 == 0) ? 4 : 0)) & 0xf;
}

static void test_render(void)
{
    /* Independent bitmap oracle in visual row notation. */
    static const char *const shapes[] = {
        "#...#/#...#/#...#/#####/#...#/#...#/#...#",
        "...../...../.###./#...#/#####/#..../.###.",
        ".##../..#../..#../..#../..#../..#../.###.",
        ".##../..#../..#../..#../..#../..#../.###.",
        "...../...../.###./#...#/#...#/#...#/.###.",
        "...../...../...../...../...../...../.....",
        "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#",
        "...../...../.###./#...#/#...#/#...#/.###.",
        "...../...../.###./#...#/#...#/#...#/.###.",
        "...../...../#.##./##..#/#..../#..../#....",
        "...../...../####./#...#/####./#..../#....",
        "#..../#..../#.##./##..#/#...#/#...#/#...#",
        "...../...../.###./#...#/#####/#..../.###.",
        "...../...../#...#/#...#/#...#/#..##/.##.#",
        "...../...../.####/#..../.###./....#/####."
    };
    struct {
        uint8_t before;
        uint8_t row[DISPLAY_ROW_BYTES];
        uint8_t after;
    } buffer = {.before = 0xA5, .after = 0x5A};
    for (uint16_t y = 0; y < DISPLAY_HEIGHT; ++y) {
        assert(render_row(y, buffer.row, sizeof(buffer.row)));
        for (unsigned int x = 0; x < DISPLAY_WIDTH; ++x) {
            uint8_t want = 1;
            if (y >= 286 && y < 314 && x >= 22 && x < 378) {
                const unsigned int cell = (x - 22) / 24;
                const unsigned int col = ((x - 22) % 24) / 4;
                const unsigned int r = (y - 286) / 4;
                if (col < 5 && shapes[cell][r * 6 + col] == '#') {
                    want = 0;
                }
            }
            assert(pixel(buffer.row, x) == want);
        }
        assert(buffer.before == 0xA5 && buffer.after == 0x5A);
    }
    uint8_t original[DISPLAY_ROW_BYTES];
    memcpy(original, buffer.row, sizeof(original));
    assert(!render_row(DISPLAY_HEIGHT, buffer.row, sizeof(buffer.row)));
    assert(!render_row(0, NULL, DISPLAY_ROW_BYTES));
    assert(!render_row(0, buffer.row, DISPLAY_ROW_BYTES - 1));
    assert(!render_row(0, buffer.row, DISPLAY_ROW_BYTES + 1));
    assert(memcmp(original, buffer.row, sizeof(original)) == 0);
}

int main(void)
{
    test_render();
    reset_mock();
    epd_start();
    assert(run() == EPD_DONE);
    static const uint8_t expected_commands[] = {
        0xAA, 0x01, 0x00, 0x05, 0x08, 0x06, 0x03, 0x60,
        0x30, 0x50, 0x61, 0xE3, 0x84, 0x10, 0x04, 0x06,
        0x12, 0x02, 0x07
    };
    assert(command_count == sizeof(expected_commands));
    assert(memcmp(commands, expected_commands, sizeof(expected_commands)) == 0);
    assert(pixel_bytes == 120000);
    assert(finish_at - refresh_at >= 19100000);
    assert(finish_at - refresh_at < 19200000);

    reset_mock();
    force_busy = true;
    epd_start();
    assert(run() == EPD_BUSY_TIMEOUT);
    assert(now >= 2000000 && now < 2200000 && command_count == 0);

    reset_mock();
    refresh_stuck = true;
    epd_start();
    assert(run() == EPD_BUSY_TIMEOUT);
    assert(now - refresh_at >= 60000000);
    assert(now - refresh_at < 60100000 && finish_at == 0);

    for (unsigned int fault = 1; fault <= 3; ++fault) {
        reset_mock();
        spi_fault = fault;
        epd_start();
        assert(run() == EPD_SPI_TIMEOUT);
        assert(now < 200000);
    }
    puts("PASS: exact message, packed rows, one refresh, shutdown and timeout paths");
    return 0;
}
