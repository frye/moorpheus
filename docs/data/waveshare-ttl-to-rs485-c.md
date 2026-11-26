# Waveshare TTL TO RS485 (C) isolated converter board — datasheet & integration notes

> Part: Waveshare TTL TO RS485 (C), bare-board galvanically isolated TTL ↔ RS485 converter · Role in project: optional in-box alternative to the TTL TO RS485 (B) for carrying the NEO-F10N UART onto the board's RS485 terminal · Configuration: ESP32 touch edition only, optional

## 1. Overview

The (C) does the same job as the DIN-rail [TTL TO RS485 (B)](waveshare-ttl-to-rs485-b.md): it turns the NEO-F10N's 3.3 V TTL UART into an RS485 A/B pair for the board's only external serial port. It has the same connections, so it is a drop-in replacement with unchanged wiring. The difference is packaging: it is a small bare board with no case, which fits inside the display enclosure instead of on a DIN rail [1][2].

Like the (B), it has an isolated power supply, digital isolation, TVS surge protection, a resettable fuse and a 120 Ω terminator [1][2]. In this design both ends share the board ground, so the isolation adds nothing electrically (§7).

This is a planned option. Nothing has been bought, wired or tested. The (B) stays the baseline in the build guide.

## 2. Key specifications

| Parameter | Value | Source |
|---|---|---|
| Function | TTL ↔ RS485, half-duplex | [1] |
| Power supply | 3.3–5 V | [1][2] |
| TTL level | 3.3–5 V compatible | [1] |
| Power-side protection | Over-voltage protection | [1][2] |
| Isolation | Onboard isolated power supply and digital isolation (isolation voltage not published — **unverified**) | [1][2] |
| RS485 protection | 200 W lightning/surge suppression, 6 kV ESD, resettable fuse and protection diodes | [1][2] |
| Termination | 120 Ω, enabled by soldering. A test note on the wiki also mentions a switch that is on by default, which appears to be copied from another product — **check the board** | [1] |
| Baud rate | Tested stable up to 2 Mbaud per Waveshare FAQ | [1] |
| RS485 distance | About 1200 m; up to 32 nodes | [1] |
| Supply current | Not published — **measure** | [1] |
| Connectors | Screw terminals per the wiki; castellated holes per the product page | [1][2] |
| Indicators | PWR, TXD and RXD LEDs | [1] |
| Dimensions | 42.8 × 15.2 × 4.75 mm | [1][2] |
| Direction control | Not stated. The TTL side has only TX/RX and no DE pin, which implies automatic direction control — **inferred, unverified** | [1] |
| Operating temperature | Not published — **unverified** | [1] |

For comparison, the (B) is 91.6 × 58.7 × 23.3 mm in a DIN-rail case with 600 W surge and 15 kV ESD protection ([waveshare-ttl-to-rs485-b.md](waveshare-ttl-to-rs485-b.md) §2).

## 3. Pinout / connections

From the wiki's interface table [1]:

| Side | Connections | Notes |
|---|---|---|
| TTL (left and right sides) | VCC (3.3–5 V), GND, TXD (transmitting pin), RXD (receiving pin) | Same signals as the (B) |
| RS485 | A+, B−, RS485 signal ground | Signal ground may be tied to system ground [1] |
| Terminator | 120 Ω solder jumper | See §2 |

Waveshare labels TXD as the "TTL signal transmitting pin" and RXD as the "TTL signal receiving pin" [1]. Whether those names are from the converter's or the host's point of view is not stated. **Check on the bench** with a USB-TTL adapter before final wiring (§8), as for the (B).

## 4. Wiring in this project

Planned wiring. Not built. It is the same as the (B): see [waveshare-ttl-to-rs485-b.md](waveshare-ttl-to-rs485-b.md) §4 and [sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) §10.3.

| From | To | Notes |
|---|---|---|
| Board terminal 7 (I2C_VCC, 3V3 default) | Converter VCC and NEO-F10N breakout 3V3 (J2-8) | Shared 3.3 V feed |
| Board terminal 8 (GND) | Converter GND and breakout GND (J2-9) | |
| Breakout TX (J2-6) | Converter TTL data **input** | Pin name per bench check |
| Breakout RX (J2-5) | Converter TTL data **output** | Used only for occasional UBX writes |
| Converter A+ | Board terminal 3 (A) | Short twisted pair inside the enclosure |
| Converter B− | Board terminal 4 (B) | |
| Converter RS485 signal ground | Board terminal 2 or 8 (GND) | Tie it. The board's SP3485 needs the A/B pair within its common-mode range of the board ground ([sparkfun-neo-f10n-gnss.md](sparkfun-neo-f10n-gnss.md) §10.2) |
| Converter 120 Ω jumper | As received; check | See §7 |

```mermaid
flowchart LR
    NEO["NEO-F10N breakout TX/RX"] -->|"3.3 V TTL 38400 8N1"| CONV["TTL TO RS485 (C) inside enclosure"]
    CONV -->|"short RS485 A/B pair"| TERM["Board terminal 3 A / 4 B"]
    TERM --> SP["SP3485 on board"]
    SP -->|"RO to GPIO43"| ESP["ESP32-S3 UART RX"]
    V33["Board terminal 7 I2C_VCC 3V3"] --> NEO
    V33 --> CONV
```

### Mounting

- Mount the board on a small carrier or perfboard with standoffs, or in a printed clip. Don't leave it hanging on its wires.
- Give every lead strain relief before the screw terminals or solder joints.
- Keep it away from the GNSS antenna lead and the board's backlight supply where you can. The isolated DC/DC converter switches internally and may add noise near the receiver (**unverified**).
- Leave the LEDs visible if possible; they help during bring-up.

## 5. Power requirements & consumption

| Item | Value | Source / status |
|---|---|---|
| Converter | Not published — **measure** at 3.3 V idle and with data | [1] |
| (B) for reference | ≈ 54 mA average at 5 V, about 85 mA at 3.3 V if power stays the same (estimate) | [waveshare-ttl-to-rs485-b.md](waveshare-ttl-to-rs485-b.md) §5 |

Until measured, budget the same as the (B). Most of the draw is probably the isolated DC/DC converter.

## 6. Programming / configuration

None. Same as the (B): ESP32-S3 UART on GPIO43/44, 38 400 8N1, half-duplex writes only in the gap after a NAV-PVT frame ([waveshare-ttl-to-rs485-b.md](waveshare-ttl-to-rs485-b.md) §6).

## 7. Design notes, limits & gotchas

- **Drop-in for the (B).** Same signals, same wiring, same firmware. Choose by packaging.
- **Weaker protection.** 200 W surge and 6 kV ESD against the (B)'s 600 W and 15 kV [1][2]. Inside the enclosure, on a short link to the board terminal, that matters less than on an external cable.
- **Isolation is not used.** Both ends share the board ground, so tie the RS485 signal ground to board ground. Isolation would only help if the GNSS and converter were moved away from the display, for example up a mast.
- **Termination.** For a short in-box link at 38 400 baud, termination is not needed. Check whether the jumper is fitted on arrival. Start with it open and the board SW1 off, then follow the error-count test in §8.
- **No case.** Insulate it from the enclosure and other boards; the castellated edges and screw terminals are exposed.
- **Direction turn-round and boot-time noise** are the same as for the (B) ([waveshare-ttl-to-rs485-b.md](waveshare-ttl-to-rs485-b.md) §7).

## 8. Bring-up / test checklist

1. Check the 120 Ω jumper state and record it.
2. Supply 3.3 V from a bench supply. Measure the idle current and the current with data flowing.
3. Loop a USB-TTL adapter into the TTL side and a USB-RS485 adapter onto A/B. Confirm which TTL pin is the input.
4. Connect to the board terminal inside the enclosure. Run the GNSS at 38 400. Confirm NAV-PVT frames arrive with zero checksum errors over one hour, with the backlight at full and at its lowest level.
5. Send UBX-MON-VER from the board in the gap after a NAV-PVT frame. Confirm a reply, or fall back to listen-only operation.
6. Compare GNSS satellite count and C/N0 with the converter powered and unpowered, to check for noise from its DC/DC converter.

## 9. References

1. Waveshare Wiki, "TTL TO RS485 (C)" (features, parameters, interface table, FAQ) — https://www.waveshare.com/wiki/TTL_TO_RS485_(C)
2. Waveshare, "TTL TO RS485 (C)" product page — https://www.waveshare.com/ttl-to-rs485-c.htm
