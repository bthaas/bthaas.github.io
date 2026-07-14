"""Build the reference-driven scene-05 polished monolith field.

Run the accepted build with:
    blender --background --python-exit-code 1 --python scripts/build_monoliths.py

Pass ``-- 1``, ``-- 2``, or ``-- 3`` to reproduce the three comparison passes.
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
    CompressionBudget,
    MeshAccumulator,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "monolith-field.glb"
RANDOM_SEED = 50543
WEB_BUDGET = CompressionBudget(
    max_bytes=int(2.5 * 1024 * 1024),
    max_triangles=120_000,
)

PROFILES = {
    "rounded": (
        (-0.42, -0.5),
        (0.42, -0.5),
        (0.49, -0.46),
        (0.5, 0.32),
        (0.46, 0.41),
        (0.34, 0.48),
        (0.18, 0.5),
        (-0.18, 0.5),
        (-0.34, 0.48),
        (-0.46, 0.41),
        (-0.5, 0.32),
        (-0.49, -0.46),
    ),
    "chipped": (
        (-0.42, -0.5),
        (0.42, -0.5),
        (0.5, -0.44),
        (0.5, 0.28),
        (0.36, 0.46),
        (0.2, 0.5),
        (-0.3, 0.5),
        (-0.49, 0.33),
        (-0.5, -0.43),
    ),
    "asymmetric": (
        (-0.42, -0.5),
        (0.42, -0.5),
        (0.5, -0.44),
        (0.5, 0.38),
        (0.42, 0.47),
        (0.22, 0.5),
        (-0.28, 0.47),
        (-0.44, 0.38),
        (-0.5, 0.22),
        (-0.5, -0.44),
    ),
}


def parse_iteration() -> int:
    if "--" not in sys.argv:
        return 3
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    if not arguments:
        return 3
    iteration = int(arguments[0])
    if iteration not in (1, 2, 3):
        raise ValueError("Monolith iteration must be 1, 2, or 3")
    return iteration


def append_polished_monolith(
    accumulator: MeshAccumulator,
    profile_name: str,
    width: float,
    height: float,
    depth: float,
    bevel: float,
    rng: random.Random,
    surface_noise: float,
) -> None:
    profile = PROFILES[profile_name]
    layer_count = 4
    inset_x = max(0.86, 1.0 - bevel / width)
    inset_z = max(0.9, 1.0 - bevel / height)
    layers = (
        (-depth * 0.5, inset_x, inset_z),
        (-depth * 0.5 + bevel, 1.0, 1.0),
        (depth * 0.5 - bevel, 1.0, 1.0),
        (depth * 0.5, inset_x, inset_z),
    )
    vertices = []
    for layer_index, (y, scale_x, scale_z) in enumerate(layers):
        for point_index, (x, z) in enumerate(profile):
            edge_noise = 0.0
            if layer_index in (1, 2) and point_index % 3 == 0:
                edge_noise = rng.uniform(-surface_noise, surface_noise)
            vertices.append(
                Vector(
                    (
                        x * width * scale_x,
                        y + edge_noise,
                        z * height * scale_z,
                    )
                )
            )
    profile_count = len(profile)
    faces = [tuple(reversed(range(profile_count)))]
    for layer_index in range(layer_count - 1):
        current = layer_index * profile_count
        following_layer = (layer_index + 1) * profile_count
        for point_index in range(profile_count):
            following = (point_index + 1) % profile_count
            faces.append(
                (
                    current + point_index,
                    current + following,
                    following_layer + following,
                    following_layer + point_index,
                )
            )
    back_start = (layer_count - 1) * profile_count
    faces.append(tuple(back_start + index for index in range(profile_count)))
    accumulator.append(vertices, faces)


def build_monolith(
    name: str,
    material,
    profile_name: str,
    width: float,
    height: float,
    depth: float,
    position: tuple[float, float, float],
    yaw_degrees: float,
    iteration: int,
    rng: random.Random,
):
    accumulator = MeshAccumulator()
    append_polished_monolith(
        accumulator,
        profile_name=profile_name,
        width=width,
        height=height,
        depth=depth,
        bevel=width * (0.065 + iteration * 0.012),
        rng=rng,
        surface_noise=0.004 * iteration,
    )
    obj = create_mesh_object(name, accumulator, material, smooth=True)
    obj.location = Vector(position)
    obj.rotation_euler = (
        math.radians(rng.uniform(-1.8, 1.8)),
        math.radians(yaw_degrees),
        math.radians(rng.uniform(-1.6, 1.6)),
    )
    return obj


def main() -> None:
    iteration = parse_iteration()
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material(roughness=0.3)
    objects = []

    depth_scale = (0.5, 0.78, 1.0)[iteration - 1]
    interactive_layout = (
        (-4.6, -3.2, 0.65, 2.35, 8.1, -6.0, "rounded"),
        (1.25, 3.8 * depth_scale, 0.1, 2.55, 8.75, 4.5, "asymmetric"),
        (5.35, 10.2 * depth_scale, -0.25, 2.1, 7.15, 7.5, "chipped"),
    )
    for index, (x, y, z, width, height, yaw, profile) in enumerate(interactive_layout, start=1):
        scale_variation = 1.0 + rng.uniform(-0.04, 0.07)
        objects.append(
            build_monolith(
                f"monolith_{index:02d}",
                material,
                profile,
                width * scale_variation,
                height * scale_variation,
                width * rng.uniform(0.31, 0.39),
                (x, y, z),
                yaw,
                iteration,
                rng,
            )
        )

    final_decor_layout = (
        (-7.4, 1.6, -0.45, 1.65, 5.7, "chipped"),
        (7.9, 5.2, -0.55, 1.75, 6.2, "rounded"),
        (-1.8, 9.4, -0.7, 1.55, 5.35, "asymmetric"),
        (-8.3, 13.8, -0.85, 1.45, 4.95, "rounded"),
        (3.0, 15.9, -0.95, 1.5, 5.15, "chipped"),
        (8.6, 18.3, -1.05, 1.32, 4.55, "asymmetric"),
        (-4.7, 20.7, -1.18, 1.25, 4.2, "chipped"),
        (0.4, 23.5, -1.32, 1.16, 3.8, "rounded"),
        (6.0, 26.0, -1.46, 1.08, 3.45, "asymmetric"),
    )
    for index, (x, final_y, z, width, height, profile) in enumerate(final_decor_layout, start=1):
        y = -0.5 + (final_y + 0.5) * depth_scale
        scale_variation = 1.0 + rng.uniform(-0.04, 0.07)
        objects.append(
            build_monolith(
                f"monolith_decor_{index:02d}",
                material,
                profile if iteration >= 2 else "rounded",
                width * scale_variation,
                height * scale_variation,
                width * rng.uniform(0.3, 0.42),
                (x, y, z),
                rng.uniform(-8.0, 8.0),
                iteration,
                rng,
            )
        )

    stats = export_and_compress_glb(objects, OUTPUT_PATH, WEB_BUDGET)
    print(f"Monolith iteration: {iteration}")
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
