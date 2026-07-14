"""Build the reference-driven scene-03 broken ruins ring.

Run the accepted build with:
    blender --background --python-exit-code 1 --python scripts/build_ruins.py

Pass ``-- 1`` through ``-- 6`` to reproduce the recorded comparison iterations.
Iteration six is the accepted web asset.
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
OUTPUT_PATH = ROOT / "public" / "models" / "ruins-ring.glb"
RANDOM_SEED = 30317
WEB_BUDGET = CompressionBudget(
    max_bytes=int(2.5 * 1024 * 1024),
    max_triangles=120_000,
)


def parse_iteration() -> int:
    if "--" not in sys.argv:
        return 6
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    if not arguments:
        return 6
    iteration = int(arguments[0])
    if iteration not in (1, 2, 3, 4, 5, 6):
        raise ValueError("Ruins iteration must be between 1 and 6")
    return iteration


def add_pier(
    accumulator: MeshAccumulator,
    x: float,
    bottom: float,
    top: float,
    width: float,
    depth: float,
    broken: bool,
) -> None:
    height = top - bottom
    offsets = (-0.07, 0.04, -0.12, 0.09) if broken else (0.0, 0.0, 0.0, 0.0)
    append_fractured_box(
        accumulator,
        center=Vector((x, 0.0, bottom + height * 0.5)),
        size=Vector((width, depth, height)),
        positive_end_offsets=offsets,
    )
    append_cylinder(
        accumulator,
        center=Vector((x, 0.0, bottom + 0.08)),
        radius=width * 0.68,
        depth=0.16,
        segments=12,
    )
    if not broken:
        append_chamfered_box(
            accumulator,
            center=Vector((x, 0.0, top - 0.04)),
            size=Vector((width * 1.48, depth * 1.08, 0.22)),
            chamfer=0.055,
        )


def build_arch(index: int, material, iteration: int):
    accumulator = MeshAccumulator()
    depth = 0.66 + 0.07 * iteration
    layouts = {
        1: ((-1.55, 0.04, math.pi), (0.0, 0.0, math.pi), (1.55, 0.0, 2.52)),
        2: ((-0.86, 0.14, math.pi), (0.86, 0.0, math.pi - 0.18)),
        3: ((0.0, 0.0, 2.66),),
        4: ((-0.84, 0.34, math.pi), (0.88, 0.0, 2.38)),
    }
    openings = layouts[index]
    if iteration >= 5:
        openings = {
            1: ((-0.92, 0.36, math.pi), (0.92, 0.0, 2.5)),
            2: ((0.0, 0.22, 2.62),),
            3: ((0.0, 0.1, 2.82),),
            4: ((0.0, 0.58, math.pi),),
        }[index]
    opening_width = (4.35 if iteration >= 5 else 3.15) if index == 3 else 1.65 if iteration >= 5 else 1.5
    opening_height = (5.6 if iteration >= 5 else 4.65) if index == 3 else 3.85 if iteration >= 5 else 3.65
    bottom = -opening_height * 0.5
    crown_base = opening_height * 0.5 - opening_width * 0.5

    for x, start_angle, end_angle in openings:
        segments = max(5, round(11 * (end_angle - start_angle) / math.pi))
        append_arch_arc(
            accumulator,
            center=Vector((x, 0.0, 0.0)),
            width=opening_width,
            height=opening_height,
            depth=depth,
            start_angle=start_angle,
            end_angle=end_angle,
            segments=segments,
            opening_ratio=0.58,
        )

    if iteration >= 5 and index == 3:
        pier_positions = (-2.05,)
    elif iteration >= 5 and index in (2, 4):
        pier_positions = (-0.78,)
    elif index == 1:
        pier_positions = (-2.29, -0.78, 0.78)
    elif index == 2:
        pier_positions = (-1.58, 0.0, 1.58)
    elif index == 3:
        pier_positions = (-1.5,)
    else:
        pier_positions = (-1.58, 0.03, 1.6)
    for pier_index, x in enumerate(pier_positions):
        broken = (pier_index + index + iteration) % 3 == 0
        pier_top = crown_base - (0.34 if broken and iteration >= 2 else 0.0)
        add_pier(
            accumulator,
            x=x,
            bottom=bottom + (0.18 if broken else 0.0),
            top=pier_top,
            width=0.29 if index != 3 else 0.43,
            depth=depth,
            broken=broken,
        )

    crown_width = max(abs(x) for x, _, _ in openings) * 2 + opening_width
    if iteration >= 5:
        beam_gap = crown_width * (0.17 if index == 3 else 0.22)
        beam_width = (crown_width - beam_gap) * 0.5
        for side in (-1.0, 1.0):
            append_fractured_box(
                accumulator,
                center=Vector((side * (beam_gap + beam_width) * 0.5, 0.0, opening_height * 0.5 + 0.17)),
                size=Vector((beam_width, depth * 1.08, 0.38)),
                negative_end_offsets=(0.18, -0.12, 0.1, -0.2),
                positive_end_offsets=(-0.3, 0.14, -0.16, 0.06),
            )
    else:
        append_fractured_box(
            accumulator,
            center=Vector((0.0, 0.0, opening_height * 0.5 + 0.17)),
            size=Vector((crown_width + 0.18, depth * 1.08, 0.34)),
            negative_end_offsets=(0.18, -0.1, 0.08, -0.2),
            positive_end_offsets=(-0.28, 0.12, -0.16, 0.05),
        )
    if iteration >= 2:
        if iteration >= 5:
            for side in (-1.0, 1.0):
                append_chamfered_box(
                    accumulator,
                    center=Vector((side * crown_width * 0.27, -depth * 0.03, opening_height * 0.5 + 0.5)),
                    size=Vector((crown_width * 0.43, depth * 1.16, 0.24)),
                    chamfer=0.07,
                )
        else:
            append_chamfered_box(
                accumulator,
                center=Vector((-0.12, -depth * 0.03, opening_height * 0.5 + 0.48)),
                size=Vector((crown_width * 0.91, depth * 1.15, 0.22)),
                chamfer=0.07,
            )
    if iteration >= 3:
        for z_offset, width_scale in ((0.64, 0.82), (0.78, 0.72)):
            append_fractured_box(
                accumulator,
                center=Vector((0.05, 0.0, opening_height * 0.5 + z_offset)),
                size=Vector((crown_width * width_scale, depth * 1.06, 0.1)),
                positive_end_offsets=(-0.08, 0.03, -0.04, 0.06),
            )
        for fragment_index in range(3):
            append_tetrahedral_fragment(
                accumulator,
                center=Vector(
                    (
                        crown_width * 0.43 + fragment_index * 0.09,
                        0.0,
                        opening_height * 0.5 + 0.18 - fragment_index * 0.16,
                    )
                ),
                radius=0.12 + fragment_index * 0.025,
            )
    if iteration >= 5:
        relief_depth = depth * 0.12
        for x, _, _ in openings:
            append_arch_arc(
                accumulator,
                center=Vector((x, -depth * 0.56, 0.0)),
                width=opening_width * 0.88,
                height=opening_height - opening_width * 0.06,
                depth=relief_depth,
                start_angle=0.22,
                end_angle=2.72,
                segments=16,
                opening_ratio=0.76,
            )
        for x in pier_positions:
            append_fractured_box(
                accumulator,
                center=Vector((x, -depth * 0.56, bottom + (crown_base - bottom) * 0.5)),
                size=Vector((0.09, relief_depth, crown_base - bottom - 0.22)),
                positive_end_offsets=(-0.03, 0.02, -0.04, 0.03),
            )
    return create_mesh_object(f"ruin_arch_{index:02d}", accumulator, material, smooth=False)


def build_column(index: int, material, iteration: int, rng: random.Random):
    accumulator = MeshAccumulator()
    height = 4.25 + rng.uniform(-0.28, 0.38)
    radius = 0.41 + rng.uniform(-0.025, 0.025)
    split = -0.24 + rng.uniform(-0.18, 0.22)
    gap = 0.0 if iteration == 1 else 0.16 + 0.04 * (index % 2)
    lower_height = split - gap * 0.5 + height * 0.5
    upper_height = height * 0.5 - split - gap * 0.5
    append_cylinder(
        accumulator,
        center=Vector((0.0, 0.0, -height * 0.5 + lower_height * 0.5)),
        radius=radius,
        depth=lower_height,
        segments=32 if iteration >= 5 else 24,
        radial_wave=0.075,
        radial_frequency=8,
    )
    if index != 4 or iteration == 1:
        append_cylinder(
            accumulator,
            center=Vector((0.08 if iteration >= 2 else 0.0, 0.0, split + gap * 0.5 + upper_height * 0.5)),
            radius=radius * (0.97 if iteration >= 2 else 1.0),
            depth=upper_height,
            segments=32 if iteration >= 5 else 24,
            radial_wave=0.075,
            radial_frequency=8,
        )
    for z, radial_scale, band_height in (
        (-height * 0.5 - 0.12, 1.38, 0.24),
        (-height * 0.5 + 0.08, 1.18, 0.16),
    ):
        append_cylinder(
            accumulator,
            center=Vector((0.0, 0.0, z)),
            radius=radius * radial_scale,
            depth=band_height,
            segments=16,
        )
    if index not in (2, 4) or iteration == 1:
        append_cylinder(
            accumulator,
            center=Vector((0.06, 0.0, height * 0.5 + 0.08)),
            radius=radius * 1.27,
            depth=0.22,
            segments=16,
        )
        append_chamfered_box(
            accumulator,
            center=Vector((0.06, 0.0, height * 0.5 + 0.26)),
            size=Vector((radius * 3.1, radius * 2.85, 0.24)),
            chamfer=0.08,
        )
    if iteration >= 2:
        for chip_index in range(4 if iteration >= 5 else 2 + (iteration == 3)):
            append_tetrahedral_fragment(
                accumulator,
                center=Vector((radius * (0.6 + chip_index * 0.2), 0.0, split + chip_index * 0.07)),
                radius=0.12 + chip_index * 0.02,
            )
    return create_mesh_object(f"ruin_column_{index:02d}", accumulator, material, smooth=False)


def build_slab(index: int, material, iteration: int):
    accumulator = MeshAccumulator()
    width = 4.3 if index == 1 else 3.7
    offsets = (0.24, -0.18, 0.08, -0.3)
    append_fractured_box(
        accumulator,
        center=Vector((0.0, 0.0, 0.0)),
        size=Vector((width, 0.9, 0.82)),
        negative_end_offsets=tuple(-value * 0.65 for value in offsets),
        positive_end_offsets=offsets,
    )
    append_fractured_box(
        accumulator,
        center=Vector((-0.08, 0.0, 0.54)),
        size=Vector((width * 0.94, 0.96, 0.22)),
        positive_end_offsets=(-0.18, 0.08, -0.12, 0.04),
    )
    if iteration >= 2:
        append_chamfered_box(
            accumulator,
            center=Vector((0.04, -0.02, -0.48)),
            size=Vector((width * 0.88, 0.82, 0.16)),
            chamfer=0.05,
        )
    if iteration >= 3:
        append_fractured_box(
            accumulator,
            center=Vector((0.18, -0.47, 0.05)),
            size=Vector((width * 0.7, 0.08, 0.22)),
            positive_end_offsets=(-0.12, 0.04, -0.05, 0.09),
        )
        append_tetrahedral_fragment(accumulator, Vector((width * 0.47, 0.0, 0.18)), 0.24)
    return create_mesh_object(f"ruin_slab_{index:02d}", accumulator, material, smooth=False)


def build_fragment(index: int, material, iteration: int):
    accumulator = MeshAccumulator()
    width = 2.15 if index == 1 else 1.72
    append_fractured_box(
        accumulator,
        center=Vector((0.0, 0.0, 0.0)),
        size=Vector((width, 0.78, 2.2 if index == 1 else 1.8)),
        negative_end_offsets=(0.12, -0.18, 0.04, -0.08),
        positive_end_offsets=(-0.26, 0.1, -0.14, 0.18),
    )
    append_chamfered_box(
        accumulator,
        center=Vector((-0.18, 0.0, -1.12 if index == 1 else -0.92)),
        size=Vector((width * 1.12, 0.92, 0.22)),
        chamfer=0.07,
    )
    if iteration >= 2:
        for fragment_index in range(iteration):
            append_tetrahedral_fragment(
                accumulator,
                Vector((width * 0.42, 0.0, 0.62 - fragment_index * 0.27)),
                0.16 + fragment_index * 0.035,
            )
    return create_mesh_object(f"ruin_fragment_{index:02d}", accumulator, material, smooth=False)


def place_on_ring(
    obj,
    angle: float,
    radius: float,
    height: float,
    tilt_degrees: tuple[float, float, float],
    scale: float,
) -> None:
    obj.location = Vector((math.cos(angle) * radius, math.sin(angle) * radius, height))
    obj.rotation_euler = (
        math.radians(tilt_degrees[0]),
        math.radians(tilt_degrees[1]),
        angle + math.pi * 0.5 + math.radians(tilt_degrees[2]),
    )
    obj.scale = (scale, scale, scale)


def main() -> None:
    iteration = parse_iteration()
    reset_scene()
    rng = random.Random(RANDOM_SEED)
    material = create_marble_material()
    objects = []
    ring_radius = (6.1, 6.8, 7.15, 7.05, 7.25, 7.25)[iteration - 1]
    vertical_spread = (0.85, 1.45, 1.95, 1.35, 1.65, 1.35)[iteration - 1]

    placements = (
        ("arch", 1, 18),
        ("column", 1, 52),
        ("slab", 1, 82),
        ("arch", 2, 116),
        ("column", 2, 151),
        ("fragment", 1, 181),
        ("arch", 3, 211),
        ("column", 3, 241),
        ("slab", 2, 270),
        ("arch", 4, 300),
        ("column", 4, 329),
        ("fragment", 2, 348),
    )
    if iteration >= 5:
        placements = (
            ("column", 1, 28),
            ("fragment", 2, 66),
            ("arch", 3, 101),
            ("column", 2, 151),
            ("fragment", 1, 184),
            ("arch", 2, 226),
            ("slab", 1, 273),
            ("arch", 4, 318),
            ("column", 3, 349),
        )
    builders = {
        "arch": lambda index: build_arch(index, material, iteration),
        "column": lambda index: build_column(index, material, iteration, rng),
        "slab": lambda index: build_slab(index, material, iteration),
        "fragment": lambda index: build_fragment(index, material, iteration),
    }
    for placement_index, (kind, index, degrees) in enumerate(placements):
        obj = builders[kind](index)
        height_wave = math.sin(math.radians(degrees * 2.35)) * vertical_spread
        local_radius = ring_radius + rng.uniform(-0.45, 0.5)
        scale = 0.88 + rng.uniform(0.0, 0.2)
        if iteration >= 6 and kind == "arch" and index == 3:
            height_wave = 0.72
            local_radius = ring_radius - 0.3
            scale = 1.16
        place_on_ring(
            obj,
            angle=math.radians(degrees),
            radius=local_radius,
            height=height_wave + rng.uniform(-0.22, 0.22),
            tilt_degrees=(
                rng.uniform(-9, 9) + (8 if placement_index % 4 == 0 else 0),
                rng.uniform(-14, 14),
                rng.uniform(-13, 13),
            ),
            scale=scale,
        )
        objects.append(obj)

    chip_count = (26, 30, 34, 34, 42, 42)[iteration - 1]
    parent_angles = [math.radians(degrees) for _, _, degrees in placements]
    for index in range(1, chip_count + 1):
        accumulator = MeshAccumulator()
        append_tetrahedral_fragment(
            accumulator,
            center=Vector((0.0, 0.0, 0.0)),
            radius=0.11 + rng.random() * (0.17 if iteration < 3 else 0.24),
        )
        chip = create_mesh_object(f"ruin_chip_{index:02d}", accumulator, material, smooth=False)
        parent_angle = parent_angles[rng.randrange(len(parent_angles))]
        angle = parent_angle + rng.uniform(-0.18, 0.18)
        place_on_ring(
            chip,
            angle=angle,
            radius=ring_radius + rng.uniform(-0.8, 0.85),
            height=math.sin(angle * 2.35) * vertical_spread + rng.uniform(-1.45, 1.5),
            tilt_degrees=tuple(rng.uniform(-45, 45) for _ in range(3)),
            scale=1.0,
        )
        objects.append(chip)

    stats = export_and_compress_glb(objects, OUTPUT_PATH, WEB_BUDGET)
    print(f"Ruins iteration: {iteration}")
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
