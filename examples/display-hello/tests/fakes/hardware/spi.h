#ifndef TEST_HARDWARE_SPI_H
#define TEST_HARDWARE_SPI_H

#include <stdbool.h>
#include <stdint.h>

typedef struct {
    volatile uint32_t dr;
} spi_hw_t;
typedef struct {
    spi_hw_t hw;
} spi_inst_t;
extern spi_inst_t *const spi1;
enum { SPI_CPOL_0, SPI_CPHA_0, SPI_MSB_FIRST };
unsigned int spi_init(spi_inst_t *spi, unsigned int hz);
void spi_set_format(spi_inst_t *spi, unsigned int bits, unsigned int cpol,
                    unsigned int cpha, unsigned int order);
bool spi_is_writable(const spi_inst_t *spi);
bool spi_is_readable(const spi_inst_t *spi);
bool spi_is_busy(const spi_inst_t *spi);
spi_hw_t *spi_get_hw(spi_inst_t *spi);

#endif
