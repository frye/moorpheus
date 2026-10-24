# Adafruit BMP390 — pressure and temperature option

> Part: Adafruit 4816, BMP390 Precision Barometric Pressure and Altimeter, STEMMA QT · Role in project: optional local pressure and temperature readings and future trends · Configuration: Optional C, compatible with the battery-backed Pico build and Optional A/B; not required for the anchor alarm

## 1. Overview

The BMP390 is a good candidate when pressure trends are the main aim. The Adafruit breakout adds a regulator, level shifting and Qwiic-compatible STEMMA QT connectors, so it can share the existing I2C bus without another GPIO [1][2]. It measures pressure and internal sensor temperature, not humidity, wind or rain.

This is a documented option, not implemented firmware or a hardware-qualified installation. Published accuracy figures below describe the sensor under stated conditions, not the assembled Moorpheus system.

Adafruit may supply BMP390 or BMP390L on this product [1]. Record the fitted part and board revision before qualification; the Bosch specification figures below are from the BMP390 datasheet [3], not an independent verification of every BMP390L rating.

## 2. Key specifications

| Parameter | Published value or design note | Source |
|---|---|---|
| Breakout PCB outline | 25.4 × 17.78 mm, from the CAD board outline; allow additional connector, cable and mounting clearance | [4] |
| Interface | I2C or SPI; use I2C here. Chip supports standard/fast mode and up to 3.4 MHz high-speed mode; this does not qualify a complete breakout/cable chain at that speed | [2][3] |
| Breakout VIN and logic | 3–5 V supported by Adafruit; use the project's 3.3 V peripheral rail only | [2][5] |
| Bare chip supply | VDD 1.65–3.6 V; VDDIO 1.2–3.6 V; not the breakout VIN specification | [3] |
| I2C address, 7-bit | 0x77 by default; bridge ADDR for 0x76 | [2] |
| Operating pressure / temperature | 300–1250 hPa; −40 to +85 °C operating, 0–65 °C full-accuracy temperature range | [3] |
| Typical absolute pressure accuracy | ±0.50 hPa at 300–1100 hPa and 0–65 °C | [3] |
| Typical relative pressure accuracy | ±0.03 hPa at 700–1100 hPa and 25–40 °C, specified per 10 kPa steps; not a guarantee of trend accuracy across every temperature or time interval | [3] |
| Temperature accuracy | ±0.5 °C at 25 °C; ±1.5 °C over 0–65 °C, for the internal temperature measurement | [3] |
| Typical long-term pressure stability | ±0.16 hPa over 12 months in the specified full-accuracy range; not zero drift | [3] |
| Typical chip current | 3.2 µA at 1 Hz pressure/temperature sampling; sleep 1.4 µA at VDD = VDDIO = 1.8 V, 1.5 µA at 3.6 V | [3] |
| Installed consumption and accuracy | **Unverified — measure** total breakout current, rail margin, thermal offset and pressure response after installation | [3][5] |
| Marine protection | No marine environmental qualification established for this breakout; provide installation-specific protection and retain atmospheric access | [1][3] |

Accuracy, noise and resolution are different quantities. The small output increments and filtered noise figures in the datasheet are not a promise of equally small absolute error [3].

## 3. Pico wiring

Use a STEMMA QT/Qwiic flying-lead adapter; the Pico has no native socket. Keep the harness short and inside the protected installation. Follow the [build guide](../pico_2_w_anchor_alarm_build_guide_v2.md) power and mixed-power rules [5].

| Breakout connection | Pico build connection | Source |
|---|---|---|
| VIN / QT power | PERIPH3V3, not SYS5, EXT5 or boat voltage | [2][5] |
| GND | Common ground | [2][5] |
| SDA | GP4, physical pin 6, shared I2C0 SDA | [2][5] |
| SCK / SCL | GP5, physical pin 7, shared I2C0 SCL | [2][5] |
| 3Vo | Leave disconnected; this is the breakout regulator output, not a second power input | [2] |
| CS and SDO | Leave disconnected for I2C use; keep the default ADDR setting unless needed | [2] |
| INT | Leave disconnected; future firmware can poll for completion | [2][3] |

Start at the existing 100 kHz bus rate. The default sensor address 0x77 does not conflict with the Qwiic Buzzer at 0x34 or the battery-only MAX17048 at 0x36 [2][5]. Check total parallel pull-up resistance, rise time and cable capacitance after adding the breakout; keep every pull-up at 3.3 V. Do not assume that chaining connectors makes arbitrarily long I2C wiring reliable.

Optional A removes the Qwiic Buzzer, not this sensor. Optional B removes the fuel gauge and battery hardware, not PERIPH3V3 or I2C0. The sensor can remain on the same connections in either option [5].

USB alone can power the Pico while PERIPH3V3 is absent. Disconnect the signal harness or enforce the guide's safe pin states; do not back-power the sensor through SDA/SCL or tie the Pico regulator output to PERIPH3V3 [5].

## 4. Installation and temperature limitations

Bosch explicitly says that the internal temperature depends on PCB temperature, sensor self-heating and ambient air, and is typically above ambient [3, table 2 footnote 3]. It is used for pressure compensation; it is not automatically a calibrated outside-air thermometer.

Mount away from the MCU, radio, converters, display electronics and sun-heated surfaces. Give the sensor access to the air being measured, in shade with thermal separation. A reading inside a warm enclosure should be labelled as local/enclosure temperature, not outside weather temperature.

Pressure needs an atmospheric path. A sealed enclosure can trap a different pressure and respond to its own heating. Provide a suitable pressure-equalising vent and splash, salt and condensation protection without blocking or coating the sensor port. Neither a hobby breakout nor a generic vent establishes a waterproof marine assembly. Check the installed response and temperature bias against an independent reference before using the readings.

Avoid wind-driven pressure at the port and direct spray. A stable, sheltered mounting position matters for trends; opening doors, handling the enclosure or thermal changes can introduce disturbances [3]. Record installation limitations rather than claiming that filtering removes them.

## 5. Future programming and trends

No sensor driver or weather UI is implemented here. Bosch's [BMP3 SensorAPI](https://github.com/boschsensortec/BMP3_SensorAPI) is a portable C starting point for a later Pico SDK integration, using platform I2C and delay callbacks [6]. Use its calibration/compensation routines rather than treating raw ADC output as pressure. Adafruit also documents Arduino and CircuitPython support, which is not a drop-in Pico SDK C driver [1][6].

Future integration should:

- Make the sensor explicitly optional. An absent disabled option is not an alarm fault; an enabled sensor that stops responding must show an unavailable/stale state.
- Use bounded I2C transactions and retries, with GNSS and alarm handling taking priority. A sensor can physically hold the shared bus low; optional software status does not electrically isolate it from the baseline I2C buzzer or gauge.
- Consider forced-mode pressure/temperature conversions followed by sleep for low-rate trends [3]. Do not block the service loop waiting for conversion or change the alarm's wake schedule solely for weather.
- Timestamp valid samples and keep bounded history for local temperature, pressure and pressure change. Sampling cadence, trend windows, storage size and persistence remain future implementation decisions.
- Show units, sample age and gaps. Use elapsed time for trend calculations, handle clock corrections/restarts, and show “insufficient history” rather than inventing a trend across missing data. Avoid frequent flash writes or storage work that delays the alarm.

Local graphs and trends do not need Wi-Fi or internet. Sampling need not trigger a display refresh: retain the guide's normal, backup and emergency policies, including the minimum refresh interval and daily refresh requirement [5]. Label future charts as proposed functionality, not an existing screen.

Keep measured local/station pressure separate from a weather service's sea-level-reduced pressure. Comparing those directly can create a false offset. Do not use noisy GNSS altitude changes to manufacture a pressure trend, or infer a reliable forecast or storm warning from pressure alone.

## 6. Future network weather

A later weather page could combine local history with separately labelled forecast data. Boat Wi-Fi or a DataHub connection does not itself prove internet access. A provider, location source, licence/attribution and credential handling still need selecting; none is added here.

Keep observation time, forecast issue/valid time, fetch time, source and units visible as appropriate. Cache only with an explicit freshness policy and mark expired/offline data; local measurements and anchor monitoring must continue without a forecast. Weather requests, parsing and display work must never delay local GNSS processing or sounding [5].

## 7. Humidity alternative

The [Adafruit BME280 STEMMA QT breakout, product 2652](https://www.adafruit.com/product/2652), adds humidity. Adafruit quotes ±3% relative humidity, ±1 hPa absolute pressure and ±1 °C temperature accuracy; those are headline specifications, not installed system results [7]. The BMP390 is preferred here for pressure performance, not because it measures more weather variables.

The BME280 is an alternative, not a second required part or a pin-for-pin substitution assumed without checking its guide and address configuration. It has the same enclosure-heating and exposure concerns. If accurate ambient temperature becomes a requirement, qualify the mounting first and consider a separate temperature probe in a later design change.

## 8. Power and acceptance

Include the regulator and level-shifter overhead and any bus pull-up current when measuring total added consumption. Do not use the bare chip's microamp figure as a breakout or system power budget [2][3]. Measure with the chosen sampling settings and existing peripherals active, in the relevant supply modes [5].

After the Step 1 on-device acceptance gate, optional sensor checks are:

1. Verify the fitted part, board revision, VIN, pull-up voltage and address with all relevant power combinations.
2. Confirm pressure and temperature against an independent reference, then repeat with display, Wi-Fi and converters active to reveal thermal bias.
3. Check vent response, mounting disturbances and protected environmental exposure without treating the bare board as waterproof.
4. Exercise absent, disconnected, stale and bus-stuck cases. Confirm optional sensor errors are visible and do not block GNSS/alarm processing; explicitly record any shared-bus sounder limitation.
5. Check history gaps/restarts and internet loss. Local readings and the anchor alarm must not depend on successful weather downloads.
6. Measure total additional current and supply stability; keep installed values **unverified** until recorded.

## 9. Sources

[1] Adafruit, [BMP390 breakout product 4816](https://www.adafruit.com/product/4816), including BMP390/BMP390L supply variation.

[2] Adafruit, [BMP388/BMP390 pinouts](https://learn.adafruit.com/adafruit-bmp388-bmp390-bmp3xx/pinouts): VIN, regulator output, logic, I2C and address jumper.

[3] Bosch Sensortec, [BMP390 datasheet, BST-BMP390-DS002, revision 1.7](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp390-ds002.pdf), key features, table 2 and its temperature footnote, forced mode and I2C timing. See also the [manufacturer summary](https://www.bosch-sensortec.com/products/environmental-sensors/pressure-sensors/bmp390/).

[4] Adafruit, [BMP390 Eagle board file](https://github.com/adafruit/Adafruit-BMP3xx-PCB/blob/master/Adafruit%20BMP390.brd), layer 20 outline; [downloads and mechanical resources](https://learn.adafruit.com/adafruit-bmp388-bmp390-bmp3xx/downloads).

[5] Moorpheus, [Pico build guide](../pico_2_w_anchor_alarm_build_guide_v2.md), §§5–6, 8–12 and Optional A/B/C.

[6] Bosch Sensortec, [BMP3 SensorAPI](https://github.com/boschsensortec/BMP3_SensorAPI), C driver and integration callbacks.

[7] Adafruit, [BME280 breakout product 2652](https://www.adafruit.com/product/2652) and [integration guide](https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout).
