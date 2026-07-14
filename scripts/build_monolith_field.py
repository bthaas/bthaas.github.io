"""Procedurally build the scene-05 monolith field.

Run with:
    blender --background --python-exit-code 1 --python scripts/build_monolith_field.py
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
    append_rounded_monolith,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "monolith-field.glb"
RANDOM_SEED = 50543


def build_monolith(
    name: str,
    material,
    width: float,
    height: float,
    depth: float,
    corner_radius: float,
    position: tuple[float, float, float],
    yaw: float,
):
    accumulator = MeshAccumulator()
    append_rounded_monolith(
        accumulator,
        center=Vector((0.0, 0.0, 0.0)),
        width=width,
        height=height,
        depth=depth,
        corner_radius=corner_radius,
    )
    obj = create_mesh_object(name, accumulator, material, smooth=False)
    obj.location = Vector(position)
    obj.rotation_euler = (
        math.radians(-1.5 + yaw * 0.14),
        math.radians(yaw),
        math.radians(yaw * 0.18),
    )
    return obj


def main() -> None:
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material()
    objects = []

    interactive_layout = (
        (-3.25, -0.45, 0.2, 1.78, 5.85, -7.0),
        (0.0, -1.15, 0.55, 2.05, 6.65, 4.0),
        (3.45, 0.05, -0.05, 1.66, 5.35, 8.0),
    )
    for index, (x, y, z, width, height, yaw) in enumerate(interactive_layout, start=1):
        objects.append(
            build_monolith(
                f"monolith_{index:02d}",
                material,
                width,
                height,
                width * 0.36,
                width * (0.1 + index * 0.012),
                (x, y, z),
                yaw,
            )
        )

    decor_layout = (
        (-5.8, 2.6, -0.35),
        (-1.9, 3.55, -0.45),
        (1.65, 3.0, -0.25),
        (5.65, 2.65, -0.4),
        (-4.15, 5.35, -0.65),
        (4.0, 5.65, -0.75),
        (-0.8, 7.2, -0.9),
        (2.55, 8.0, -1.05),
    )
    for index, position in enumerate(decor_layout, start=1):
        width = 1.05 + rng.uniform(-0.12, 0.15)
        height = width * rng.uniform(2.85, 3.65)
        objects.append(
            build_monolith(
                f"monolith_decor_{index:02d}",
                material,
                width,
                height,
                width * rng.uniform(0.3, 0.4),
                width * rng.uniform(0.08, 0.18),
                position,
                rng.uniform(-9, 9),
            )
        )

    stats = export_and_compress_glb(objects, OUTPUT_PATH)
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
