"""Embed checked-in packed frames in read-only C data; no browser dependencies."""

import hashlib
import json
import pathlib
import sys

CONCEPTS = ("watch", "big", "grid", "swing", "ledger")


def embed(source, output):
    manifest = json.loads((source / "manifest.json").read_text())
    if (manifest["width"], manifest["height"], manifest["rotation"]) != (
        400, 600, "clockwise"
    ):
        raise ValueError("Unexpected asset geometry")
    if [entry["id"] for entry in manifest["frames"]] != list(CONCEPTS):
        raise ValueError("Unexpected page order")
    frames = []
    for concept, entry in zip(CONCEPTS, manifest["frames"]):
        frame = (source / f"{concept}.bin").read_bytes()
        if len(frame) != 120000 or entry["bytes"] != len(frame):
            raise ValueError(f"Wrong frame size: {concept}")
        if hashlib.sha256(frame).hexdigest() != entry["sha256"]:
            raise ValueError(f"Asset checksum mismatch: {concept}")
        if any(byte >> 4 not in (0, 1, 2, 3, 5, 6) or
               byte & 15 not in (0, 1, 2, 3, 5, 6) for byte in frame):
            raise ValueError(f"Invalid controller colour: {concept}")
        frames.append(frame)
    with output.open("w") as target:
        target.write("#include <stdint.h>\nconst uint8_t layout_frames[5][120000] = {\n")
        for frame in frames:
            target.write("{\n")
            for offset in range(0, len(frame), 32):
                target.write(",".join(f"0x{byte:02x}" for byte in frame[offset:offset + 32]))
                target.write(",\n")
            target.write("},\n")
        target.write("};\n")


if __name__ == "__main__":
    embed(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
