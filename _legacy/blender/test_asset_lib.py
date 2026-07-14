"""Headless Blender tests for the reusable procedural-asset helpers.

Run with:
    blender --background --python-exit-code 1 --python scripts/test_asset_lib.py
"""

from __future__ import annotations

import tempfile
import sys
import unittest
from pathlib import Path

import bpy
from mathutils import Vector

SCRIPT_DIRECTORY = Path(__file__).resolve().parent
if str(SCRIPT_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIRECTORY))

from asset_lib import (  # noqa: E402
    CompressionBudget,
    MeshAccumulator,
    TurntableConfig,
    append_arch_arc,
    append_arch_segment,
    append_box,
    append_chamfered_box,
    append_cylinder,
    append_fractured_box,
    append_rounded_monolith,
    append_stair_run,
    append_tetrahedral_fragment,
    build_gltf_transform_command,
    configure_turntable_rig,
    create_marble_material,
    make_feather_template,
    orbit_camera_positions,
    orbit_camera_targets,
    reset_scene,
    validate_asset_budget,
)


class FeatherPrimitiveTests(unittest.TestCase):
    def test_feather_stays_low_poly_and_has_a_center_ridge(self) -> None:
        template = make_feather_template(width=0.285, curl=0.02)
        triangle_count = sum(len(face) - 2 for face in template.faces)

        self.assertGreaterEqual(triangle_count, 180)
        self.assertLessEqual(triangle_count, 240)
        center = template.vertices[5 * 5 + 2]
        edge = template.vertices[5 * 5]
        self.assertLess(center.y, edge.y)

    def test_damaged_feather_narrows_the_tip(self) -> None:
        intact = make_feather_template(width=0.285, curl=0.0)
        damaged = make_feather_template(width=0.285, curl=0.0, damaged=True)
        tip_section_edge = 9 * 5 + 4

        self.assertLess(
            abs(damaged.vertices[tip_section_edge].z),
            abs(intact.vertices[tip_section_edge].z),
        )

    def test_fragment_primitive_appends_a_closed_tetrahedron(self) -> None:
        accumulator = MeshAccumulator()

        append_tetrahedral_fragment(
            accumulator,
            center=Vector((1.0, 2.0, 3.0)),
            radius=0.2,
        )

        self.assertEqual(len(accumulator.vertices), 4)
        self.assertEqual(len(accumulator.faces), 4)
        self.assertTrue(all(len(face) == 3 for face in accumulator.faces))


class ArchitecturalPrimitiveTests(unittest.TestCase):
    def test_box_and_cylinder_append_closed_low_poly_geometry(self) -> None:
        box = MeshAccumulator()
        append_box(box, center=Vector((0.0, 0.0, 0.0)), size=Vector((2.0, 1.0, 3.0)))
        self.assertEqual(len(box.vertices), 8)
        self.assertEqual(len(box.faces), 6)

        cylinder = MeshAccumulator()
        append_cylinder(
            cylinder,
            center=Vector((0.0, 0.0, 0.0)),
            radius=1.0,
            depth=4.0,
            segments=12,
            radial_wave=0.04,
            radial_frequency=6,
        )
        self.assertEqual(len(cylinder.vertices), 24)
        self.assertEqual(len(cylinder.faces), 14)

    def test_chamfered_and_fractured_boxes_keep_closed_silhouettes(self) -> None:
        chamfered = MeshAccumulator()
        append_chamfered_box(
            chamfered,
            center=Vector((0.0, 0.0, 0.0)),
            size=Vector((3.0, 1.0, 2.0)),
            chamfer=0.2,
        )
        self.assertEqual(len(chamfered.vertices), 16)
        self.assertEqual(len(chamfered.faces), 10)

        fractured = MeshAccumulator()
        append_fractured_box(
            fractured,
            center=Vector((0.0, 0.0, 0.0)),
            size=Vector((4.0, 1.0, 1.0)),
            positive_end_offsets=(-0.3, 0.12, -0.08, 0.24),
        )
        self.assertEqual(len(fractured.vertices), 8)
        self.assertEqual(len(fractured.faces), 6)
        self.assertGreater(len({round(vertex[0], 2) for vertex in fractured.vertices[4:]}), 2)

    def test_arch_preserves_a_tall_open_center(self) -> None:
        arch = MeshAccumulator()
        append_arch_segment(
            arch,
            center=Vector((0.0, 0.0, 0.0)),
            width=4.0,
            height=5.5,
            depth=0.65,
            segments=10,
        )

        xs = [vertex[0] for vertex in arch.vertices]
        zs = [vertex[2] for vertex in arch.vertices]
        self.assertLessEqual(min(xs), -1.99)
        self.assertGreaterEqual(max(xs), 1.99)
        self.assertGreater(max(zs) - min(zs), 5.4)
        self.assertLess(sum(len(face) - 2 for face in arch.faces), 180)

    def test_arch_arc_supports_a_broken_partial_crown(self) -> None:
        arc = MeshAccumulator()
        append_arch_arc(
            arc,
            center=Vector((0.0, 0.0, 0.0)),
            width=4.0,
            height=5.5,
            depth=0.65,
            start_angle=0.28,
            end_angle=2.2,
            segments=7,
        )

        self.assertEqual(len(arc.vertices), 32)
        self.assertEqual(len(arc.faces), 30)
        self.assertLess(min(vertex[0] for vertex in arc.vertices), 0.0)
        self.assertGreater(max(vertex[0] for vertex in arc.vertices), 0.0)

    def test_stair_run_has_one_named_step_volume_per_riser(self) -> None:
        stairs = MeshAccumulator()
        append_stair_run(
            stairs,
            origin=Vector((-2.0, 0.0, -1.0)),
            step_count=18,
            width=2.4,
            tread_depth=0.28,
            riser_height=0.18,
        )

        self.assertEqual(len(stairs.vertices), 18 * 8)
        self.assertEqual(len(stairs.faces), 18 * 6)
        self.assertGreater(max(vertex[2] for vertex in stairs.vertices), 2.1)

    def test_monolith_uses_a_chamfered_closed_silhouette(self) -> None:
        monolith = MeshAccumulator()
        append_rounded_monolith(
            monolith,
            center=Vector((0.0, 0.0, 0.0)),
            width=2.0,
            height=6.0,
            depth=0.75,
            corner_radius=0.22,
        )

        self.assertEqual(len(monolith.vertices), 16)
        self.assertEqual(len(monolith.faces), 10)
        self.assertEqual(len({round(vertex[2], 3) for vertex in monolith.vertices}), 4)


class MaterialAndExportTests(unittest.TestCase):
    def setUp(self) -> None:
        reset_scene()

    def test_marble_material_uses_the_shared_asset_defaults(self) -> None:
        material = create_marble_material()
        node = material.node_tree.nodes.get("Principled BSDF")

        self.assertEqual(material.name, "Marble_Base")
        self.assertAlmostEqual(node.inputs["Roughness"].default_value, 0.4)
        self.assertAlmostEqual(node.inputs["Metallic"].default_value, 0.0)
        self.assertAlmostEqual(node.inputs["IOR"].default_value, 1.47)

    def test_gltf_transform_command_preserves_named_objects(self) -> None:
        command = build_gltf_transform_command(
            Path("source.glb"),
            Path("optimized.glb"),
        )

        self.assertEqual(command[:4], ["npx", "--yes", "@gltf-transform/cli", "optimize"])
        self.assertIn("draco", command)
        self.assertIn("--flatten", command)
        self.assertIn("false", command)
        self.assertIn("--join", command)
        self.assertIn("--instance", command)

    def test_budget_validation_rejects_limit_and_oversize_assets(self) -> None:
        budget = CompressionBudget(max_bytes=8, max_triangles=10)
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "asset.glb"
            output_path.write_bytes(b"12345678")

            with self.assertRaisesRegex(ValueError, "size budget"):
                validate_asset_budget(output_path, triangle_count=9, budget=budget)

            output_path.write_bytes(b"1234567")
            with self.assertRaisesRegex(ValueError, "triangle budget"):
                validate_asset_budget(output_path, triangle_count=10, budget=budget)


class TurntableRigTests(unittest.TestCase):
    def setUp(self) -> None:
        reset_scene()

    def test_turntable_rig_has_six_orbit_positions_and_three_lights(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            camera = configure_turntable_rig(Path(directory))

        positions = orbit_camera_positions()
        interior_targets = orbit_camera_targets(
            config=TurntableConfig(orbit_target_radius=6.0)
        )
        descending_positions = orbit_camera_positions(
            config=TurntableConfig(camera_height_offsets=(3.0, 2.0, 1.0, 0.0, -1.0, -2.0))
        )
        lights = [obj for obj in bpy.context.scene.objects if obj.type == "LIGHT"]
        self.assertEqual(camera.name, "Turntable_Camera")
        self.assertEqual(len(positions), 6)
        self.assertEqual(len(lights), 3)
        self.assertTrue(all(abs(Vector(position).length - 15.02) < 0.1 for position in positions))
        self.assertEqual(len(interior_targets), 6)
        self.assertTrue(all(abs(Vector(target).xy.length - 6.0) < 0.01 for target in interior_targets))
        self.assertGreater(descending_positions[0][2], descending_positions[-1][2])


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(__import__(__name__))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        raise SystemExit(1)
