# Waveshare TTL TO RS485 (B) isolated converter — datasheet & integration notes

> Part: Waveshare TTL TO RS485 (B), DIN-rail galvanically isolated TTL ↔ RS485 converter · Role in project: carries the NEO-F10N UART onto the board's RS485 terminal · Configuration: ESP32 touch edition only

## 1. Overview

The Waveshare ESP32-S3-Touch-LCD-4 has no free GPIO for a second UART. Its only external serial port is the half-duplex RS485 pair on terminal pins 3 (A) and 4 (B) ([waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) §3). The NEO-F10N speaks 3.3 V TTL UART only ([sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) §1). This converter sits next to the GNSS breakout. It turns the GNSS TTL UART into an RS485 A/B pair, which then runs to the board terminal.

The converter has an isolated power supply and isolated digital I/O, TVS surge protection, a resettable fuse, a switchable 120 Ω terminator and a DIN-rail ABS case [1][2]. In this design both ends share the board ground, so the isolation adds nothing electrically. The part was chosen for its case, its input protection and its 3.3 V TTL compatibility. Any 3.3 V TTL-to-RS485 module with automatic direction control would do the same job. See §7.

This is a planned part. Nothing has been bought, wired or tested.

## 2. Key specifications

| Parameter | Value | Source |
|---|---|---|
| Function | TTL ↔ RS485, half-duplex | [1] |
| Power supply | 3.3–5 V | [1] |
| TTL level | 3.3–5 V compatible | [1] |
| Power-side protection | Anti-reverse and anti-over-voltage circuit | [1] |
| Isolation | Onboard isolated power supply and digital isolation (isolation voltage not published — **unverified**) | [1] |
| RS485 protection | 600 W lightning/surge suppression, 15 kV ESD, resettable fuse and protection diodes | [1] |
| Termination | 120 Ω, switch selectable, default **on** | [1] |
| Baud rate | Up to 2 Mbaud per Waveshare FAQ | [1] |
| RS485 distance | About 1200 m; up to 32 nodes | [1] |
| TTL distance | About 10 m | [1] |
| Supply current | Waveshare FAQ: average about 54 mA, 0.285 W, at 5 V. At 3.3 V — **unverified, measure** | [1] |
| Connectors | Screw terminals | [1] |
| Case | ABS, 35 mm DIN rail | [1] |
| Dimensions | 91.6 × 58.7 × 23.3 mm | [1] |
| Direction control | Not stated. The TTL side has only TX/RX and no DE pin, which implies automatic direction control — **inferred, unverified** | [1] |
| Operating temperature | Not published on the wiki — **unverified** | [1] |

## 3. Pinout / connections

The wiki shows the terminal layout only as images [1]. Read the labels off the silkscreen of the unit you receive. The expected groups are:

| Side | Terminals (expected) | Notes |
|---|---|---|
| TTL (non-isolated) | VCC, GND, TXD, RXD | 3.3–5 V supply and logic |
| RS485 (isolated) | A+, B−, GND (isolated) | Isolated GND may be tied to system ground. The wiki notes this option [1] |
| Switch | 120R | Up = on, down = off [1] |

Waveshare does not say whether "TXD" on the TTL side is an input (connect to the device's TX) or an output. **Check on the bench** with a USB-TTL adapter before final wiring (§8).

## 4. Wiring in this project

Planned wiring. Not built.

| From | To | Notes |
|---|---|---|
| Board terminal 7 (I2C_VCC, 3V3 default) | Converter TTL VCC and NEO-F10N breakout 3V3 (J2-8) | Shared 3.3 V feed. See current budget in §5 |
| Board terminal 8 (GND) | Converter TTL GND and breakout GND (J2-9) | |
| Breakout TX (J2-6) | Converter TTL data **input** | GNSS → board direction. Pin name per bench check |
| Breakout RX (J2-5) | Converter TTL data **output** | Board → GNSS, used only for occasional UBX writes |
| Converter RS485 A+ | Board terminal 3 (A) | Twisted pair |
| Converter RS485 B− | Board terminal 4 (B) | |
| Converter RS485 GND | Board terminal 2 or 8 (GND) | Optional reference. Same ground anyway |
| Converter 120R switch | On (default) | Starting point. Board SW1 RS485 terminator off. See §7 |

```mermaid
flowchart LR
    NEO["NEO-F10N breakout TX/RX"] -->|"3.3 V TTL 38400 8N1"| CONV["TTL TO RS485 (B)"]
    CONV -->|"RS485 A/B twisted pair"| TERM["Board terminal 3 A / 4 B"]
    TERM --> SP["SP3485 on board"]
    SP -->|"RO to GPIO43"| ESP["ESP32-S3 UART RX"]
    V33["Board terminal 7 I2C_VCC 3V3"] --> NEO
    V33 --> CONV
```

## 5. Power requirements & consumption

| Item | Value | Source / status |
|---|---|---|
| Converter at 5 V | ≈ 54 mA average, 0.285 W | [1] Waveshare FAQ |
| Converter at 3.3 V | If power stays about 0.285 W, ≈ 85 mA — **estimate, measure** | Calculated from [1] |
| NEO-F10N + ANN-MB5 | ≈ 38–45 mA | [sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) §5, estimate |
| Total on I2C_VCC | ≈ 95–130 mA — **estimate, measure** | Sum of the above |

I2C_VCC is fed from the board 3V3 rail (MP1658 buck, "3A MAX") through a 0 Ω link [3]. The estimated load is small against that rating. The current rating of the terminal and the 0 Ω link is not published — **unverified**.

Most of the converter's draw is probably its isolated DC/DC converter. A non-isolated module would use less power. See §7.

## 6. Programming / configuration

No configuration. The converter passes bytes at any baud rate the two ends agree on [1]. In this project:

- ESP32-S3 UART on RX = GPIO43, TX = GPIO44, 38 400 8N1 (NEO-F10N default) [3][4].
- The NEO-F10N transmits continuously (UBX-NAV-PVT at 1 Hz after configuration). Because the link is half-duplex, the board must only transmit in the quiet gap after a NAV-PVT frame. Waiting is also necessary for the converter direction to turn round. A 100-byte NAV-PVT frame takes about 26 ms at 38 400 baud (**calculated**: 100 × 10 bits / 38 400).
- Pre-configure the receiver on the bench over the breakout USB-C before cutting its USB jumpers, and save to BBR and flash ([sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) §6 and §10). Runtime writes then become optional.

## 7. Design notes, limits & gotchas

- **Why RS485 at all.** The GNSS sits about 1 m from the board. RS485 is used only because it is the board's one external UART path, not for distance.
- **Isolation is not needed here.** Both sides share the board ground through I2C_VCC GND. A cheaper non-isolated 3.3 V auto-direction module (for example a MAX3485-class board) is a valid substitute. Check that it has automatic direction control and that its 3.3 V operation is specified.
- **Direction turn-round.** The converter must release the bus after the GNSS stops sending, so that the board can transmit. The turn-round time is not published — **unverified**. If UBX writes fail, configure on the bench and run listen-only.
- **Termination.** For a 1 m link at 38 400 baud, termination is not needed. Two 120 Ω terminators load the 3.3 V drivers more heavily. Leave the converter switch on and the board SW1 off as a starting point, then check the waveform on the bench. If no scope is available, choose the setting that gives zero UBX checksum errors over an hour.
- **Boot-time noise.** The ESP32-S3 ROM may print on GPIO43 at boot ([waveshare-esp32-s3-touch-lcd-4.md](waveshare-esp32-s3-touch-lcd-4.md) §7). The parser must discard bytes until it sees a valid UBX sync and checksum.
- **Size.** The DIN-rail case is larger than the GNSS breakout. Plan enclosure space or a short DIN rail.

## 8. Bring-up / test checklist

1. Supply 3.3 V from a bench supply. Measure the idle current and the current with data flowing.
2. Loop a USB-TTL adapter into the TTL side and a USB-RS485 adapter onto A/B. Confirm which TTL terminal is the input.
3. Connect to the board terminal. Run the GNSS at 38 400. Confirm NAV-PVT frames arrive with zero checksum errors over one hour.
4. Send UBX-MON-VER from the board in the gap after a NAV-PVT frame. Confirm a reply. If this fails, record it and fall back to listen-only operation.
5. Try both terminator settings and record the error counts.

## 9. References

1. Waveshare Wiki, "TTL TO RS485 (B)" (features, parameters, FAQ on baud rate and current) — https://www.waveshare.com/wiki/TTL_TO_RS485_(B)
2. Waveshare, "TTL TO RS485 (B)" product page — https://www.waveshare.com/ttl-to-rs485-b.htm
3. Waveshare, "ESP32-S3-Touch-LCD-4 V4.0" schematic — https://files.waveshare.com/wiki/ESP32-S3-Touch-LCD-4/ESP32-S3-Touch-LCD-4%20V4.0.pdf
4. Waveshare, `hardware/HARDWARE_REFERENCE.md` in waveshareteam/ESP32-S3-Touch-LCD-4 — https://github.com/waveshareteam/ESP32-S3-Touch-LCD-4/blob/main/hardware/HARDWARE_REFERENCE.md
