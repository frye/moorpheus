# Firmware stack recommendation

Research snapshot: 22 October 2026. This is design guidance for the Pico 2 W anchor alarm,
not a report of implemented or hardware-tested software. The project remains a prototype, not
a certified marine safety system.

The first implementation is the standalone [Step 1 display bring-up](display-bring-up.md):
a one-shot Hello application followed by a separate five-layout simulation.
Both build for Pico 2 W but have not run on hardware. Networking, alarm services
and the field-update design below are not implemented in either application.

## Recommendation

Use **C with Raspberry Pi Pico SDK 2.3.x**, a cooperative, non-blocking service loop, and
`pico_cyw43_arch_lwip_threadsafe_background`. Start without an RTOS; consider the SDK's
FreeRTOS option only if the service loop becomes difficult to maintain. Use the RP2350
bootrom's **A/B partitions with Try-Before-You-Buy (TBYB)** for field firmware updates, and
retain USB BOOTSEL/UF2 as the recovery path.

This matches build guide §8 and the Pico SDK C examples already in `docs/data/`. The SDK
provides the strongest fit for the required Wi-Fi, low-power APIs, flash operations, and
RP2350 update support. It also lets the Waveshare C driver be ported directly. It does not
provide memory safety, so keep core logic testable on a host, use bounded buffers, and avoid
runtime heap allocation where practical.

| Option | Assessment |
|---|---|
| **Pico SDK C** | Best-supported match for this board and its update mechanism. |
| **Rust / Embassy** | Credible alternative: `embassy-rp` and CYW43 support RP2350/Pico 2 W. However, the display driver must be ported, and low-power behavior and integration with bootrom TBYB need more qualification. |
| **MicroPython** | Useful for bench experiments, not recommended for the alarm loop or low-power behavior. |
| **Arduino-Pico** | Supports OTA, but its update flow does not provide the same automatic rollback after a bad application image; its documented basic authentication is weak. |
| **Zephyr** | Pico 2 W Wi-Fi support is relatively recent. Its additional framework complexity offers little benefit for this single-board design. |

## Design drivers

The local GNSS, position checks and sounder must continue even if Wi-Fi, the display or storage
is slow or faulty. The Spectra 6 display takes about 19 seconds to refresh, so display I/O
must be asynchronous from the alarm loop. A 4-bpp framebuffer is about 120 kB; RGB888 does not
fit in the Pico 2 W's 520 kB SRAM. The planned backup and emergency modes also need qualified
timer and GPIO wake behavior, not just a software delay.

These constraints favor a cooperative loop with bounded I/O and explicit state machines for
GNSS, alarm, power, buttons, display, networking and persistence. The watchdog timeout is
about 16.7 seconds—shorter than a display refresh—so keep feeding it during display waits.
Flash writes also stall code execution and CYW43 background work; keep them rare, bounded and
away from active alarm handling.

## Field update design

The RP2350 datasheet describes A/B image selection and TBYB. After a **flash-update reboot**,
the bootrom can try a new TBYB image under a 16.7-second watchdog window. The image must call
`explicit_buy()` to become the selected version. If it fails to do so, the chip reboots to
the previous image. Once confirmed, the bootrom erases the first sector of the other image,
so rollback is not retained after commitment. ROM signature enforcement applies only when
secure boot is enabled in OTP; a signed image alone is not enforced on an unsecured chip.

Raspberry Pi's `pico-examples/pico_w/wifi/ota_update` demonstrates this mechanism: it writes
UF2 blocks to the inactive partition, verifies chunks with SHA-256, and requests a flash-update
reboot. It calls `rom_explicit_buy()` immediately on startup, which is too early for
Moorpheus. Adapt it to run a short self-test before confirming the new image.

Suggested flow:

1. Upload from a phone or laptop over the local DataHub network. The device should not need
   internet access; keep a developer push tool as an alternative.
2. Accept updates only while disarmed and in a deliberate setup session. Authenticate
   configuration and update actions.
3. Write only to the inactive image. Verify the complete image's hash and an application-level
   signature before rebooting. Chunk hashes detect corruption, not who supplied the image.
   Bootrom signature enforcement would require a separate secure-boot decision and OTP
   provisioning.
4. During TBYB, check settings integrity and compatibility, confirm expected peripheral
   communication, and run a brief startup check. Do not start a full display refresh or erase
   settings before `explicit_buy()`. Confirm only when checks pass; otherwise allow watchdog
   rollback.
5. Keep settings outside both update partitions. Version the settings schema and preserve the
   anchor reference across updates.

**Important sizing constraint:** the upstream example reserves two 1744 kB application
partitions and two 256 kB Wi-Fi firmware partitions. At 4096 kB total, the listed sizes and
starts leave about 84 kB after the Wi-Fi partitions—enough in principle for two 4 kB settings
sectors. Confirm the board's flash size and the partition table's exact address map, then
explicitly reserve those sectors before adopting the layout. Do not assume the example's
table can be copied unchanged.

The 16.7-second TBYB window is shorter than the display's roughly 19-second refresh. Keep
the initial self-test short and defer a full refresh until after confirmation. Also, the
example's default UART output conflicts with GP0/GP1, assigned to GNSS; use USB for debugging.
Test interrupted uploads and power loss before relying on field updates.

## Implementation outline

- **Core logic:** host-testable C for geometry, alarm and mode state, UBX parsing, settings
  encoding, and display rendering.
- **Hardware layer:** Pico SDK UART, I2C, SPI, watchdog, low-power and safe flash wrappers,
  with explicit timeouts.
- **Services:** non-blocking state machines for GNSS, alarm, power, buttons, display,
  HTTP/WebSocket, and updates.
- **Boot and persistence:** validate settings on startup; use alternating, versioned settings
  records with CRC; make firmware and settings updates independently recoverable.
- **Build/release:** pin the SDK/toolchain, run host unit tests, and produce a USB UF2 plus a
  signed OTA artifact. Keep the signing key offline or in a protected release secret.

These are recommendations only. Power modes, display concurrency, GNSS behavior, update
recovery, and the final image/partition sizes all require prototype testing.

## Sources

1. Raspberry Pi, [Pico SDK 2.3.1 CYW43 architecture header](https://github.com/raspberrypi/pico-sdk/blob/2.3.1/src/rp2_common/pico_cyw43_arch/include/pico/cyw43_arch.h) and [SDK release notes](https://github.com/raspberrypi/pico-sdk/releases). The repository's [Pico 2 W reference](data/raspberry-pi-pico-2-w.md) records the low-power API, flash behavior, board settings and update tools.
2. Raspberry Pi, [RP2350 datasheet](https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf), §5.1.16–5.1.17 and §5.4.8.4 (flash-update boot, TBYB, and `explicit_buy()`).
3. Raspberry Pi, [Pico W OTA update example](https://github.com/raspberrypi/pico-examples/tree/master/pico_w/wifi/ota_update), including its README, partition table, CMake configuration and implementation.
4. Embassy, [`cyw43` documentation](https://docs.embassy.dev/cyw43/git/default/index.html) and [`embassy-rp`](https://github.com/embassy-rs/embassy/tree/main/embassy-rp).
5. Earle Philhower, [Arduino-Pico OTA documentation](https://arduino-pico.readthedocs.io/en/latest/ota.html).
6. Zephyr, [Pico W Wi-Fi sample](https://docs.zephyrproject.org/latest/samples/boards/raspberrypi/pico_w_wifi_led/README.html); Golioth, [Pico 2 W Zephyr guide](https://blog.golioth.io/building-zephyr-for-the-raspberry-pi-pico2-w/) (secondary source).
7. MicroPython, [Pico 2 W firmware](https://micropython.org/download/RPI_PICO2_W/) and [CYW43/lightsleep discussion](https://github.com/orgs/micropython/discussions/10889) (discussion, not a hardware qualification).
8. Moorpheus, [Pico 2 W build guide](pico_2_w_anchor_alarm_build_guide_v2.md) and component references in [`docs/data/`](data/README.md), especially the [Waveshare display notes](data/waveshare-4in-epaper-hat-plus-e.md).
