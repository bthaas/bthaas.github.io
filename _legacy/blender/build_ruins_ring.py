"""Procedurally build the scene-03 ruins ring.

Run with:
    blender --background --python-exit-code 1 --python scripts/build_ruins_ring.py
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

from mathutils import Vector

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    MeshAccumulator,
    append_arch_segment,
    append_box,
    append_cylinder,
    append_rounded_monolith,
    append_tetrahedral_fragment,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "ruins-ring.glb"
RANDOM_SEED = 30317


def place_on_ring(
    obj,
    angle: float,
    radius: float,
    height: float,
    tilt: tuple[float, float, float],
) -> None:
    obj.location = Vector((math.cos(angle) * radius, math.sin(angle) * radius, height))
    obj.rotation_euler = (
        math.radians(tilt[0]),
        math.radians(tilt[1]),
        angle + math.pi * 0.5 + math.radians(tilt[2]),
    )


def build_arch(index: int, material, rng: random.Random):
    accumulator = MeshAccumulator()
    width = 1.72 + rng.uniform(-0.06, 0.08)
    height = 2.78 + rng.uniform(-0.1, 0.12)
    spacing = width * 0.94
    for offset in (-spacing, 0.0, spacing):
        append_arch_segment(
            accumulator,
            center=Vector((offset, 0.0, -0.12 if abs(offset) > 0.1 else 0.0)),
            width=width,
            height=height,
            depth=0.52,
            segments=9,
        )
    append_box(
        accumulator,
        center=Vector((0.0, 0.0, height * 0.49)),
        size=Vector((spacing * 2 + width * 1.08, 0.64, 0.3)),
    )
    return create_mesh_object(f"ruin_arch_{index:02d}", accumulator, material, smooth=False)


def build_column(index: int, material, rng: random.Random):
    accumulator = MeshAccumulator()
    height = 3.3 + rng.uniform(-0.28, 0.22)
    radius = 0.37 + rng.uniform(-0.025, 0.035)
    append_cylinder(
        accumulator,
        center=Vector((0.0, 0.0, 0.0)),
        radius=radius,
        depth=height,
        segments=16,
        radial_wave=0.055,
        radial_frequency=8,
    )
    append_cylinder(
        accumulator,
        center=Vector((0.0, 0.0, -height * 0.5 - 0.11)),
        radius=radius * 1.28,
        depth=0.22,
        segments=12,
    )
    if index % 2:
        append_box(
            accumulator,
            center=Vector((0.0, 0.0, height * 0.5 + 0.14)),
            size=Vector((radius * 2.65, radius * 2.45, 0.28)),
        )
    return create_mesh_object(f"ruin_column_{index:02d}", accumulator, material, smooth=False)


def build_slab(index: int, material, rng: random.Random):
    accumulator = MeshAccumulator()
    append_box(
        accumulator,
        center=Vector((0.0, 0.0, 0.0)),
        size=Vector((3.55 + rng.uniform(-0.2, 0.2), 0.72, 0.66)),
    )
    append_box(
        accumulator,
        center=Vector((0.0, 0.0, 0.43)),
        size=Vector((3.8, 0.82, 0.22)),
    )
    return create_mesh_object(f"ruin_slab_{index:02d}", accumulator, material, smooth=False)


def build_fragment(index: int, material):
    accumulator = MeshAccumulator()
    append_rounded_monolith(
        accumulator,
        center=Vector((0.0, 0.0, 0.0)),
        width=1.6 if index == 1 else 1.25,
        height=2.2 if index == 1 else 1.75,
        depth=0.7,
        corner_radius=0.24,
    )
    append_tetrahedral_fragment(accumulator, Vector((0.54, 0.0, 0.74)), 0.28)
    return create_mesh_object(f"ruin_fragment_{index:02d}", accumulator, material, smooth=False)


def main() -> None:
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material()
    objects = []

    major_angles = [math.radians(value) for value in (12, 64, 112, 158, 208, 252, 302, 340)]
    for index in range(1, 5):
        obj = build_arch(index, material, rng)
        angle = major_angles[index - 1]
        place_on_ring(
            obj,
            angle,
            6.4 + rng.uniform(-0.35, 0.35),
            rng.uniform(-0.45, 0.85),
            (rng.uniform(-8, 8), rng.uniform(-11, 11), rng.uniform(-8, 8)),
        )
        objects.append(obj)

    for index in range(1, 5):
        obj = build_column(index, material, rng)
        angle = major_angles[index + 3]
        place_on_ring(
            obj,
            angle,
            5.15 + rng.uniform(-0.4, 0.5),
            rng.uniform(-0.9, 0.7),
            (rng.uniform(-18, 18), rng.uniform(-20, 20), rng.uniform(-12, 12)),
        )
        objects.append(obj)

    for index, degrees in enumerate((188, 286), start=1):
        obj = build_slab(index, material, rng)
        place_on_ring(
            obj,
            math.radians(degrees),
            4.8 + rng.uniform(-0.3, 0.3),
            rng.uniform(-1.0, 1.0),
            (rng.uniform(-12, 12), rng.uniform(-18, 18), rng.uniform(-10, 10)),
        )
        objects.append(obj)

    for index, degrees in enumerate((92, 225), start=1):
        obj = build_fragment(index, material)
        place_on_ring(
            obj,
            math.radians(degrees),
            4.45,
            -0.4 + index * 0.7,
            (rng.uniform(-15, 15), rng.uniform(-15, 15), rng.uniform(-10, 10)),
        )
        objects.append(obj)

    for index in range(1, 29):
        accumulator = MeshAccumulator()
        append_tetrahedral_fragment(accumulator, Vector((0.0, 0.0, 0.0)), 0.12 + rng.random() * 0.18)
        chip = create_mesh_object(f"ruin_chip_{index:02d}", accumulator, material, smooth=False)
        angle = rng.random() * math.tau
        radius = 4.0 + rng.random() * 2.8
        place_on_ring(
            chip,
            angle,
            radius,
            rng.uniform(-1.65, 1.65),
            (rng.uniform(-35, 35), rng.uniform(-35, 35), rng.uniform(-35, 35)),
        )
        objects.append(chip)

    stats = export_and_compress_glb(objects, OUTPUT_PATH)
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
