# Build Moorpheus step by step

Build the prototype in phases. First prove the Pico, toolchain and display on
their own; then add and check the rest of the hardware and firmware in stages.
The steps below follow the assembly and acceptance sequence in the
[full Moorpheus build guide](pico_2_w_anchor_alarm_build_guide_v2.md). That guide
is the detailed design reference; this page is the path through it.

## Step 1: Pico, toolchain and display

Connect only the Waveshare display to the Pico 2 W, build and flash the
standalone example, then confirm its USB diagnostics, power and visible output.
Do not add other peripherals until the on-device acceptance checks pass.

Read the [Step 1 display bring-up instructions](display-bring-up.md) for the
complete wiring, setup, build, flash and troubleshooting procedure. The example
source is in [`examples/display-hello/`](../examples/display-hello/).

## Later phases

Once Step 1 has passed on the bench, continue through the
[assembly and acceptance sequence in the full guide](pico_2_w_anchor_alarm_build_guide_v2.md#12-assembly-and-acceptance):

1. Build and verify the protected power distribution.
2. Add the fuel gauge and buzzer, then check their I2C connections.
3. Add the buttons and verify startup and control behavior.
4. Integrate the display driver and check that alarm processing continues during refresh.
5. Add GNSS and verify fix quality, age and antenna placement.
6. Add the DataHub interface and test connection loss and recovery.
7. Add standby scheduling and measure power consumption.
8. Exercise low-battery behavior and the fault-injection checks in the full guide.

These phases are planned, not completed or hardware-tested. The design is a
prototype, not a certified marine safety system.
