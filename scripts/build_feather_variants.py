"""Build the three deterministic feather meshes used by the fixed fall scene."""

from __future__ import annotations

import sys
from pathlib import Path

from mathutils import Vector

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    MeshAccumulator,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    make_feather_template,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "feather-variants.glb"


def main() -> None:
    reset_scene()
    material = create_marble_material()
    specifications = (
        ("feather_variant_01", 0.20, 0.018, -0.010, 1.32, -0.52),
        ("feather_variant_02", 0.17, 0.052, 0.012, 1.40, 0.0),
        ("feather_variant_03", 0.225, -0.035, 0.018, 1.27, 0.52),
    )
    objects = []
    for name, width, curl, asymmetry, length, row in specifications:
        template = make_feather_template(width, curl, asymmetry, length)
        accumulator = MeshAccumulator()
        accumulator.append(template.vertices, template.faces)
        obj = create_mesh_object(name, accumulator, material)
        obj.location += Vector((0.0, row, 0.0))
        objects.append(obj)

    stats = export_and_compress_glb(objects, OUTPUT_PATH)
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
