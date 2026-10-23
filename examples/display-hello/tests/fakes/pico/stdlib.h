#ifndef TEST_PICO_STDLIB_H
#define TEST_PICO_STDLIB_H

#include <stdbool.h>
#include <stdint.h>

typedef unsigned int uint;
enum { GPIO_IN, GPIO_OUT, GPIO_FUNC_SIO, GPIO_FUNC_SPI };
void gpio_init(uint pin);
void gpio_put(uint pin, bool level);
void gpio_set_dir(uint pin, bool output);
void gpio_set_function(uint pin, uint function);
void gpio_disable_pulls(uint pin);
bool gpio_get(uint pin);
uint64_t time_us_64(void);

#endif
