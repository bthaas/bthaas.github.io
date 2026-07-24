"""Build nine deterministic curved card nodes for the projects spiral."""

from __future__ import annotations

import math
import sys
from pathlib import Path

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    MeshAccumulator,
    create_marble_material,
    create_mesh_object,
    export_and_compress_glb,
    make_curved_card_template,
    reset_scene,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "project-spiral.glb"
PROJECT_ASPECTS = (1200 / 848, 1200 / 686, 1200 / 915)
CARD_BENDS = (0.040, 0.052, 0.045)
CARD_COUNT = 9
PROJECT_SLOT_ORDER = (0, 1, 0, 2, 1, 2, 0, 2, 1)


def main() -> None:
    reset_scene()
    material = create_marble_material(
        name="Project_Card_Base",
        base_color=(0.945, 0.930, 0.902, 1.0),
        roughness=0.36,
    )
    objects = []
    for index in range(CARD_COUNT):
        variant = PROJECT_SLOT_ORDER[index]
        height = 0.36
        width = height * PROJECT_ASPECTS[variant]
        template = make_curved_card_template(
            width=width,
            height=height,
            bend=CARD_BENDS[variant],
        )
        accumulator = MeshAccumulator()
        accumulator.append(template.vertices, template.faces, template.uvs)
        obj = create_mesh_object(
            f"project_card_{index + 1:02d}",
            accumulator,
            material,
        )

        centered_index = index - (CARD_COUNT - 1) / 2
        phase = centered_index * math.tau / CARD_COUNT
        obj.location.x += 0.35 + math.sin(phase) * 0.55
        obj.location.y += -0.34 * math.cos(phase)
        obj.location.z += 0.30 + centered_index * 0.14
        obj.rotation_euler.z = -phase * 0.82
        obj.rotation_euler.y = math.radians((variant - 1) * 1.8)
        objects.append(obj)

    stats = export_and_compress_glb(objects, OUTPUT_PATH)
    print(f"Exported {OUTPUT_PATH}")
    print(f"Compressed size: {stats.size_bytes} bytes")
    print(f"Triangles: {stats.triangle_count}")
    print("Nodes: " + ", ".join(stats.object_names))


if __name__ == "__main__":
    main()
