---
name: pico-firmware
description: Write or review Moorpheus firmware in C for the Raspberry Pi Pico 2 W (RP2350) with the Pico SDK. Use for any firmware code, CMake, driver, service or update work in this repository.
---

# Pico firmware

Get pins, timings and part behaviour from the `moorpheus-hardware-facts` skill. Don't hard-code values you haven't looked up.

## Stack

C with Pico SDK 2.3.x, a cooperative non-blocking service loop, `pico_cyw43_arch_lwip_threadsafe_background`, and RP2350 A/B partitions with Try-Before-You-Buy (TBYB) for updates, with USB BOOTSEL and UF2 for recovery. Don't use an RTOS, MicroPython or Arduino unless the user asks. The rationale is in `docs/best-language-framework-update-mechanism.md`.

## C rules

- Use C11 (the SDK default), `<stdint.h>` fixed-width types, `static` for anything internal to a file, and `const` wherever data doesn't change.
- Don't allocate on the heap at runtime. Every buffer needs a fixed bound.
- Return explicit status codes. Validate inputs at module boundaries, not inside every internal function.
- Prefer `enum` to `#define` for related constants. Wrap macro arguments in parentheses.
- Keep functions small and comments about why, not what. Don't add unused code.

## Moorpheus constraints

- Write one non-blocking state machine per service: GNSS, alarm, power, buttons, display, network, persistence and update. Every UART, I2C, SPI and flash operation needs a timeout.
- The alarm path must never wait on the display, Wi-Fi or flash. A fault gets its own state; don't drop it silently.
- The watchdog limit (about 16.7 s) is shorter than a display refresh (about 19 s), so feed the watchdog while waiting on BUSY.
- Send debug output over USB stdio. GP0 and GP1 belong to the GNSS UART.
- Keep flash writes rare and bounded, and never write during active alarm handling. Store settings with a version and CRC.
- Never move the anchor reference automatically. After a reboot, revalidate the GNSS fix before trusting it.
- After an update, call `explicit_buy()` only once a short self-test passes, and before starting any full display refresh.
- Keep geometry, alarm logic, UBX parsing, settings encoding and rendering free of hardware calls, so they can be tested on a host.

## Evidence

Report host tests, firmware builds and on-hardware results separately. Never say something works on hardware without hardware evidence. This is a prototype, not a certified marine safety system.

## Build and flash

The repository has no firmware tree yet. Once one exists, add the verified build, test and flash commands here. Until then, don't present any commands as tested.
