"""Shared headless-Blender helpers for deterministic web assets."""

from __future__ import annotations

import math
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence

import bpy
from mathutils import Vector


@dataclass(frozen=True)
class CompressionBudget:
    """Strict upper bounds for compressed web assets."""

    max_bytes: int = 3 * 1024 * 1024
    max_triangles: int = 150_000


@dataclass(frozen=True)
class AssetStats:
    """Measured output information returned after export."""

    size_bytes: int
    triangle_count: int
    object_names: tuple[str, ...]


@dataclass
class MeshAccumulator:
    """Collect mesh primitives before creating a Blender object."""

    vertices: list[tuple[float, float, float]] = field(default_factory=list)
    faces: list[tuple[int, ...]] = field(default_factory=list)

    def append(
        self,
        vertices: Iterable[Vector],
        faces: Iterable[tuple[int, ...]],
    ) -> None:
        offset = len(self.vertices)
        self.vertices.extend(tuple(vertex) for vertex in vertices)
        self.faces.extend(tuple(index + offset for index in face) for face in faces)


@dataclass(frozen=True)
class FeatherTemplate:
    """Reusable local-space feather mesh aligned on positive X."""

    vertices: tuple[Vector, ...]
    faces: tuple[tuple[int, ...], ...]


@dataclass(frozen=True)
class CurvedPanelTemplate:
    """Closed cylindrical panel with one continuous outer-face UV strip."""

    vertices: tuple[Vector, ...]
    faces: tuple[tuple[int, ...], ...]
    loop_uvs: tuple[tuple[float, float], ...]


def reset_scene() -> None:
    """Remove objects and reusable datablocks from the current scene."""

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            datablocks.remove(datablock)


def create_marble_material(
    name: str = "Marble_Base",
    base_color: tuple[float, float, float, float] = (0.913, 0.890, 0.851, 1.0),
    roughness: float = 0.4,
) -> bpy.types.Material:
    """Create the texture-free marble base expected by the R3F material."""

    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = base_color
    node = material.node_tree.nodes.get("Principled BSDF")
    if node is None:
        raise RuntimeError("Blender did not create a Principled BSDF node")
    node.inputs["Base Color"].default_value = base_color
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = 0.0
    node.inputs["IOR"].default_value = 1.47
    return material


def make_feather_template(
    width: float,
    curl: float,
    asymmetry: float = 0.0,
    length: float = 1.0,
) -> FeatherTemplate:
    """Build a closed low-poly feather with a ridge, shallow V, and quill."""

    longitudinal_segments = 12
    cross_sections = (-1.0, -0.52, 0.0, 0.52, 1.0)
    front: list[Vector] = []
    back: list[Vector] = []

    for segment in range(longitudinal_segments + 1):
        progress = segment / longitudinal_segments
        envelope = 0.11 + 0.89 * math.sin(math.pi * progress) ** 0.58
        tip = 1.0 - max(0.0, (progress - 0.8) / 0.2) * 0.86
        local_width = width * envelope * tip
        center_curve = curl * math.sin(math.pi * progress) ** 1.3
        for cross in cross_sections:
            z = cross * local_width + center_curve
            z += asymmetry * cross * math.sin(math.pi * progress)
            ridge = 0.07 * (1.0 - abs(cross) ** 0.7) * math.sin(math.pi * progress)
            arch = 0.022 * (1.0 - cross * cross) * math.sin(math.pi * progress)
            front.append(Vector((progress * length, -0.026 - ridge - arch, z)))
            back.append(Vector((progress * length, 0.026, z)))

    vertices = front + back
    row_width = len(cross_sections)
    surface_count = len(front)
    faces: list[tuple[int, ...]] = []
    for segment in range(longitudinal_segments):
        for cross_index in range(row_width - 1):
            a = segment * row_width + cross_index
            b = a + 1
            c = a + row_width
            d = c + 1
            faces.extend(((a, c, d), (a, d, b)))
            faces.extend(
                (
                    (a + surface_count, d + surface_count, c + surface_count),
                    (a + surface_count, b + surface_count, d + surface_count),
                )
            )

    for cross_index in (0, row_width - 1):
        for segment in range(longitudinal_segments):
            a = segment * row_width + cross_index
            b = (segment + 1) * row_width + cross_index
            faces.append((a, a + surface_count, b + surface_count, b))
    for segment in (0, longitudinal_segments):
        start = segment * row_width
        for cross_index in range(row_width - 1):
            a = start + cross_index
            b = a + 1
            faces.append((a, b, b + surface_count, a + surface_count))

    quill = len(vertices)
    vertices.extend(
        (
            Vector((-0.22, -0.042, -0.016)),
            Vector((0.28, -0.042, -0.012)),
            Vector((0.28, -0.042, 0.012)),
            Vector((-0.22, -0.042, 0.016)),
            Vector((-0.22, 0.018, -0.016)),
            Vector((0.28, 0.018, -0.012)),
            Vector((0.28, 0.018, 0.012)),
            Vector((-0.22, 0.018, 0.016)),
        )
    )
    faces.extend(
        tuple(quill + index for index in face)
        for face in (
            (0, 1, 2, 3),
            (4, 7, 6, 5),
            (0, 4, 5, 1),
            (1, 5, 6, 2),
            (2, 6, 7, 3),
            (3, 7, 4, 0),
        )
    )
    return FeatherTemplate(tuple(vertices), tuple(faces))


def make_curved_panel_template(
    radius: float,
    height: float,
    sweep_degrees: float,
    segments: int,
    thickness: float,
) -> CurvedPanelTemplate:
    """Build a deterministic, closed, UV-mapped cylindrical panel around Z."""

    if segments < 3:
        raise ValueError("Curved panels require at least three segments")
    if radius <= 0 or height <= 0 or thickness <= 0:
        raise ValueError("Curved panel dimensions must be positive")
    if thickness >= radius:
        raise ValueError("Curved panel thickness must be smaller than its radius")
    if not 0 < sweep_degrees <= 360:
        raise ValueError("Curved panel sweep must be within (0, 360]")

    half_height = height * 0.5
    inner_radius = radius - thickness
    start_angle = math.radians(-sweep_degrees * 0.5)
    sweep_angle = math.radians(sweep_degrees)
    is_full_sweep = sweep_degrees == 360.0
    ring_count = segments if is_full_sweep else segments + 1
    vertices: list[Vector] = []
    for index in range(ring_count):
        angle = start_angle + sweep_angle * index / segments
        sine = math.sin(angle)
        cosine = math.cos(angle)
        for current_radius in (radius, inner_radius):
            x = current_radius * sine
            y = -current_radius * cosine
            vertices.extend(
                (
                    Vector((x, y, -half_height)),
                    Vector((x, y, half_height)),
                )
            )

    faces: list[tuple[int, ...]] = []
    loop_uvs: list[tuple[float, float]] = []
    for index in range(segments):
        current = index * 4
        following = ((index + 1) % ring_count) * 4
        u0 = index / segments
        u1 = (index + 1) / segments
        faces.append((current, following, following + 1, current + 1))
        loop_uvs.extend(((u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)))
        faces.append((current + 2, current + 3, following + 3, following + 2))
        loop_uvs.extend(((u0, 0.0), (u0, 1.0), (u1, 1.0), (u1, 0.0)))
        faces.append((current + 1, following + 1, following + 3, current + 3))
        loop_uvs.extend(((u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)))
        faces.append((current, current + 2, following + 2, following))
        loop_uvs.extend(((u0, 0.0), (u0, 1.0), (u1, 1.0), (u1, 0.0)))

    if not is_full_sweep:
        end = segments * 4
        faces.append((0, 1, 3, 2))
        loop_uvs.extend(((0.0, 0.0), (0.0, 1.0), (1.0, 1.0), (1.0, 0.0)))
        faces.append((end, end + 2, end + 3, end + 1))
        loop_uvs.extend(((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)))
    return CurvedPanelTemplate(tuple(vertices), tuple(faces), tuple(loop_uvs))


def create_mesh_object(
    name: str,
    accumulator: MeshAccumulator,
    material: bpy.types.Material,
    loop_uvs: Sequence[tuple[float, float]] | None = None,
) -> bpy.types.Object:
    """Create a smooth named object with its pivot at local bounds center."""

    if not accumulator.vertices:
        raise ValueError(f"Cannot create empty mesh object: {name}")
    minimum = Vector(
        tuple(min(vertex[axis] for vertex in accumulator.vertices) for axis in range(3))
    )
    maximum = Vector(
        tuple(max(vertex[axis] for vertex in accumulator.vertices) for axis in range(3))
    )
    pivot = (minimum + maximum) * 0.5
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(
        [Vector(vertex) - pivot for vertex in accumulator.vertices],
        [],
        accumulator.faces,
    )
    mesh.materials.append(material)
    mesh.update()
    if loop_uvs is not None:
        if len(loop_uvs) != len(mesh.loops):
            raise ValueError(f"UV loop count does not match mesh loops for {name}")
        uv_layer = mesh.uv_layers.new(name="UVMap")
        for loop, uv in zip(uv_layer.data, loop_uvs, strict=True):
            loop.uv = uv
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    obj.location = pivot
    bpy.context.collection.objects.link(obj)
    return obj


def count_triangles(objects: Iterable[bpy.types.Object]) -> int:
    return sum(
        len(polygon.vertices) - 2
        for obj in objects
        for polygon in obj.data.polygons
    )


def build_gltf_transform_command(input_path: Path, output_path: Path) -> list[str]:
    """Build the name-preserving Draco optimization command."""

    return [
        "npx",
        "--yes",
        "@gltf-transform/cli",
        "optimize",
        str(input_path),
        str(output_path),
        "--compress",
        "draco",
        "--flatten",
        "false",
        "--join",
        "false",
        "--instance",
        "false",
        "--prune-attributes",
        "false",
        "--simplify",
        "false",
    ]


def export_and_compress_glb(
    objects: Sequence[bpy.types.Object],
    output_path: Path,
    budget: CompressionBudget = CompressionBudget(),
) -> AssetStats:
    """Export named objects, Draco-compress atomically, and enforce budgets."""

    triangle_count = count_triangles(objects)
    if triangle_count >= budget.max_triangles:
        raise ValueError("Asset exceeds triangle budget before export")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    optimized = output_path.with_name(f"{output_path.stem}.optimized.glb")
    try:
        subprocess.run(build_gltf_transform_command(output_path, optimized), check=True)
        optimized.replace(output_path)
    finally:
        optimized.unlink(missing_ok=True)
    size_bytes = output_path.stat().st_size
    if size_bytes >= budget.max_bytes:
        raise ValueError("Asset exceeds size budget")
    return AssetStats(
        size_bytes=size_bytes,
        triangle_count=triangle_count,
        object_names=tuple(obj.name for obj in objects),
    )
