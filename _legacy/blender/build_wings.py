"""Procedurally build and export the hero wings as a compact GLB.

Run with:
    blender --background --python-exit-code 1 --python scripts/build_wings.py
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
    FeatherTemplate,
    MeshAccumulator,
    append_tetrahedral_fragment,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    make_feather_template,
    reset_scene,
    transform_feather,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "wings.glb"
RANDOM_SEED = 1217


def cluster_name(side: int, t: float) -> str:
    label = "L" if side < 0 else "R"
    zone = "root" if t < 0.34 else "mid" if t < 0.70 else "tip"
    return f"wing{label}_{zone}"


def is_removed_from_broken_wing(row: int, t: float) -> bool:
    gaps = {
        0: ((-0.01, 0.27), (0.39, 0.51), (0.82, 1.01)),
        1: ((0.08, 0.33), (0.38, 0.52), (0.66, 0.84)),
        2: ((0.36, 0.62),),
        3: ((-0.01, 0.19), (0.36, 0.46), (0.50, 0.70)),
        4: ((0.06, 0.29), (0.36, 0.48)),
    }
    return any(start < t < end for start, end in gaps[row])


def add_wing(
    accumulators: dict[str, MeshAccumulator],
    templates: dict[str, FeatherTemplate],
    side: int,
    broken: bool,
    rng: random.Random,
) -> None:
    rows = (
        # count, inner length, outer length, inner elevation, outer elevation,
        # base x, span, base z, rise, depth, width scale
        (12, 1.66, 3.62, -61.0, 9.0, 0.58, 1.50, -0.05, 1.34, 0.13, 1.18),
        (13, 1.38, 2.94, -53.0, 11.0, 0.50, 1.28, 0.10, 1.10, 0.03, 1.10),
        (17, 0.90, 2.05, -42.0, 12.0, 0.43, 1.12, 0.23, 0.96, -0.07, 1.00),
        (22, 0.58, 1.38, -31.0, 10.0, 0.39, 1.04, 0.35, 0.82, -0.16, 0.88),
        (18, 0.40, 0.82, -22.0, 7.0, 0.34, 0.83, 0.46, 0.62, -0.23, 0.78),
    )
    size_scale = 0.74 if broken else 1.0
    height_scale = 0.84 if broken else 1.0

    for row_index, row in enumerate(rows):
        (
            count,
            inner_length,
            outer_length,
            inner_degrees,
            outer_degrees,
            base_x,
            span,
            base_z,
            rise,
            depth,
            row_width,
        ) = row
        if broken:
            count = max(9, round(count * 0.82))

        for feather_index in range(count):
            t = feather_index / (count - 1)
            if broken and is_removed_from_broken_wing(row_index, t):
                continue

            jitter = rng.uniform(-0.018, 0.018)
            t_jittered = min(1.0, max(0.0, t + jitter))
            eased_t = t_jittered ** 0.92
            origin = Vector(
                (
                    side * (0.12 + base_x * 0.20 + span * eased_t * size_scale),
                    depth + rng.uniform(-0.028, 0.028),
                    (base_z + rise * eased_t) * height_scale,
                )
            )
            elevation = math.radians(
                inner_degrees
                + (outer_degrees - inner_degrees) * eased_t
                + rng.uniform(-2.2, 2.2)
            )
            length = (
                inner_length + (outer_length - inner_length) * (0.2 + 0.8 * eased_t) ** 0.9
            ) * size_scale
            length *= rng.uniform(0.96, 1.04)
            width_scale = row_width * rng.uniform(0.93, 1.07)
            depth_tilt = math.radians(rng.uniform(-3.0, 3.0) + (2.0 if broken else 0.0))
            twist = math.radians(rng.uniform(-4.5, 4.5))
            variant = (feather_index + row_index * 2) % 3
            template = templates[f"variant_{variant}"]
            vertices, faces = transform_feather(
                template,
                origin,
                side,
                elevation,
                length,
                width_scale,
                depth_tilt,
                twist,
            )
            accumulators[cluster_name(side, t)].append(vertices, faces)

    if broken:
        add_fractured_stumps(accumulators, templates, rng)


def add_fractured_stumps(
    accumulators: dict[str, MeshAccumulator],
    templates: dict[str, FeatherTemplate],
    rng: random.Random,
) -> None:
    stump_specs = (
        (0.22, 0.58, -47.0, 0.52),
        (0.29, 0.73, -39.0, 0.46),
        (0.48, 0.88, -17.0, 0.58),
        (0.54, 1.01, -9.0, 0.49),
        (0.58, 1.14, 0.0, 0.43),
        (0.74, 1.30, 5.0, 0.64),
        (0.80, 1.43, 9.0, 0.50),
        (0.91, 1.58, 12.0, 0.42),
    )
    for index, (t, x, elevation_degrees, length) in enumerate(stump_specs):
        origin = Vector((0.42 + x * 0.74, -0.08 + rng.uniform(-0.08, 0.06), -0.02 + t * 1.15))
        vertices, faces = transform_feather(
            templates["damaged"],
            origin,
            1,
            math.radians(elevation_degrees + rng.uniform(-5.0, 5.0)),
            length,
            0.78,
            math.radians(rng.uniform(6.0, 14.0)),
            math.radians(rng.uniform(-9.0, 9.0)),
        )
        accumulators[cluster_name(1, t)].append(vertices, faces)

    # Small chipped stone wedges make the inner edge read as a fractured stump.
    shard_positions = (
        Vector((0.53, -0.01, -0.12)),
        Vector((0.61, 0.02, 0.13)),
        Vector((0.72, -0.04, 0.34)),
        Vector((0.84, 0.01, 0.55)),
    )
    for index, position in enumerate(shard_positions):
        radius = 0.11 + index * 0.018
        append_tetrahedral_fragment(accumulators["wingR_root"], position, radius)


def add_loose_feathers(
    accumulators: dict[str, MeshAccumulator],
    templates: dict[str, FeatherTemplate],
    rng: random.Random,
) -> None:
    loose_specs = (
        (-3.75, -0.55, 2.58, -18, 1.02, 1.02),
        (-2.10, 0.32, 3.02, 62, 0.73, 0.90),
        (-0.72, -0.90, 2.72, -71, 0.91, 0.96),
        (0.72, 0.42, 3.04, 32, 1.18, 1.05),
        (2.28, -0.38, 2.70, -54, 0.82, 0.90),
        (4.10, 0.18, 1.70, -18, 0.96, 0.96),
        (4.36, -0.48, -0.36, 75, 1.28, 1.12),
        (3.02, -1.08, -1.72, 41, 1.52, 1.16),
        (0.74, -0.74, -2.06, 68, 0.88, 0.94),
        (-1.62, -1.22, -1.92, 18, 1.56, 1.18),
        (-3.74, -0.30, -1.10, -28, 1.22, 1.08),
        (0.12, -1.45, -0.92, -72, 0.78, 0.88),
    )

    for index, (x, y, z, degrees, length, width_scale) in enumerate(loose_specs, start=1):
        name = f"loose_feather_{index:02d}"
        template = templates[f"variant_{index % 3}"]
        vertices, faces = transform_feather(
            template,
            Vector((x, y, z)),
            -1 if index % 2 else 1,
            math.radians(degrees),
            length,
            width_scale * 0.72,
            math.radians(rng.uniform(-16.0, 16.0)),
            math.radians(rng.uniform(-22.0, 22.0)),
        )
        accumulators[name].append(vertices, faces)


def main() -> None:
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material()
    templates = {
        "variant_0": make_feather_template(0.285, 0.000, -0.012),
        "variant_1": make_feather_template(0.255, 0.035, 0.010),
        "variant_2": make_feather_template(0.310, -0.028, 0.018),
        "damaged": make_feather_template(0.280, 0.012, 0.035, damaged=True),
    }
    cluster_names = (
        "wingL_root",
        "wingL_mid",
        "wingL_tip",
        "wingR_root",
        "wingR_mid",
        "wingR_tip",
    )
    accumulators = {name: MeshAccumulator() for name in cluster_names}
    accumulators.update({f"loose_feather_{index:02d}": MeshAccumulator() for index in range(1, 13)})

    add_wing(accumulators, templates, side=-1, broken=False, rng=rng)
    add_wing(accumulators, templates, side=1, broken=True, rng=rng)
    add_loose_feathers(accumulators, templates, rng)
    objects = [
        create_mesh_object(name, accumulator, material)
        for name, accumulator in accumulators.items()
        if accumulator.vertices
    ]
    stats = export_and_compress_glb(objects, OUTPUT_PATH)
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Objects: {len(stats.object_names)}")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
