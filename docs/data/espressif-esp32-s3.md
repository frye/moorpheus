# Espressif ESP32-S3 SoC (WROOM-1-N16R8 module) — datasheet & integration notes

> Part: Espressif ESP32-S3 in an ESP32-S3-WROOM-1-N16R8 module (16 MB flash, 8 MB octal PSRAM) · Role in project: application processor on the Waveshare ESP32-S3-Touch-LCD-4 · Configuration: ESP32 touch edition only

## 1. Overview

The ESP32-S3 is a dual-core Xtensa LX7 SoC with 2.4 GHz Wi-Fi, Bluetooth LE, an RGB/8080 LCD interface, native USB and two ultra-low-power coprocessors [1]. On the Waveshare board it comes as a WROOM-1-N16R8 module, which adds 16 MB of quad-SPI flash, 8 MB of octal-SPI PSRAM and a PCB antenna [2][3]. This file collects the SoC facts that matter for the anchor alarm. Board-level wiring is in [waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md).

## 2. Key specifications

| Parameter | Value | Source |
|---|---|---|
| CPU | Dual-core Xtensa LX7, up to 240 MHz | [1] |
| CoreMark | 613.86 (one core, 240 MHz); 1181.60 (two cores) | [1] |
| On-chip memory | 384 KB ROM, 512 KB SRAM, 16 KB RTC SRAM | [1] |
| Module memory (N16R8) | 16 MB quad-SPI flash, 8 MB octal-SPI PSRAM | [2] |
| Wi-Fi | IEEE 802.11 b/g/n, 2.4 GHz | [1] |
| Bluetooth | Bluetooth 5 LE | [1] |
| GPIO | 45 programmable GPIO (most used by the RGB panel on this board) | [1] |
| UART | 3 | [1] |
| I²C | 2 | [1] |
| TWAI (CAN 2.0, ISO 11898-1) | 1 | [1] |
| LCD interface | 1 × 8–16-bit parallel RGB, I8080 or MOTO6800 | [1] |
| USB | 1 × full-speed USB OTG, 1 × USB Serial/JTAG controller | [1] |
| ADC | 2 × 12-bit SAR, up to 20 channels | [1] |
| Timers / watchdogs | 4 × 54-bit general timers, 52-bit system timer, 3 watchdog timers | [1] |
| Watchdogs | Two Main System Watchdogs (MWDT, one per timer group) and one RTC Watchdog (RWDT). RWDT and the first MWDT run automatically during flash boot | [1] |
| Security | Secure boot, flash encryption, 4-Kbit OTP, AES/SHA/RSA/HMAC/digital signature, RNG | [1] |
| Supply (VDD3P3, VDDA, VDD3P3_RTC, VDD3P3_CPU) | 3.0–3.6 V, 3.3 V typical | [1] |
| Module supply | 3.0–3.6 V; external supply ≥ 0.5 A | [2] |
| GPIO drive | 40 mA source / 28 mA sink at 3.3 V (PAD_DRIVER = 3) | [1] |
| Ambient temperature, chips with R8 PSRAM | −40 to 65 °C (85 °C with PSRAM ECC enabled, losing 1/16 of the PSRAM) | [1] |
| Module ambient temperature, N16R8 | −40 to 65 °C | [2] |
| Strapping pins | GPIO0 and GPIO46 (boot mode), GPIO45 (VDD_SPI), GPIO46 (ROM message printing), GPIO3 (JTAG source) | [1] |
| UART0 default pins | U0TXD = GPIO43, U0RXD = GPIO44 | [1] |
| USB pins | GPIO19 (D−), GPIO20 (D+), by default connected to USB Serial/JTAG | [1] |

### 2.1 Current consumption (chip only, datasheet, 3.3 V, 25 °C)

| Mode | Typical | Source |
|---|---|---|
| Wi-Fi TX, 802.11b 1 Mbps, 21 dBm (peak) | 340 mA | [1] Table 4-6 |
| Wi-Fi TX, 802.11n HT20 MCS7, 18.5 dBm (peak) | 283 mA | [1] |
| Wi-Fi RX, 802.11b/g/n HT20 | 88 mA | [1] |
| Modem-sleep, 240 MHz, one core active (32-bit access), all peripheral clocks on | 65.9 mA | [1] Table 4-7 |
| Modem-sleep, 240 MHz, both cores active (128-bit access), all peripheral clocks on | 107.9 mA | [1] |
| Light-sleep | 240 µA, plus about 140 µA for 8 MB octal PSRAM at 3.3 V | [1] Table 4-8 |
| Deep-sleep, RTC memory + RTC peripherals on | 8 µA | [1] |
| Deep-sleep, RTC memory only | 7 µA | [1] |
| Power off (CHIP_PU low) | 1 µA | [1] |

The datasheet notes that modem-sleep figures are for chips without in-package PSRAM. Chips with PSRAM may draw more [1]. These figures are for the chip alone, not the Waveshare board. Board figures must be measured ([waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) §5).

## 3. Pinout / connections

The module pins are not reachable on the Waveshare board apart from what the board routes to the 10-pin terminal. See the board file §3 for the GPIO map. The UART used for RS485 is mapped through the GPIO matrix to RX = GPIO43 and TX = GPIO44. This is the reverse of the UART0 default [1][4].

## 4. Wiring in this project

No direct wiring. All connections go through the Waveshare board. Relevant facts:

- Only one UART is reachable from outside the board, through the RS485 transceiver. A second GNSS UART cannot be added without hardware modification.
- TWAI is reachable through the board's CAN transceiver (GPIO6 TX, GPIO0 RX) [4].
- Both I²C controllers exist, but only one bus (GPIO7/GPIO15) is wired on V3/V4 boards [4].

## 5. Power requirements & consumption

See §2.1. Practical points for this project:

- **Screen on, no sleep.** While the RGB panel is on, the LCD peripheral streams the framebuffer from PSRAM continuously [5]. Light-sleep and deep-sleep are therefore only usable with the screen off. The alarm loop must assume modem-sleep or active power while the display is visible.
- **Wi-Fi power save.** Wi-Fi power-save modes and automatic light-sleep interact with the RGB driver and PSRAM. Treat any "connected light-sleep" figure as unproven for this board until it is measured with the display on and off [5][6].
- **Wi-Fi peaks.** Wi-Fi TX peaks of 283–340 mA [1] land on the board's 3.3 V buck. They are not a problem for the 3 A buck rating, but they matter for battery sizing.

## 6. Programming / configuration

- **Framework.** ESP-IDF (Waveshare uses ≥ v5.3.1; the RS485 FAQ recommends v5.5.2) or Arduino-ESP32 3.x [4].
- **Console.** Use USB Serial/JTAG (`CONFIG_ESP_CONSOLE_USB_SERIAL_JTAG`) so that UART logs do not go onto the RS485 pins [7].
- **ROM message printing.** By default the ROM prints to both UART0 and USB Serial/JTAG. It can be limited to one, or disabled, by register and eFuse settings [1]. eFuse changes are permanent. Do not burn eFuses on a prototype without a written decision.
- **OTA with rollback.** Use ESP-IDF OTA with two app slots and the `otadata` partition. Enable `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`. On first boot a new image is `ESP_OTA_IMG_PENDING_VERIFY`. The app must run its self-tests (GNSS frames arriving, alarm path alive, display up) and then call `esp_ota_mark_app_valid_cancel_rollback()`. Otherwise it calls `esp_ota_mark_app_invalid_rollback_and_reboot()`. If the new app resets before confirming, the bootloader rolls back [8].
- **Watchdogs.** Use the ESP-IDF Task Watchdog (TWDT) for the alarm, GNSS and display tasks, and keep the Interrupt Watchdog enabled [9]. The hardware RWDT/MWDT are active during flash boot [1].
- **Secure boot and flash encryption.** Both are available [1]. Leave them off for the prototype. Enabling them burns eFuses and complicates recovery.

Illustrative OTA confirmation fragment. It is not compiled or tested, and the API comes from [8]:

```c
const esp_partition_t *running = esp_ota_get_running_partition();
esp_ota_img_states_t st;
if (esp_ota_get_state_partition(running, &st) == ESP_OK && st == ESP_OTA_IMG_PENDING_VERIFY) {
    if (alarm_self_test_ok() && gnss_frames_seen_within_ms(5000)) {
        esp_ota_mark_app_valid_cancel_rollback();
    } else {
        esp_ota_mark_app_invalid_rollback_and_reboot();
    }
}
```

## 7. Design notes, limits & gotchas

- **Module temperature limit.** The −40 to 65 °C ambient limit of R8 parts [1][2] is the tightest temperature limit in the ESP32 edition that is known so far. Enabling PSRAM ECC raises it to 85 °C at the cost of 1/16 of the PSRAM [1]. Whether that works with the RGB framebuffer layout is **unverified**.
- **GPIO0 is a boot-mode strap** [1] and is wired to CAN RX on this board [4]. See the board file §7.
- **UART0 defaults (GPIO43/44)** coincide with the board's RS485 pins [1][4]. See the board file §7.
- **The internal temperature sensor** (−20 to 110 °C) measures the die, not the enclosure [1]. Use it only as a rough overheat flag.
- **Brown-out.** The 3.0 V minimum supply [1] means rail sag during VIN-to-battery hand-off can reset the chip. Keep the ESP-IDF brown-out detector enabled. Log reset reasons and restore the armed state from flash.

## 8. Bring-up / test checklist

1. Read the chip and module info with `esptool.py flash_id` / `chip_id`. Confirm 16 MB flash and 8 MB PSRAM.
2. Build with the console on USB Serial/JTAG. Confirm logs over USB and silence on the RS485 pins after boot.
3. Build an OTA test image with rollback enabled. Confirm that a deliberately failing self-test rolls back, and that a reset before confirmation also rolls back [8].
4. Trigger a task-watchdog timeout in a test build and confirm a reset with a logged reason [9].
5. Measure board current in each planned mode: screen on with Wi-Fi associated, screen off with Wi-Fi associated, and screen off with Wi-Fi off.

## 9. References

1. Espressif, ESP32-S3 Series Datasheet v1.6 — https://files.waveshare.com/wiki/common/Esp32-s3_datasheet_en.pdf (current version: https://documentation.espressif.com/esp32-s3_datasheet_en.pdf)
2. Espressif, ESP32-S3-WROOM-1 / WROOM-1U Datasheet v1.2 — https://files.waveshare.com/wiki/common/Esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf
3. Waveshare Wiki, "ESP32-S3-Touch-LCD-4" — https://www.waveshare.com/wiki/ESP32-S3-Touch-LCD-4
4. Moorpheus component note, [waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) (schematic-derived pin map and gotchas)
5. Espressif, ESP-IDF Programming Guide (ESP32-S3), "RGB Interfaced LCD" — https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/peripherals/lcd/rgb_lcd.html
6. Espressif, ESP-IDF Programming Guide (ESP32-S3), "Sleep Modes" and "Power Management" — https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/sleep_modes.html ; https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/power_management.html
7. Espressif, ESP-IDF Programming Guide (ESP32-S3), "USB Serial/JTAG Controller Console" — https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/usb-serial-jtag-console.html
8. Espressif, ESP-IDF Programming Guide (ESP32-S3), "Over The Air Updates (OTA)", App rollback — https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/ota.html
9. Espressif, ESP-IDF Programming Guide (ESP32-S3), "Watchdogs" — https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/wdts.html
