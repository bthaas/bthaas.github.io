"""Render six headless orbit stills from a compressed portfolio GLB.

Usage:
    blender --background --python-exit-code 1 --python scripts/render_turntable.py -- [model] [output directory]
"""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Vector

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    configure_turntable_rig,
    render_turntable_orbit,
    reset_scene,
    TurntableConfig,
)


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "public" / "models" / "wings.glb"
DEFAULT_OUTPUT = ROOT / "design-refs" / "blender-renders"


def parse_arguments() -> tuple[Path, Path]:
    if "--" not in sys.argv:
        return MODEL_PATH, DEFAULT_OUTPUT
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    if not arguments:
        return MODEL_PATH, DEFAULT_OUTPUT
    if arguments[0].lower().endswith(".glb"):
        model_path = Path(arguments[0]).resolve()
        output_directory = (
            Path(arguments[1]).resolve() if len(arguments) > 1 else DEFAULT_OUTPUT
        )
        return model_path, output_directory
    return MODEL_PATH, Path(arguments[0]).resolve()


def infer_turntable_config(model_path: Path) -> TurntableConfig:
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    world_corners = [
        obj.matrix_world @ Vector(corner)
        for obj in mesh_objects
        for corner in obj.bound_box
    ]
    if not world_corners:
        return TurntableConfig()
    minimum = Vector(
        tuple(min(corner[axis] for corner in world_corners) for axis in range(3))
    )
    maximum = Vector(
        tuple(max(corner[axis] for corner in world_corners) for axis in range(3))
    )
    center = (minimum + maximum) * 0.5
    extent = maximum - minimum
    if "ruins-ring" in model_path.stem:
        return TurntableConfig(
            lens_millimeters=40.0,
            radius=1.25,
            camera_height=center.z + 2.05,
            camera_target=(0.0, 0.0, center.z + 0.62),
            light_target=(0.0, 0.0, center.z + 0.25),
            orbit_angles=(-18.0, 42.0, 102.0, 162.0, 222.0, 282.0),
            orbit_target_radius=6.2,
        )
    if "stair-timeline" in model_path.stem:
        camera_offsets = (8.4, 5.0, 1.7, -1.7, -5.0, -8.4)
        target_offsets = tuple(value - 2.9 for value in camera_offsets)
        return TurntableConfig(
            lens_millimeters=43.0,
            radius=11.8,
            camera_height=center.z,
            camera_target=(center.x, center.y, center.z),
            light_target=(center.x, center.y, center.z),
            orbit_angles=(-22.0, -14.0, -6.0, 6.0, 14.0, 22.0),
            camera_height_offsets=camera_offsets,
            target_height_offsets=target_offsets,
        )
    if "monolith-field" in model_path.stem:
        return TurntableConfig(
            lens_millimeters=44.0,
            radius=10.8,
            camera_height=center.z + 0.65,
            camera_target=(0.0, 6.4, center.z + 0.35),
            light_target=(0.0, 6.4, center.z + 0.2),
            orbit_angles=(-17.0, -10.0, -3.0, 4.0, 11.0, 18.0),
        )
    vertical_fit = 2.65 if "stair-timeline" in model_path.stem else 2.15
    radius = max(13.0, extent.x * 1.55, extent.y * 1.55, extent.z * vertical_fit)
    target = (center.x, center.y, center.z)
    elevation = 0.5 if "ruins-ring" in model_path.stem else 0.035
    return TurntableConfig(
        radius=radius,
        camera_height=center.z + radius * elevation,
        camera_target=target,
        light_target=target,
    )


def main() -> None:
    model_path, output_directory = parse_arguments()
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(model_path))
    config = infer_turntable_config(model_path)
    camera = configure_turntable_rig(output_directory, config)
    render_turntable_orbit(camera, output_directory, config)


if __name__ == "__main__":
    main()
