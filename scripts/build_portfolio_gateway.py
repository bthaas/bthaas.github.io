"""Build the deterministic named-node portfolio gateway carousel."""

from __future__ import annotations

import math
import sys
from pathlib import Path

from mathutils import Matrix, Vector

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
ROOT = SCRIPT_DIRECTORY.parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    MeshAccumulator,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    make_curved_panel_template,
    reset_scene,
)

OUTPUT = ROOT / "public" / "models" / "portfolio-gateway.glb"
PANEL_NAMES = (
    "carousel_experience_panel",
    "carousel_projects_panel",
    "carousel_skills_panel",
)


def create_panel(name: str, degrees: float):
    template = make_curved_panel_template(
        radius=2.42,
        height=1.50,
        sweep_degrees=118.5,
        segments=24,
        thickness=0.065,
    )
    accumulator = MeshAccumulator()
    accumulator.append(template.vertices, template.faces)
    panel = create_mesh_object(
        name,
        accumulator,
        create_marble_material(f"{name}_material"),
        template.loop_uvs,
    )
    rotation = math.radians(degrees)
    panel.location = Matrix.Rotation(rotation, 4, "Z") @ panel.location
    panel.rotation_euler.z = rotation
    return panel


def create_reflector_shell():
    template = make_curved_panel_template(
        radius=2.48,
        height=0.72,
        sweep_degrees=360.0,
        segments=48,
        thickness=0.07,
    )
    accumulator = MeshAccumulator()
    accumulator.append(template.vertices, template.faces)
    shell = create_mesh_object(
        "carousel_reflector_shell",
        accumulator,
        create_marble_material(
            "carousel_reflector_material",
            base_color=(0.965, 0.945, 0.910, 1.0),
            roughness=0.34,
        ),
        template.loop_uvs,
    )
    shell.location += Vector((0.0, 0.0, -1.22))
    return shell


def main() -> None:
    reset_scene()
    objects = [
        create_panel(name, index * 120.0)
        for index, name in enumerate(PANEL_NAMES)
    ]
    objects.append(create_reflector_shell())
    stats = export_and_compress_glb(objects, OUTPUT)
    print(
        "portfolio_gateway",
        f"bytes={stats.size_bytes}",
        f"triangles={stats.triangle_count}",
        f"nodes={','.join(stats.object_names)}",
    )


if __name__ == "__main__":
    main()
