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

The controller, display, GNSS and power conflicts formerly listed here have been reconciled with the build guide. The following design checks remain unverified or installation-dependent; they do not indicate a known documentation mismatch and are not grounds for silently changing a component value or claiming hardware validation.

- **ANN-MB5 supply margin:** measure antenna voltage and current at the SMA under load with the installed cable. The estimated voltage is close to the antenna's 3.0 V minimum, and current at this rail is not specified.
- **bq24074 termination behavior:** the stock termination resistor calculates to about 0.3 A at the 1 A setting, but charge completion on the selected battery is unmeasured. Verify the selected pack and charger configuration before relying on it.
- **Boat input transient protection:** the candidate converters are below the cited unsuppressed load-dump voltage. A TVS sized for short transients is not proof of protection against a sustained load dump. Confirm the vessel's alternator/battery protection or qualify additional series/pre-regulator protection for that installation.
- **Prototype measurements:** retain every "unverified" or "measure" label in the component notes until measured on the assembled design. Code examples remain syntax-checked against stub headers only; none have run on hardware.
