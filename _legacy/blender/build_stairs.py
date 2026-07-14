"""Build the reference-driven scene-04 monumental stair timeline.

Run the accepted build with:
    blender --background --python-exit-code 1 --python scripts/build_stairs.py

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
    append_arch_arc,
    append_chamfered_box,
    append_cylinder,
    append_fractured_box,
    append_tetrahedral_fragment,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "stair-timeline.glb"
RANDOM_SEED = 40429
WEB_BUDGET = CompressionBudget(
    max_bytes=int(2.5 * 1024 * 1024),
    max_triangles=120_000,
)


def parse_iteration() -> int:
    if "--" not in sys.argv:
        return 3
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    if not arguments:
        return 3
    iteration = int(arguments[0])
    if iteration not in (1, 2, 3):
        raise ValueError("Stair iteration must be 1, 2, or 3")
    return iteration


def append_pediment(
    accumulator: MeshAccumulator,
    center: Vector,
    width: float,
    height: float,
    depth: float,
) -> None:
    half_width = width * 0.5
    half_depth = depth * 0.5
    points = (
        Vector((-half_width, -half_depth, 0.0)),
        Vector((half_width, -half_depth, 0.0)),
        Vector((0.0, -half_depth, height)),
        Vector((-half_width, half_depth, 0.0)),
        Vector((half_width, half_depth, 0.0)),
        Vector((0.0, half_depth, height)),
    )
    vertices = tuple(center + point for point in points)
    faces = (
        (0, 2, 1),
        (3, 4, 5),
        (0, 1, 4, 3),
        (1, 2, 5, 4),
        (2, 0, 3, 5),
    )
    accumulator.append(vertices, faces)


def append_broken_stair_run(
    accumulator: MeshAccumulator,
    step_count: int,
    width: float,
    tread_depth: float,
    riser_height: float,
    iteration: int,
    damage_side: int,
) -> tuple[float, float]:
    length = step_count * tread_depth
    rise = step_count * riser_height
    origin = Vector((-length * 0.5, 0.0, -rise * 0.5))
    for step_index in range(step_count):
        height = (step_index + 1) * riser_height
        is_damage_band = iteration >= 2 and (
            3 <= step_index <= 6 or step_count - 5 <= step_index <= step_count - 3
        )
        width_scale = 0.78 if is_damage_band else 1.0
        y_shift = damage_side * width * (1.0 - width_scale) * 0.5
        fracture = (
            (-0.05, 0.03, -0.025, 0.04)
            if is_damage_band
            else (0.0, 0.0, 0.0, 0.0)
        )
        append_fractured_box(
            accumulator,
            center=Vector(
                (
                    origin.x + (step_index + 0.5) * tread_depth,
                    y_shift,
                    origin.z + height * 0.5,
                )
            ),
            size=Vector((tread_depth, width * width_scale, height)),
            positive_end_offsets=fracture,
        )
    return length, rise


def append_support_arch(
    accumulator: MeshAccumulator,
    center_x: float,
    top_z: float,
    width: float,
    iteration: int,
    missing_side: int,
) -> None:
    height = 6.2 + iteration * 0.35
    depth = 1.05
    center_z = top_z - height * 0.5 - 0.18
    append_arch_arc(
        accumulator,
        center=Vector((center_x, 0.0, center_z)),
        width=width,
        height=height,
        depth=depth,
        start_angle=0.12 if missing_side < 0 else 0.0,
        end_angle=math.pi - (0.18 if missing_side > 0 else 0.0),
        segments=12,
        opening_ratio=0.62,
    )
    outer_radius = width * 0.5
    arch_base = center_z + height * 0.5 - outer_radius
    bottom = center_z - height * 0.5
    for side in (-1, 1):
        if side == missing_side and iteration >= 2:
            remnant_height = (arch_base - bottom) * 0.52
            append_fractured_box(
                accumulator,
                center=Vector((center_x + side * width * 0.43, 0.0, bottom + remnant_height * 0.5)),
                size=Vector((0.46, depth, remnant_height)),
                positive_end_offsets=(-0.08, 0.04, -0.11, 0.07),
            )
            continue
        append_chamfered_box(
            accumulator,
            center=Vector((center_x + side * width * 0.43, 0.0, bottom + (arch_base - bottom) * 0.5)),
            size=Vector((0.52, depth, arch_base - bottom)),
            chamfer=0.07,
        )


def build_landing(index: int, material, iteration: int, rng: random.Random):
    accumulator = MeshAccumulator()
    step_count = 18 + index
    width = (4.3, 5.0, 5.45)[iteration - 1]
    tread_depth = (0.34, 0.38, 0.4)[iteration - 1]
    riser_height = (0.2, 0.23, 0.25)[iteration - 1]
    length, rise = append_broken_stair_run(
        accumulator,
        step_count=step_count,
        width=width,
        tread_depth=tread_depth,
        riser_height=riser_height,
        iteration=iteration,
        damage_side=-1 if index % 2 else 1,
    )
    landing_length = 2.5 + 0.18 * iteration
    landing_width = width * (1.3 + 0.05 * iteration)
    landing_center_x = length * 0.5 + landing_length * 0.5
    landing_top = rise * 0.5
    append_fractured_box(
        accumulator,
        center=Vector((landing_center_x, 0.0, landing_top - 0.32)),
        size=Vector((landing_length, landing_width, 0.64)),
        negative_end_offsets=(0.12, -0.08, 0.04, -0.16),
        positive_end_offsets=(-0.24, 0.1, -0.14, 0.08),
    )
    append_support_arch(
        accumulator,
        center_x=landing_center_x + 0.15,
        top_z=landing_top - 0.58,
        width=width * 0.86,
        iteration=iteration,
        missing_side=-1 if index in (1, 4) else 1,
    )
    if iteration >= 2:
        append_chamfered_box(
            accumulator,
            center=Vector((landing_center_x - 0.15, -landing_width * 0.5 - 0.08, landing_top - 0.32)),
            size=Vector((landing_length * 0.68, 0.12, 0.88)),
            chamfer=0.08,
        )
    if iteration >= 3:
        append_fractured_box(
            accumulator,
            center=Vector((landing_center_x - 0.1, 0.0, landing_top + 0.08)),
            size=Vector((landing_length * 0.82, landing_width * 1.02, 0.12)),
            positive_end_offsets=(-0.12, 0.06, -0.08, 0.04),
        )
        for local_index in range(3):
            append_tetrahedral_fragment(
                accumulator,
                center=Vector(
                    (
                        landing_center_x + landing_length * 0.46,
                        -landing_width * 0.3 + local_index * 0.28,
                        landing_top - 0.15 + local_index * 0.12,
                    )
                ),
                radius=0.15 + local_index * 0.035,
            )

    obj = create_mesh_object(f"stair_landing_{index:02d}", accumulator, material, smooth=False)
    vertical_positions = (8.2, 2.55, -3.25, -9.0)
    obj.location = Vector(((-1.45 if index % 2 else 1.45), (index - 2.5) * 0.32, vertical_positions[index - 1]))
    obj.rotation_euler = (
        math.radians(rng.uniform(-2.2, 2.2)),
        math.radians(rng.uniform(-4.5, 4.5)),
        math.pi if index % 2 == 0 else 0.0,
    )
    return obj


def build_facade(material, iteration: int):
    accumulator = MeshAccumulator()
    depth = 1.2
    height = (8.2, 9.6, 11.0)[iteration - 1]
    arch_width = 3.6
    for x, start, end in ((-1.9, 0.18, math.pi), (1.9, 0.0, 2.65)):
        append_arch_arc(
            accumulator,
            center=Vector((x, 0.0, -0.2)),
            width=arch_width,
            height=height * 0.68,
            depth=depth,
            start_angle=start,
            end_angle=end,
            segments=12,
            opening_ratio=0.62,
        )
    pier_bottom = -height * 0.34
    pier_top = height * 0.03
    for x in (-3.45, 0.0, 3.45):
        if x > 3.0 and iteration >= 2:
            append_fractured_box(
                accumulator,
                center=Vector((x, 0.0, pier_bottom + (pier_top - pier_bottom) * 0.3)),
                size=Vector((0.58, depth, (pier_top - pier_bottom) * 0.6)),
                positive_end_offsets=(-0.08, 0.05, -0.12, 0.08),
            )
            continue
        append_chamfered_box(
            accumulator,
            center=Vector((x, 0.0, (pier_bottom + pier_top) * 0.5)),
            size=Vector((0.66, depth, pier_top - pier_bottom)),
            chamfer=0.08,
        )
    append_fractured_box(
        accumulator,
        center=Vector((-0.2, 0.0, height * 0.22)),
        size=Vector((7.65, depth * 1.12, 0.72)),
        negative_end_offsets=(0.18, -0.1, 0.08, -0.2),
        positive_end_offsets=(-0.34, 0.12, -0.18, 0.07),
    )
    append_pediment(
        accumulator,
        center=Vector((-0.22, 0.0, height * 0.57)),
        width=7.0,
        height=1.65 + iteration * 0.18,
        depth=depth * 0.94,
    )
    if iteration >= 2:
        append_chamfered_box(
            accumulator,
            center=Vector((-0.25, 0.0, height * 0.38)),
            size=Vector((7.2, depth * 1.08, 0.28)),
            chamfer=0.08,
        )
    if iteration >= 3:
        for z_offset, width_scale in ((0.42, 0.94), (0.48, 0.82)):
            append_fractured_box(
                accumulator,
                center=Vector((-0.25, -depth * 0.56, height * z_offset)),
                size=Vector((7.2 * width_scale, 0.11, 0.18)),
                positive_end_offsets=(-0.12, 0.05, -0.07, 0.09),
            )
        for fragment_index in range(4):
            append_tetrahedral_fragment(
                accumulator,
                Vector((3.3 + fragment_index * 0.12, 0.0, height * 0.16 + fragment_index * 0.28)),
                0.18 + fragment_index * 0.025,
            )
    facade = create_mesh_object("temple_facade_01", accumulator, material, smooth=False)
    facade.location = Vector((3.2, 2.15, -0.65))
    facade.rotation_euler = (math.radians(-3.5), math.radians(7.5), math.radians(-8.5))
    return facade


def main() -> None:
    iteration = parse_iteration()
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material()
    objects = [build_landing(index, material, iteration, rng) for index in range(1, 5)]
    objects.append(build_facade(material, iteration))

    chip_count = (16, 18, 20)[iteration - 1]
    landing_heights = (8.2, 2.55, -3.25, -9.0)
    for index in range(1, chip_count + 1):
        accumulator = MeshAccumulator()
        append_tetrahedral_fragment(
            accumulator,
            Vector((0.0, 0.0, 0.0)),
            0.14 + rng.random() * (0.16 + iteration * 0.035),
        )
        chip = create_mesh_object(f"stair_chip_{index:02d}", accumulator, material, smooth=False)
        band = (index - 1) % 4
        chip.location = Vector(
            (
                rng.uniform(-5.8, 5.8),
                rng.uniform(-2.6, 2.9),
                landing_heights[band] + rng.uniform(-2.1, 2.0),
            )
        )
        chip.rotation_euler = tuple(math.radians(rng.uniform(-50, 50)) for _ in range(3))
        objects.append(chip)

    stats = export_and_compress_glb(objects, OUTPUT_PATH, WEB_BUDGET)
    print(f"Stairs iteration: {iteration}")
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
