"""Headless Blender contract tests for shared procedural helpers."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import bmesh

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    MeshAccumulator,
    build_gltf_transform_command,
    create_marble_material,
    create_mesh_object,
    make_feather_template,
    make_curved_panel_template,
    reset_scene,
)


class FeatherPrimitiveTests(unittest.TestCase):
    def test_three_shapes_stay_closed_low_poly_and_distinct(self) -> None:
        variants = (
            make_feather_template(0.20, 0.018, -0.010, 1.32),
            make_feather_template(0.17, 0.052, 0.012, 1.40),
            make_feather_template(0.225, -0.035, 0.018, 1.27),
        )
        triangle_counts = [sum(len(face) - 2 for face in item.faces) for item in variants]
        self.assertTrue(all(200 <= count <= 300 for count in triangle_counts))
        widths = [
            max(vertex.z for vertex in item.vertices)
            - min(vertex.z for vertex in item.vertices)
            for item in variants
        ]
        self.assertEqual(len({round(width, 3) for width in widths}), 3)

    def test_created_mesh_uses_centered_local_pivot(self) -> None:
        reset_scene()
        template = make_feather_template(0.29, 0.018)
        accumulator = MeshAccumulator()
        accumulator.append(template.vertices, template.faces)
        obj = create_mesh_object("feather_variant_01", accumulator, create_marble_material())
        xs = [vertex.co.x for vertex in obj.data.vertices]
        self.assertAlmostEqual(min(xs) + max(xs), 0.0, places=5)


class CurvedPanelPrimitiveTests(unittest.TestCase):
    def test_curved_panel_is_closed_uv_mapped_and_symmetric(self) -> None:
        template = make_curved_panel_template(
            radius=2.4,
            height=1.45,
            sweep_degrees=116.0,
            segments=24,
            thickness=0.055,
        )

        self.assertEqual(len(template.faces), 24 * 4 + 2)
        self.assertEqual(
            len(template.loop_uvs),
            sum(len(face) for face in template.faces),
        )
        xs = [vertex.x for vertex in template.vertices]
        zs = [vertex.z for vertex in template.vertices]
        self.assertAlmostEqual(min(xs) + max(xs), 0.0, places=5)
        self.assertAlmostEqual(min(zs), -0.725, places=5)
        self.assertAlmostEqual(max(zs), 0.725, places=5)

    def test_curved_panel_rejects_invalid_geometry(self) -> None:
        with self.assertRaises(ValueError):
            make_curved_panel_template(
                radius=2.4,
                height=1.45,
                sweep_degrees=120.0,
                segments=1,
                thickness=0.055,
            )

    def test_full_sweep_has_one_seam_without_overlapping_end_caps(self) -> None:
        template = make_curved_panel_template(
            radius=2.48,
            height=0.72,
            sweep_degrees=360.0,
            segments=48,
            thickness=0.07,
        )

        self.assertEqual(len(template.faces), 48 * 4)
        self.assertEqual(len(template.vertices), 48 * 4)
        self.assertEqual(
            len(template.loop_uvs),
            sum(len(face) for face in template.faces),
        )
        mesh = bmesh.new()
        vertices = [mesh.verts.new(vertex) for vertex in template.vertices]
        for face in template.faces:
            mesh.faces.new(vertices[index] for index in face)
        mesh.edges.ensure_lookup_table()
        self.assertEqual(sum(not edge.is_manifold for edge in mesh.edges), 0)
        mesh.free()


class MaterialAndExportTests(unittest.TestCase):
    def test_marble_material_matches_runtime_contract(self) -> None:
        reset_scene()
        node = create_marble_material().node_tree.nodes.get("Principled BSDF")
        self.assertIsNotNone(node)
        self.assertAlmostEqual(node.inputs["Roughness"].default_value, 0.4)
        self.assertAlmostEqual(node.inputs["Metallic"].default_value, 0.0)

    def test_compression_preserves_named_objects(self) -> None:
        command = build_gltf_transform_command(Path("source.glb"), Path("out.glb"))
        self.assertEqual(command[:4], ["npx", "--yes", "@gltf-transform/cli", "optimize"])
        for flag in ("--flatten", "--join", "--instance", "--simplify"):
            self.assertIn(flag, command)
        self.assertEqual(command[command.index("--prune-attributes") + 1], "false")
        self.assertIn("draco", command)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(
        unittest.defaultTestLoader.loadTestsFromModule(__import__(__name__))
    )
    if not result.wasSuccessful():
        raise SystemExit(1)
