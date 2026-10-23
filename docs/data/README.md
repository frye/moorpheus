# Component datasheets

Per-component spec, wiring, programming and power notes for the parts in the [Pico 2 W anchor alarm build guide](../pico_2_w_anchor_alarm_build_guide_v2.md) shopping list (§4).

| Component | Configuration | File |
|---|---|---|
| Raspberry Pi Pico 2 W | Both | [raspberry-pi-pico-2-w.md](raspberry-pi-pico-2-w.md) |
| SparkFun NEO-F10N GNSS breakout | Both | [sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) |
| u-blox ANN-MB5 antenna | Both | [u-blox-ann-mb5-antenna.md](u-blox-ann-mb5-antenna.md) |
| Waveshare 4" e-Paper HAT+ (E) | Both | [waveshare-4in-epaper-hat-plus-e.md](waveshare-4in-epaper-hat-plus-e.md) |
| Adafruit MPM3610 3.3 V buck | Both | [adafruit-mpm3610-buck.md](adafruit-mpm3610-buck.md) |
| VSYS Schottky isolation diode | Both | [schottky-isolation-diode.md](schottky-isolation-diode.md) |
| Boat 12 V → 5 V supply and protection | Both | [marine-12v-to-5v-supply.md](marine-12v-to-5v-supply.md) |
| Momentary pushbuttons | Both | [momentary-pushbuttons.md](momentary-pushbuttons.md) |
| Qwiic cables and connectors | Both | [qwiic-cables-and-connectors.md](qwiic-cables-and-connectors.md) |
| Passives and general hardware | Both | [passive-components-and-general-hardware.md](passive-components-and-general-hardware.md) |
| SparkFun Qwiic Buzzer | Baseline sounder | [sparkfun-qwiic-buzzer.md](sparkfun-qwiic-buzzer.md) |
| Adafruit bq24074 charger | Battery-backed | [adafruit-bq24074-charger.md](adafruit-bq24074-charger.md) |
| Adafruit PowerBoost 1000 Basic | Battery-backed | [adafruit-powerboost-1000-basic.md](adafruit-powerboost-1000-basic.md) |
| Protected 1S Li-ion/LiPo pack | Battery-backed | [lipo-1s-protected-battery.md](lipo-1s-protected-battery.md) |
| Adafruit MAX17048 fuel gauge | Battery-backed | [adafruit-max17048-fuel-gauge.md](adafruit-max17048-fuel-gauge.md) |
| SparkFun Large Piezo Alarm | Optional A | [sparkfun-large-piezo-alarm.md](sparkfun-large-piezo-alarm.md) |
| Logic-level N-MOSFET driver | Optional A | [logic-level-n-mosfet-driver.md](logic-level-n-mosfet-driver.md) |
| Optional 12 V boost converter | Optional A4 | [boost-converter-12v-optional.md](boost-converter-12v-optional.md) |

## Open discrepancies with the build guide

These came out of the research. The build guide has not been changed yet; review each one before building.

**Controller and firmware**
- **Watchdog:** the maximum timeout (about 16.7 s) is shorter than the 19 s display refresh, so the watchdog must be fed while waiting on the display.
- **Debug serial:** the `pico2_w` board setting sends debug serial to GP0/GP1, the GPS UART pins. Use USB for debug output instead.
- **Alarm gate pull-down:** on early RP2350 chips (A2, erratum E9), the guide's 100 kΩ resistor may not hold the alarm off at boot. Use 10 kΩ or less.

**Display**
- **CS pull-up:** CS goes through the board's TXB0108 level shifter, which needs pull-ups above 50 kΩ. Use about 100 kΩ instead of the guide's 10 kΩ.
- **Refresh limits:** Waveshare recommends at least 180 s between refreshes and at least one refresh every 24 h. A STATUS tap and the Emergency60 policy can each break one of these.

**GNSS**
- **Interface:** the NEO-F10N is UART-only.
- **Standby:** there is no power save mode, only software standby, and standby loses settings held in RAM. Save the configuration to battery-backed RAM or flash.
- **Antenna power:** the antenna stays powered in standby (about 17 mA). Its supply (about 3.03 V) sits right at the antenna's 3.0 V minimum.
- **USB back-feed:** cut both USB-to-UART jumpers, because USB-C can feed power back into PERIPH3V3.

**Power**
- **bq24074 board:**
  - Feed EXT5 to the VBUS pad, not the DC jack: the jack's diode drops about 0.5 V.
  - The 1 kΩ input-limit resistor is below TI's 1.1 kΩ minimum.
  - Charging stops at about 0.3 A, so it ends early on small packs.
- **PowerBoost low-battery pin:** it can sit at up to about 4.4 V, so it must not connect straight to a Pico pin.
- **Load dump:** boat load-dump spikes exceed the rating of every candidate converter, so the supply needs surge clamping in front.

Code snippets in these component references have been syntax-checked against stub headers only; none have run on hardware. The separate [Step 1 display sample](../display-bring-up.md) has a real Pico SDK target build and host checks, but no hardware results. Measure every current marked "unverified" or "measure".
