# Component datasheets

Per-component spec, wiring, programming and power notes for the parts in the two hardware editions:

- the [Pico 2 W anchor alarm build guide](../pico_2_w_anchor_alarm_build_guide_v2.md) shopping list (§4), and
- the planned [ESP32-S3 touch edition build guide](../esp32_s3_touch_lcd_4_anchor_alarm_build_guide.md) shopping list (§4).

Some files serve both editions. Those files keep the Pico wiring in their main sections and add a separate ESP32 touch edition section.

## Pico 2 W edition

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

## ESP32-S3 touch edition (planned)

| Component | Configuration | File |
|---|---|---|
| Waveshare ESP32-S3-Touch-LCD-4 (controller, 4" touch LCD, charger, RS485, CAN) | ESP32 touch edition | [waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) |
| Espressif ESP32-S3 SoC / WROOM-1-N16R8 module | ESP32 touch edition | [espressif-esp32-s3.md](espressif-esp32-s3.md) |
| SparkFun NEO-F10N GNSS breakout | ESP32 touch edition (§10) | [sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) |
| u-blox ANN-MB5 antenna | ESP32 touch edition | [u-blox-ann-mb5-antenna.md](u-blox-ann-mb5-antenna.md) |
| Waveshare TTL TO RS485 (B) converter | ESP32 touch edition | [waveshare-ttl-to-rs485-b.md](waveshare-ttl-to-rs485-b.md) |
| Boat 12 V direct input protection | ESP32 touch edition | [marine-12v-direct-input-protection.md](marine-12v-direct-input-protection.md) |
| Protected 1S Li-ion/LiPo pack | ESP32 touch edition (§10) | [lipo-1s-protected-battery.md](lipo-1s-protected-battery.md) |
| Passives and general hardware | ESP32 touch edition | [passive-components-and-general-hardware.md](passive-components-and-general-hardware.md) |
| SparkFun Qwiic Buzzer | ESP32 optional external sounder on terminal I²C | [sparkfun-qwiic-buzzer.md](sparkfun-qwiic-buzzer.md) |
| Qwiic cables and connectors | ESP32 optional, only with a Qwiic accessory | [qwiic-cables-and-connectors.md](qwiic-cables-and-connectors.md) |
| SparkFun Large Piezo Alarm | ESP32 optional loud alarm (switching method open) | [sparkfun-large-piezo-alarm.md](sparkfun-large-piezo-alarm.md) |
| Logic-level N-MOSFET driver | ESP32 optional loud alarm (switching method open) | [logic-level-n-mosfet-driver.md](logic-level-n-mosfet-driver.md) |

## Open discrepancies with the build guide

The controller, display, GNSS and power conflicts formerly listed here have been reconciled with the build guide. The following design checks remain unverified or installation-dependent; they do not indicate a known documentation mismatch and are not grounds for silently changing a component value or claiming hardware validation.

- **ANN-MB5 supply margin:** measure antenna voltage and current at the SMA under load with the installed cable. The estimated voltage is close to the antenna's 3.0 V minimum, and current at this rail is not specified.
- **bq24074 termination behavior:** the stock termination resistor calculates to about 0.3 A at the 1 A setting, but charge completion on the selected battery is unmeasured. Verify the selected pack and charger configuration before relying on it.
- **Boat input transient protection:** the candidate converters are below the cited unsuppressed load-dump voltage. A TVS sized for short transients is not proof of protection against a sustained load dump. Confirm the vessel's alternator/battery protection or qualify additional series/pre-regulator protection for that installation.
- **ESP32 edition — VIN to battery hand-off:** on V4 the battery only reaches the 5 V rail while SYS_EN (CH32 EXIO5) or the PWR key holds the Q4 latch on. Measure the hand-off gap and check for brown-out resets with firmware asserting SYS_EN. See [waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) §4.1.
- **ESP32 edition — VIN rating:** the silkscreen says 7–36 V, but the V4 schematic and Waveshare's V4 reference say 5–36 V. The build guide and the component notes plan for 7–36 V until Waveshare confirms otherwise.
- **ESP32 edition — onboard input TVS:** the SMAJ40CA does not clamp below 40 V, which is above the 36 V rating. The external TVS, fuse and load-dump review in [marine-12v-direct-input-protection.md](marine-12v-direct-input-protection.md) are required, not optional.
- **ESP32 edition — charge current:** the V4 ETA6098 is set to 2 A fast charge, with no thermistor. The 4400 mAh Adafruit example pack is limited to 1 A charge. Choose a pack rated for ≥ 2 A charge, or rework R_ISET, and measure the real current. On V1–V3, confirm the SW6106 BSET value (4.2 V vs 4.35 V).
- **ESP32 edition — DO1:** the wiki lists a "DO1" expander output, but none of the four schematics routes it to the terminal, and V4 has no DO1 net. No external alarm output exists without an added I²C device.
- **ESP32 edition — GNSS interface:** the NEO-F10N has no I²C, so it connects through a TTL-to-RS485 converter. The direction of the converter's TTL pins, its turn-round time and its 3.3 V current are unverified.
- **ESP32 edition — boot-time UART output:** the ESP32-S3 UART0 default TX pin (GPIO43) is the RS485 receiver output on this board. Check boot behaviour with the console on USB-Serial-JTAG.
- **ESP32 edition — buzzer and backlight:** the onboard buzzer's sound level, the minimum stable backlight level, backlight current and direct-sun readability are all unpublished. Measure them before deciding the alarm and night-mode policy.
- **ESP32 edition — dark vs light background power:** the backlit IPS LCD is expected to draw nearly the same power on a black screen as on a white one (generic LCD figure 1–5 %). Measure white vs black full screen at the same backlight level before assuming any palette saving. See [waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) §5.1.
- **ESP32 edition — temperature:** the N16R8 module is rated to 65 °C ambient, and the LCD temperature range is unpublished. Log the enclosure temperature in its planned location.
- **ESP32 edition — V1–V3 I²C lock-up:** on SW6106 boards powered from VIN without a battery, the I²C bus can be held low. Prefer V4, or always fit a battery.
- **Prototype measurements:** retain every "unverified" or "measure" label in the component notes until measured on the assembled design. Code examples remain syntax-checked against stub headers only; none have run on hardware.

The separate [Step 1 display sample](../display-bring-up.md) has a real Pico SDK target build and host checks, but no hardware results.
