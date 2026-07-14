"""Procedurally build the scene-04 vertical stair timeline.

Run with:
    blender --background --python-exit-code 1 --python scripts/build_stair_timeline.py
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
    append_stair_run,
    append_tetrahedral_fragment,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "stair-timeline.glb"
RANDOM_SEED = 40429


def build_landing(index: int, material, rng: random.Random):
    accumulator = MeshAccumulator()
    step_count = 18 + index
    tread_depth = 0.25
    riser_height = 0.16
    stair_length = step_count * tread_depth
    append_stair_run(
        accumulator,
        origin=Vector((-stair_length * 0.5, 0.0, -step_count * riser_height * 0.5)),
        step_count=step_count,
        width=2.35,
        tread_depth=tread_depth,
        riser_height=riser_height,
    )
    append_box(
        accumulator,
        center=Vector((stair_length * 0.5 + 0.72, 0.0, step_count * riser_height * 0.5 - 0.12)),
        size=Vector((1.48, 2.85, 0.32)),
    )
    append_arch_segment(
        accumulator,
        center=Vector((stair_length * 0.5 + 0.72, 0.0, step_count * riser_height * 0.5 - 1.85)),
        width=2.55,
        height=3.45,
        depth=0.62,
        segments=8,
    )
    append_cylinder(
        accumulator,
        center=Vector((stair_length * 0.5 + 1.72, 0.0, -0.2)),
        radius=0.34,
        depth=3.65,
        segments=14,
        radial_wave=0.045,
        radial_frequency=7,
    )
    obj = create_mesh_object(f"stair_landing_{index:02d}", accumulator, material, smooth=False)
    obj.location = Vector(
        (
            -1.5 if index % 2 else 1.5,
            (index - 2.5) * 0.4,
            5.15 - (index - 1) * 3.45,
        )
    )
    obj.rotation_euler = (
        math.radians(rng.uniform(-3, 3)),
        math.radians(rng.uniform(-8, 8)),
        math.pi if index % 2 == 0 else 0.0,
    )
    return obj


def build_facade(material):
    accumulator = MeshAccumulator()
    append_arch_segment(
        accumulator,
        center=Vector((0.0, 0.0, -0.45)),
        width=5.2,
        height=5.6,
        depth=0.76,
        segments=12,
    )
    append_box(
        accumulator,
        center=Vector((0.0, 0.0, 2.32)),
        size=Vector((5.8, 0.9, 0.52)),
    )
    append_box(
        accumulator,
        center=Vector((0.0, 0.0, 2.72)),
        size=Vector((4.5, 0.82, 0.28)),
    )
    facade = create_mesh_object("temple_facade_01", accumulator, material, smooth=False)
    facade.location = Vector((2.3, 1.85, -0.5))
    facade.rotation_euler = (math.radians(-4), math.radians(7), math.radians(-9))
    return facade


def main() -> None:
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material()
    objects = [build_landing(index, material, rng) for index in range(1, 5)]
    objects.append(build_facade(material))

    for index in range(1, 21):
        accumulator = MeshAccumulator()
        append_tetrahedral_fragment(accumulator, Vector((0.0, 0.0, 0.0)), 0.13 + rng.random() * 0.21)
        chip = create_mesh_object(f"stair_chip_{index:02d}", accumulator, material, smooth=False)
        band = (index - 1) % 4
        chip.location = Vector(
            (
                rng.uniform(-4.5, 4.5),
                rng.uniform(-1.5, 2.3),
                5.1 - band * 3.45 + rng.uniform(-1.35, 1.35),
            )
        )
        chip.rotation_euler = tuple(math.radians(rng.uniform(-45, 45)) for _ in range(3))
        objects.append(chip)

    stats = export_and_compress_glb(objects, OUTPUT_PATH)
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
