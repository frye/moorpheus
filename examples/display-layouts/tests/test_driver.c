#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "layouts.h"
#include "epd.h"
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
static uint64_t refresh_at;
static uint64_t power_off_at;
static unsigned int bytes_in_cs;
static unsigned int page;

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
    return current_command != 0x12 ||
           (!refresh_stuck && now - refresh_at >= 19000000);
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
    assert(!levels[9] && bytes_in_cs++ == 0);
    if (!levels[8]) {
        assert(command_count < sizeof(commands));
        commands[command_count++] = value;
        current_command = value;
        if (value == 0x12) {
            refresh_at = now;
        } else if (value == 0x02) {
            power_off_at = now;
        }
    } else if (current_command == 0x10) {
        assert(pixel_bytes < LAYOUT_FRAME_BYTES);
        assert(value == layout_frames[page][pixel_bytes++]);
    }
    return true;
}
bool spi_is_busy(const spi_inst_t *spi)
{
    assert(spi == spi1);
    return spi_fault == 3;
}

static void prepare(void)
{
    force_busy = false;
    refresh_stuck = false;
    spi_fault = 0;
    current_command = 0;
    command_count = 0;
    pixel_bytes = 0;
    refresh_at = 0;
    power_off_at = 0;
    bytes_in_cs = 0;
    assert(layouts_select(page));
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

int main(void)
{
    static const uint8_t expected_commands[] = {
        0xAA, 0x01, 0x00, 0x05, 0x08, 0x06, 0x03, 0x60,
        0x30, 0x50, 0x61, 0xE3, 0x84, 0x10, 0x04, 0x06,
        0x12, 0x02, 0x07
    };
    for (unsigned int i = 0; i < 7; ++i) {
        page = i % LAYOUT_COUNT;
        prepare();
        epd_start();
        assert(levels[14] && directions[9]);
        assert(run() == EPD_DONE);
        assert(command_count == sizeof(expected_commands));
        assert(memcmp(commands, expected_commands, sizeof(expected_commands)) == 0);
        assert(pixel_bytes == 120000);
        assert(power_off_at - refresh_at >= 19100000);
        assert(power_off_at - refresh_at < 19200000);
        now += 180000000;
    }
    prepare();
    force_busy = true;
    epd_start();
    assert(run() == EPD_BUSY_TIMEOUT && command_count == 0);
    prepare();
    refresh_stuck = true;
    epd_start();
    assert(run() == EPD_BUSY_TIMEOUT);
    assert(now - refresh_at >= 60000000 && now - refresh_at < 60100000);
    assert(power_off_at == 0);
    for (unsigned int fault = 1; fault <= 3; ++fault) {
        prepare();
        spi_fault = fault;
        epd_start();
        assert(run() == EPD_SPI_TIMEOUT);
    }
    puts("PASS: repeated starts, exact page transfers, command order, shutdown and timeouts");
    return 0;
}
