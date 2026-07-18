"""Render six warm product-lighting orbit stills from a compressed GLB."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = ROOT / "public" / "models" / "feather-variants.glb"
DEFAULT_OUTPUT = ROOT / "design-refs" / "blender-renders" / "phase2-feathers"


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    color: tuple[float, float, float],
    energy: float,
    size: float,
) -> None:
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    light = bpy.data.objects.new(name, data)
    light.location = location
    look_at(light, Vector((0.35, 0.0, 0.0)))
    bpy.context.collection.objects.link(light)


def parse_arguments() -> tuple[Path, Path]:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    model = Path(arguments[0]).resolve() if arguments else DEFAULT_MODEL
    output = Path(arguments[1]).resolve() if len(arguments) > 1 else DEFAULT_OUTPUT
    return model, output


def main() -> None:
    model, output = parse_arguments()
    output.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(model))

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    world = bpy.data.worlds.new("Warm_Ivory_World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.956,
        0.928,
        0.868,
        1.0,
    )
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.68
    scene.world = world
    add_area_light("Warm_Key", (4.6, -3.8, 5.8), (1.0, 0.74, 0.44), 690, 3.7)
    add_area_light("Cool_Fill", (-3.5, -2.0, 2.4), (0.63, 0.74, 0.88), 280, 4.6)
    add_area_light("Gold_Rim", (2.0, 3.3, 3.7), (1.0, 0.84, 0.42), 520, 2.8)

    camera_data = bpy.data.cameras.new("Turntable_Camera")
    camera_data.lens = 54
    camera = bpy.data.objects.new("Turntable_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    target = Vector((0.35, 0.0, 0.0))
    for index, degrees in enumerate((-24, -12, 0, 12, 24, 38), start=1):
        angle = math.radians(degrees)
        camera.location = (math.sin(angle) * 3.2, -math.cos(angle) * 3.2, 0.45)
        look_at(camera, target)
        scene.render.filepath = str(output / f"turntable-{index:02d}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
