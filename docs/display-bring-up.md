# Step 1: bring up the Pico, toolchain and display

Start the Moorpheus build here, before adding any other peripherals. This step
checks that you can compile for the **Raspberry Pi Pico 2 W**, flash it over USB,
and drive the **Waveshare 4inch e-Paper HAT+ (E), SKU 27367**. Other Waveshare
models need different drivers. [1][2]

The sample writes **Hello Moorpheus** in black on a white background. It clears
the image in software and sends it in **one full refresh**; there is no separate
blank-screen refresh. It then sleeps and powers down the display. The picture
remains after power is removed, so a picture alone does not prove the Pico is
still running. [2]

This is the foundation for later build phases, not anchor-alarm firmware. There
is no GNSS, sounder, Wi-Fi, battery management or drag detection. Moorpheus remains
an unqualified prototype, not a certified marine safety system.

## What you need

- A Pico 2 W with soldered headers, or another secure way to connect its pads.
- The exact E-model HAT and its nine-pin GH1.25 interface cable. Check whether
  your cable needs a breakout or adapters to reach a breadboard; its far-end
  connector and wire colours have not been verified. [2]
- A breadboard, jumper wires, a 100 kohm resistor for CS, and a multimeter. [2]
- A USB **data** cable for the Pico's micro-USB socket and a computer. [1]
- Git, CMake, a Make or Ninja build tool, Python 3, and an Arm bare-metal GCC
  toolchain providing `arm-none-eabi-gcc`, `g++`, `objcopy` and `size`.
  A native C/C++ compiler is also needed if the SDK must build its `picotool`
  helper; the host checks below need a native C compiler.

Use the [Raspberry Pi Pico setup instructions][4] or the [Pico VS Code
extension][5] to obtain the SDK and tools. This sample uses **Pico SDK 2.3.x**;
the reproducible commands below select **2.3.0**. For a manual compiler install,
use the **arm-none-eabi** package for your computer from [Arm][6], not the Linux
application toolchain named `aarch64-none-linux-gnu`.

## Connect only the display

Unplug USB before wiring. Leave the boat supply, battery, charger, buck converter
and all other peripherals disconnected. Do not plug the HAT's 40-pin connector
onto the Pico.

For this step only, **Pico 3V3 OUT powers the display**. The isolated display's
documented inrush is about 65.4 mA maximum at the panel; Raspberry Pi recommends
keeping external load on 3V3 OUT below 300 mA, depending on Pico load and VSYS.
This is not a measured whole-board current budget. [1][2]

The full alarm uses a separate rail, PERIPH3V3. **Never join that external
regulator output to Pico 3V3 OUT.** Move the display supply to the full build's
power distribution only in a later phase. [1][3]

Physical pin numbers below refer to the **Pico**, not the HAT's 40-pin header.
With the Pico viewed from the component side and USB at the top, pin 1 (GP0) is
at the top left. Confirm against the official pinout before connecting. [1]
Identify each HAT cable lead by its signal label/connector position and continuity
with power removed, not by colour. [2]

| HAT nine-pin connector P2 | Signal | Pico connection | Pico physical pin |
|---|---|---|---|
| 1 | VCC | 3V3 OUT | 36 |
| 2 | GND | GND | 13 |
| 3 | DIN | GP11, SPI1 MOSI/TX | 15 |
| 4 | CLK | GP10, SPI1 SCK | 14 |
| 5 | CS | GP9, software chip select | 12 |
| 6 | DC | GP8 | 11 |
| 7 | RST | GP12 | 16 |
| 8 | BUSY | GP13, input | 17 |
| 9 | PWR | GP14 | 19 |

Add **100 kohm between CS and Pico 3V3 OUT**. This follows the display reference's
TXB0108 guidance, overriding the older 10 kohm CS recommendation in the main
guide. All signals and VCC in this setup are 3.3 V; **do not use VBUS/pin 40
for display VCC**. No MISO connection is needed. [1][2]

Before applying power:

1. Confirm J2/BS0 is at **0/GND**, selecting four-wire SPI with DC. Confirm
   **R7 is not fitted**, allowing GP14 to switch the board off. Factory settings
   are unverified; inspect your board. [2]
2. Check every connection and confirm VCC and GND are not shorted. Keep the
   unused 40-pin HAT header insulated: its nominal "5 V" pins are connected to
   the same VCC net as the nine-pin cable. [2]
3. Hold BOOTSEL while connecting USB so that any previous application does not
   run. Check display VCC is approximately 3.3 V. [1][2]
4. The HAT has its own LDO, which operates in dropout with this supply. During
   the first update, check its panel-side 3V3_OUT (for example at C27, identified
   from the schematic) is **at least 2.5 V and no more than 3.6 V**. Do not
   confuse this test point with Pico 3V3 OUT. If it is outside that range, stop
   and investigate; do not switch to 5 V with the existing signal wiring. [2]

Avoid shorting adjacent test points with a probe. Keep the panel indoors, within
its documented 0-50 degrees C operating range, and protect its fragile ribbon
cable. [2]

## Build the sample

Run these commands from the repository root after installing the tools. Put the
SDK **outside the repository**; the path below is an example you can change.
If your Pico tooling already installed SDK 2.3.x, set `PICO_SDK_PATH` to that
checkout instead and skip cloning it.

```sh
git clone --branch 2.3.0 --depth 1 https://github.com/raspberrypi/pico-sdk.git "$HOME/pico-sdk-2.3.0"
git -C "$HOME/pico-sdk-2.3.0" submodule update --init --depth 1 lib/tinyusb
export PICO_SDK_PATH="$HOME/pico-sdk-2.3.0"
```

Check the command-line tools, then configure and build:

```sh
arm-none-eabi-gcc --version
cmake --version
python3 --version
cmake -S examples/display-hello -B examples/display-hello/build -DPICO_BOARD=pico2_w
cmake --build examples/display-hello/build --parallel 4
```

If the compiler is not on PATH, append
`-DPICO_TOOLCHAIN_PATH=/absolute/path/to/arm-toolchain` to the configure command;
use the installation directory containing `bin/arm-none-eabi-gcc`. On Windows,
use your SDK terminal/PowerShell and set `$env:PICO_SDK_PATH` instead of `export`;
choose an installed generator such as `-G Ninja` when configuring. Do not reuse
a build directory configured with a different compiler or generator.

The output to flash is:

```text
examples/display-hello/build/display_hello.uf2
```

The CMake target explicitly selects `pico2_w`, USB diagnostics, and SPI1. It does
not initialize the radio or use GP0/GP1 for UART diagnostics. [1]
The first build may download the SDK's matching `picotool` build helper, so it
needs internet access even though the finished device does not.
Warnings about missing BLE, CYW43 or lwIP submodules are expected with this
minimal SDK setup: this sample needs TinyUSB, not wireless support.

## Flash and observe

1. Allow **at least 180 seconds since the last refresh** before running again.
   This applies to reflashing, reset and power cycling too. The sample has no
   persistent clock and cannot enforce that interval across reboots. [2]
2. With wiring checked, hold **BOOTSEL**, connect USB, then release BOOTSEL.
   The Pico should appear as the **RP2350** USB drive. Copy
   `display_hello.uf2` onto that drive; it should reboot into the sample. No
   external programmer or `picotool` command is needed for this step. [4]
3. Open its USB serial port at 115200 baud using your serial terminal. Typical
   names are `/dev/tty.usbmodem*` on macOS, `/dev/ttyACM*` on Linux, or a COM port
   on Windows. USB CDC does not depend on the selected baud rate.
4. Watch for the updating message. The panel will flicker during a full refresh,
   documented as roughly **19 seconds**, then show `Hello Moorpheus` centered
   in its native portrait orientation on white. The driver allows up to
   **60 seconds** for the refresh BUSY wait; this is a project timeout, not a
   measured panel guarantee. [2]
5. The terminal should report
   `Update sequence complete; display powered down. Check the image.`
   Confirm the actual picture as well: the write-only interface cannot verify
   pixels. The result repeats every five seconds so opening the terminal late
   does not require resetting the Pico.

There is **one update per boot**, no automatic retries and no periodic refresh
loop. The display receives POWER_OFF, DEEP_SLEEP, then PWR low. Signal outputs
are made safe on normal shutdown or a timeout; a fault stays visible on USB
until reset. The Pico remains awake to report diagnostics; this is not a
low-power firmware demonstration.

Waveshare recommends at least one refresh every 24 hours while in use, and a
white clear before long storage. This one-shot sample does not provide that
maintenance schedule or a white-only storage mode. Do not leave it running as
an unattended display application. [2]

## Step 1 acceptance gate

Do not add the next peripheral until you have recorded these results for your
own setup:

| Check | Evidence to keep |
|---|---|
| Toolchain and board target | SDK/compiler versions; successful build; generated UF2 |
| Pico boot and USB | BOOTSEL drive appears; firmware boots; terminal reports completion, not a fault |
| Wiring and supply | Board revision, checked nine-wire mapping and measured panel-side voltage during refresh |
| Display output | Photograph of readable `Hello Moorpheus` on white, with no unexpected rotation or corruption |
| Shutdown | GP14 goes low after completion and the picture stays with USB disconnected |

Passing these checks establishes the Pico/toolchain/display baseline only.
Keep the source and wiring record as the starting point for subsequent phases.
Keep the same display GPIO allocation when adding power distribution, GNSS,
buttons, sounder and networking through the [main build sequence](pico_2_w_anchor_alarm_build_guide_v2.md#12-assembly-and-acceptance).
Recheck this screen after each addition. Before introducing external power,
disconnect the bench VCC lead from Pico 3V3 OUT and follow the main guide's
rail-isolation rules; do not simply add another supply to this breadboard.

## Troubleshooting

| Symptom | First checks |
|---|---|
| No BOOTSEL drive | Use a data cable, hold BOOTSEL while connecting, and check USB power |
| Compiler/SDK not found | Check `PICO_SDK_PATH`, SDK version and compiler PATH or `PICO_TOOLCHAIN_PATH` |
| Missing USB/TinyUSB build support | Initialize the SDK's `lib/tinyusb` submodule, then reconfigure |
| USB fault: BUSY timeout | Unplug power; check exact E-model, BUSY lead/polarity, PWR, RST, BS0, R7 and panel supply |
| USB fault: SPI timeout | Check toolchain/target configuration; the SPI peripheral did not complete, not necessarily a cable fault |
| Completion but no new picture | Check DIN/CLK/CS/DC, cable orientation and panel voltage; SPI has no display acknowledgement |
| Corrupted/rotated picture | Confirm native 400-by-600 addressing, correct model and solid short wiring; this sample is portrait, not the landscape mockups |

Never enable Pico internal pulls on BUSY: the board's TXB0108 translator needs
weak or absent external pulls. A disconnected BUSY wire can float high; a
successful software sequence alone is not a wiring test. [2]

## Development checks and evidence

Host checks do not need the Pico SDK:

```sh
cmake -S examples/display-hello/tests -B examples/display-hello/build-host
cmake --build examples/display-hello/build-host
ctest --test-dir examples/display-hello/build-host --output-on-failure
```

They check the full message bitmap, white background, packed pixels, row bounds,
120,000-byte frame transmission, command order, one refresh, safe shutdown and
stuck BUSY/SPI timeout paths using simulated hardware. They cannot establish
electrical behaviour or visible image quality.

These host checks passed, and a real Pico 2 W target build with **SDK 2.3.0 and
Arm GCC 14.3.1** produced `display_hello.uf2`. No hardware acceptance results
are available yet; the Step 1 gate above remains to be completed on your bench.

The driver uses a cooperative state machine, a fixed 200-byte row buffer, SPI
mode 0 at 4 MHz, and the vendor's per-byte CS framing. BUSY is **low while busy**.
Reset and refresh sequencing come from the E-model driver cited in [2]; the
one-millisecond SPI-byte and two-second non-refresh BUSY deadlines are project
choices. No application heap allocation or watchdog is used in this bench sample.

## Sources

1. [Pico 2 W reference](data/raspberry-pi-pico-2-w.md), including the
   [official datasheet](https://pip.raspberrypi.com/documents/RP-008304-DS).
2. [Waveshare E-model reference](data/waveshare-4in-epaper-hat-plus-e.md),
   especially connector/wiring, command sequence, translator and refresh limits,
   and its linked manufacturer datasheet, schematic and
   [C driver](https://github.com/waveshareteam/e-Paper/blob/master/E-paper_Separate_Program/4inch_e-Paper_E/RaspberryPi_JetsonNano/c/lib/e-Paper/EPD_4in0e.c).
   The adapted sequence retains its [vendor license](../examples/display-hello/WAVESHARE-LICENSE.txt).
3. [Main build guide](pico_2_w_anchor_alarm_build_guide_v2.md), sections 5 and 6;
   [open discrepancies](data/README.md#open-discrepancies-with-the-build-guide)
   override older values.

[4]: https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html
[5]: https://github.com/raspberrypi/pico-vscode
[6]: https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads
