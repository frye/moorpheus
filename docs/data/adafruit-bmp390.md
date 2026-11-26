# Adafruit BMP390 — datasheet & integration notes

> Part: Adafruit product 4816, BMP390 Precision Barometric Pressure and Altimeter, STEMMA QT · Role in project: optional local pressure and temperature observations for future histories and trends · Configuration: Pico Optional C or planned ESP32-S3 touch edition; not required for the anchor alarm

## 1. Overview

The preferred optional sensor is the Adafruit BMP390 breakout, with a regulator, level shifting and STEMMA QT/Qwiic-compatible connectors [1][2]. It measures pressure and internal temperature, not humidity, wind or rain. It is not a complete weather station or a forecast source.

This is a documentation-only option for both editions. There is no sensor firmware, and nothing has been assembled or tested. Installed accuracy, current and environmental behaviour are **unverified — measure**. Adafruit markets BMP390 and BMP390L together [1]; identify the fitted part and check its matching datasheet before qualification rather than assuming every rating is interchangeable.

The Adafruit BME280 (product 2652) is a brief alternative if humidity matters: its product page quotes ±3 % RH, ±1 hPa absolute pressure and ±1 °C temperature accuracy [7]. Those are supplier figures, not installed results. It is an alternative, not a second required sensor; its wiring and qualification would need their own review.

## 2. Key specifications

Bosch figures below apply to the **BMP390 chip**, under the stated conditions, not to a complete installed breakout.

| Parameter | Value | Source |
|---|---|---|
| Breakout VIN | 3–5 V accepted; use **3.3 V only** in this project | [2][6] |
| Bare chip supply | VDD 1.65–3.6 V; VDDIO 1.2–3.6 V; not the breakout VIN specification | [3] |
| Interface | I²C or SPI; use I²C polling here | [1][2][6] |
| I²C address (7-bit) | 0x77 default; bridge ADDR for 0x76 | [2] |
| Chip I²C speed | Up to 3.4 MHz; supports the touch board's 400 kHz bus, but does not qualify the complete breakout and cable chain at that speed | [3] p3; [6] §3.4 |
| Operating pressure / temperature | 300–1250 hPa; −40 to +85 °C operating, 0–65 °C full-accuracy temperature range | [3] |
| Typical absolute pressure accuracy | ±0.5 hPa, 300–1100 hPa at 0–65 °C | [3] p8 |
| Typical relative pressure accuracy | ±0.03 hPa, 700–1100 hPa at 25–40 °C, per 10 kPa steps | [3] p7 |
| Temperature accuracy | ±0.5 °C at 25 °C; ±1.5 °C over 0–65 °C | [3] p8 |
| Typical long-term pressure stability | ±0.16 hPa over 12 months in the specified full-accuracy range; not zero drift | [3] |
| Chip typical current, pressure + temperature | 3.2 µA at 1 Hz; not total breakout current | [3] p3 |
| Chip sleep current | 1.4 µA at VDD = VDDIO = 1.8 V; 1.5 µA at 3.6 V | [3] p7 |
| Breakout PCB outline | 25.4 × 17.78 mm, read from Eagle layer 20 outline (x 0–25.4, y 0–17.78); allow extra connector/cable clearance | [4][5] |
| Installed ambient-temperature error / total current | **Unverified — measure**; internal temperature depends on PCB temperature, self-heating and ambient, and is typically above ambient | [3] p8; [6] |

Do not apply the product page's unqualified ±0.5 °C temperature wording across the whole operating range. The internal temperature reading is not automatically outside-air temperature [1][3].
Accuracy, noise and resolution are different quantities; small output increments are not a promise of equally small absolute error [3].

## 3. Pinout / connections

From Adafruit's pinouts [2]:

| Pin / connector | Function / project use |
|---|---|
| VIN | Breakout supply and logic level; feed from the edition's verified 3.3 V peripheral supply |
| GND | Common ground |
| SCK / SCL | I²C clock in this configuration |
| SDA | I²C data |
| 3Vo | Regulator output, **leave disconnected**; not a second power input |
| CS / SDO | Leave disconnected for I²C |
| INT | Leave disconnected for polling |
| STEMMA QT | Supply, ground, SDA and SCL; use a flying-lead adapter, not an assumed socket on either controller |
| ADDR | Leave open for 0x77; bridge only if 0x76 is needed |

### Pico 2 W edition — Optional C

Use a short STEMMA QT/Qwiic flying-lead adapter. Connect VIN to PERIPH3V3, GND to common ground, SDA to GP4 (physical pin 6) and SCK/SCL to GP5 (physical pin 7). Leave 3Vo, CS, SDO and INT disconnected. Start with the existing I²C0 bus at 100 kHz and default address 0x77; 0x76 is available if ADDR is bridged. Neither conflicts with the baseline buzzer at 0x34 or battery-only gauge at 0x36 [2][9].

Optional A removes the Qwiic Buzzer, and Optional B removes the battery and gauge; neither removes the sensor's PERIPH3V3 or I²C0 connections. Check combined pull-ups, rise time and cable capacitance, keeping all pull-ups at 3.3 V. USB alone can power the Pico while PERIPH3V3 is absent: disconnect the signal harness or use the build guide's safe pin states to prevent back-powering through SDA/SCL. Do not tie Pico 3V3 OUT to PERIPH3V3 [9].

## 4. Wiring in this project — ESP32-S3 touch edition only

The display has no Qwiic socket or free GPIO. Use its H4 screw terminal and a short local STEMMA QT-to-flying-lead adapter [2][6]. The source of truth for this edition is the [touch build guide](../esp32_s3_touch_lcd_4_anchor_alarm_build_guide.md) §6.

| H4 terminal | BMP390 breakout | Notes / source |
|---|---|---|
| 7, I2C_VCC | VIN | Inspect H3: fitted to **3.3 V**, not 5 V; meter before connecting [6] |
| 8, GND | GND | Common with display, GNSS and converter [6] |
| 9, SDA | SDA | Shared bus, internal GPIO15 [6] |
| 10, SCL | SCK / SCL | Shared bus, internal GPIO7 [6] |

Either sensor address is distinct from the documented touch devices: CH32 0x24, RTC 0x51, GT911 0x5D or 0x14; older boards also use TCA9554 0x20 and SW6106 0x3C [2][6]. Preserve the board-revision checks: V1–V3 can hold I²C low on VIN without a battery; V1/V2 also have a different expander bus arrangement [6].

Check combined pull-ups and bus capacitance with all fitted accessories and level shifters, including rise time at the planned bus speed. Keep the harness short and inside the protected installation. Disconnect power before wiring. Review mixed-power/back-feed paths before bench USB, VIN, battery or separately powered accessories are combined; do not drive an unpowered device over SDA/SCL [2][6].

## 5. Power requirements & consumption

The chip's low current is not a complete breakout or system budget: the regulator, pull-ups and transactions add load [2][3][5]. Measure idle and sampling current on the installed breakout. On the touch edition, include the sensor alongside the GNSS and RS485 converter on I2C_VCC, and qualify the whole board supply during Wi-Fi, full backlight, alarm, charging and battery hand-off [6]. On the Pico edition, check the selected supply modes and existing peripherals [9]. There are no measured runtime or supply-margin claims for this option.

## 6. Programming / configuration — future integration only

Bosch's portable C [BMP3 Sensor API](https://github.com/boschsensortec/BMP3_SensorAPI) is a future integration reference, not firmware already included here [8]. Identify the chip, read its calibration coefficients and use the manufacturer's compensation path. On the touch edition, sensor reads must go through the single I²C owner, not a competing bus driver [6]. For the Pico SDK, the API needs platform I²C and delay callbacks; Arduino and CircuitPython libraries are not drop-in Pico SDK C drivers [8][9].

Use bounded transactions and retries below GNSS and alarm work. An intentionally absent or disabled option is not a baseline alarm fault; report enabled sensors' missing, stale or failed observations visibly, retaining timestamps rather than replacing failures with zero or invented readings. Software timeouts cannot isolate a physically shorted bus: it can affect the Pico's buzzer or gauge, or disable touch-board CH32 access including buzzer and power latch [6][9]. On the touch edition, give buzzer and SYS_EN requests priority and do not power-cycle the shared alarm-control rail to reset this sensor [6].

Future local history could record timestamped pressure in hPa and temperature in °C offline. Sampling cadence, trend window, sufficient-history rule and persistence remain undecided. Consider forced-mode sampling followed by sleep, without blocking alarm processing [3][9]. Show units, sample age, gaps and restarts; do not draw a trend arrow without enough valid history. On the Pico, sampling must not force a refresh or change the existing display and power policies [9]. Label pressure as local/station pressure, not sea-level-reduced pressure; do not automatically correct it with noisy GNSS altitude or infer a reliable storm warning from pressure alone.

## 7. Design notes, limits & gotchas

- **Thermal placement.** Separate the sensor from the display, MCU, regulators and direct sun. Compare against a reference thermometer after enclosure heat soak; its reading may represent enclosure air or PCB heat rather than outside air [3][6][9].
- **Atmospheric access.** Provide a vented pressure path with splash, salt and condensation protection. The bare breakout is not waterproof; do not block or coat the pressure port. Qualification must include the installed vent and enclosure [1][3].
- **Weather is secondary.** Future network forecasts need their own source/provider, location, issued/valid/fetched times and stale/offline status. Local Wi-Fi or a DataHub connection does not prove internet access. No weather API is selected; the anchor GNSS and alarm must remain independent of weather UI and network work.
- **Safety.** This is a prototype option, not a certified marine safety instrument. Use an independent anchor watch during trials.

## 8. Bring-up / test checklist — not yet performed

1. Identify the fitted sensor variant and board revision; confirm the matching datasheet. On the touch edition, with the sensor disconnected, inspect H3 and measure H4 I2C_VCC at 3.3 V. On the Pico, perform optional sensor checks only after the Step 1 on-device acceptance gate and verify PERIPH3V3 and pull-up voltages [2][6][9].
2. Power down, wire the adapter for the chosen edition, inspect polarity and unconnected pins, then scan the shared bus. Expect the sensor at 0x77 (or 0x76 if deliberately changed) plus the edition's existing devices [2][6][9].
3. Verify chip identity and compensated readings. Compare local pressure with a reference barometer at the same height and pressure basis, and temperature with a reference thermometer after thermal equilibrium. Record offsets and uncertainty.
4. Measure breakout and combined supply current and pull-ups/rise times with existing peripherals active in the selected supply modes. On the touch edition, include alarm writes, touch, Wi-Fi, backlight changes and VIN/battery hand-off. Confirm GNSS and alarm timing are not delayed.
5. On a current-limited bench, test sensor absence, failed/stale reads and a stuck bus. Confirm bounded retries, visible faults and alarm-control priority; on the touch edition, also verify no sensor-triggered rail cycling. Record the shared physical-bus failure limitation.
6. Qualify heat soak, vent response, splash/salt protection and condensation in the intended installation. Do not claim marine suitability from a chip specification.
7. When history/weather software exists, test gaps, insufficient history, restart and offline/stale forecasts; confirm none can suppress the anchor alarm.

## 9. References

1. Adafruit, BMP390 Precision Barometric Pressure and Altimeter, product 4816 — https://www.adafruit.com/product/4816
2. Adafruit Learning System, BMP388/BMP390/BMP3xx pinouts — https://learn.adafruit.com/adafruit-bmp388-bmp390-bmp3xx/pinouts
3. Bosch Sensortec, BMP390 datasheet, BST-BMP390-DS002, pp3, 7–8 (conditions, current and internal-temperature caveat) — https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp390-ds002.pdf
4. Adafruit Learning System, downloads (datasheets and CAD) — https://learn.adafruit.com/adafruit-bmp388-bmp390-bmp3xx/downloads
5. Adafruit, BMP390 Eagle board CAD, layer 20 outline — https://github.com/adafruit/Adafruit-BMP3xx-PCB/blob/master/Adafruit%20BMP390.brd
6. Project, [Waveshare ESP32-S3-Touch-LCD-4 component note](waveshare-esp32-s3-touch-lcd-4.md), §§3–7; [touch edition build guide](../esp32_s3_touch_lcd_4_anchor_alarm_build_guide.md), §§6, 8, 11–12
7. Adafruit, BME280 temperature, humidity and pressure sensor, product 2652 — https://www.adafruit.com/product/2652
8. Bosch Sensortec, BMP3 Sensor API, portable C driver — https://github.com/boschsensortec/BMP3_SensorAPI
9. Project, [Pico 2 W build guide](../pico_2_w_anchor_alarm_build_guide_v2.md), §§5–6, 8–12 and Optional A/B/C
