"""Reusable Blender helpers for procedural, web-ready 3D assets.

This module intentionally owns the low-level geometry primitives, shared marble
material, GLB export/compression contract, and six-view turntable rig. Individual
asset builders should keep only their reference-specific layout and fracture
decisions.
"""

from __future__ import annotations

import math
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence

import bpy
from mathutils import Vector


DEFAULT_ORBIT_ANGLES = (-18.0, -8.0, 0.0, 8.0, 18.0, 30.0)


@dataclass(frozen=True)
class CompressionBudget:
    """Strict upper bounds for a compressed web asset."""

    max_bytes: int = 3 * 1024 * 1024
    max_triangles: int = 150_000


@dataclass(frozen=True)
class AssetStats:
    """Measured output information returned after export and compression."""

    size_bytes: int
    triangle_count: int
    object_names: tuple[str, ...]


@dataclass
class MeshAccumulator:
    """Collect mesh primitives before creating one named Blender object."""

    vertices: list[tuple[float, float, float]] = field(default_factory=list)
    faces: list[tuple[int, ...]] = field(default_factory=list)

    def append(
        self,
        vertices: Iterable[Vector],
        faces: Iterable[tuple[int, ...]],
    ) -> None:
        """Append geometry while offsetting the incoming face indices."""

        offset = len(self.vertices)
        self.vertices.extend(tuple(vertex) for vertex in vertices)
        self.faces.extend(tuple(index + offset for index in face) for face in faces)


@dataclass(frozen=True)
class FeatherTemplate:
    """Reusable local-space feather mesh."""

    vertices: tuple[Vector, ...]
    faces: tuple[tuple[int, ...], ...]


@dataclass(frozen=True)
class TurntableConfig:
    """Rendering defaults for reference-comparison turntables."""

    resolution: tuple[int, int] = (960, 540)
    lens_millimeters: float = 52.0
    radius: float = 15.0
    camera_height: float = 0.78
    camera_target: tuple[float, float, float] = (0.0, 0.0, 0.42)
    light_target: tuple[float, float, float] = (0.0, 0.0, 0.45)
    orbit_angles: tuple[float, ...] = DEFAULT_ORBIT_ANGLES
    orbit_target_radius: float = 0.0
    camera_height_offsets: tuple[float, ...] = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    target_height_offsets: tuple[float, ...] = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


def reset_scene() -> None:
    """Remove objects and reusable datablocks from the current Blender scene."""

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    datablock_collections = (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    )
    for datablocks in datablock_collections:
        for datablock in list(datablocks):
            datablocks.remove(datablock)


def create_marble_material(
    name: str = "Marble_Base",
    base_color: tuple[float, float, float, float] = (0.913, 0.890, 0.851, 1.0),
    roughness: float = 0.4,
) -> bpy.types.Material:
    """Create the texture-free marble base expected by the R3F shader."""

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
    damaged: bool = False,
) -> FeatherTemplate:
    """Build a low-poly, ridged feather blade with a small quill."""

    longitudinal_segments = 10
    cross_sections = (-1.0, -0.48, 0.0, 0.48, 1.0)
    top: list[Vector] = []
    bottom: list[Vector] = []

    for segment in range(longitudinal_segments + 1):
        u = segment / longitudinal_segments
        envelope = 0.12 + 0.88 * math.sin(math.pi * u) ** 0.52
        tip_taper = 1.0 - max(0.0, (u - 0.82) / 0.18) * 0.78
        local_width = width * envelope * tip_taper
        if damaged and u > 0.78:
            local_width *= 0.78 + 0.16 * math.sin(segment * 4.7)
        center_curve = curl * math.sin(math.pi * u) ** 1.35

        for cross in cross_sections:
            edge_bias = asymmetry * cross * math.sin(math.pi * u)
            z = cross * local_width + center_curve + edge_bias
            ridge = 0.082 * (1.0 - abs(cross) ** 0.72) * math.sin(math.pi * u)
            vane_arch = 0.018 * (1.0 - cross * cross) * math.sin(math.pi * u)
            top.append(Vector((u, -0.024 - ridge - vane_arch, z)))
            bottom.append(Vector((u, 0.024, z)))

    vertices = top + bottom
    row_width = len(cross_sections)
    surface_count = len(top)
    faces: list[tuple[int, ...]] = []

    for segment in range(longitudinal_segments):
        for cross_index in range(row_width - 1):
            a = segment * row_width + cross_index
            b = a + 1
            c = a + row_width
            d = c + 1
            faces.extend(((a, c, d), (a, d, b)))

            back_a = a + surface_count
            back_b = b + surface_count
            back_c = c + surface_count
            back_d = d + surface_count
            faces.extend(((back_a, back_d, back_c), (back_a, back_b, back_d)))

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

    quill_start = len(vertices)
    vertices.extend(
        (
            Vector((-0.18, -0.052, -0.023)),
            Vector((0.34, -0.052, -0.018)),
            Vector((0.34, -0.052, 0.018)),
            Vector((-0.18, -0.052, 0.023)),
            Vector((-0.18, 0.020, -0.023)),
            Vector((0.34, 0.020, -0.018)),
            Vector((0.34, 0.020, 0.018)),
            Vector((-0.18, 0.020, 0.023)),
        )
    )
    faces.extend(
        tuple(quill_start + index for index in face)
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


def transform_feather(
    template: FeatherTemplate,
    origin: Vector,
    side: int,
    elevation: float,
    length: float,
    width_scale: float,
    depth_tilt: float,
    twist: float,
) -> tuple[list[Vector], tuple[tuple[int, ...], ...]]:
    """Transform a local feather template into a placed asset primitive."""

    direction = Vector(
        (
            side * math.cos(elevation) * math.cos(depth_tilt),
            math.sin(depth_tilt),
            math.sin(elevation) * math.cos(depth_tilt),
        )
    ).normalized()
    width_axis = Vector(
        (-math.sin(elevation), 0.0, side * math.cos(elevation))
    ).normalized()
    normal_axis = width_axis.cross(direction).normalized()
    cos_twist = math.cos(twist)
    sin_twist = math.sin(twist)
    twisted_width = width_axis * cos_twist + normal_axis * sin_twist
    twisted_normal = normal_axis * cos_twist - width_axis * sin_twist

    transformed = [
        origin
        + direction * (vertex.x * length)
        + twisted_normal * (vertex.y * max(0.65, width_scale))
        + twisted_width * (vertex.z * width_scale)
        for vertex in template.vertices
    ]
    return transformed, template.faces


def append_tetrahedral_fragment(
    accumulator: MeshAccumulator,
    center: Vector,
    radius: float,
) -> None:
    """Append one irregular closed chip suitable for a fracture edge."""

    vertices = (
        center + Vector((-radius, -0.04, -radius * 0.6)),
        center + Vector((radius * 0.7, -0.02, -radius)),
        center + Vector((radius, 0.03, radius * 0.65)),
        center + Vector((-radius * 0.45, 0.05, radius)),
    )
    faces = ((0, 1, 2), (0, 3, 1), (1, 3, 2), (2, 3, 0))
    accumulator.append(vertices, faces)


def append_box(
    accumulator: MeshAccumulator,
    center: Vector,
    size: Vector,
) -> None:
    """Append one closed axis-aligned box to an accumulator."""

    half = size * 0.5
    vertices = tuple(
        center + Vector((x * half.x, y * half.y, z * half.z))
        for x, y, z in (
            (-1, -1, -1),
            (1, -1, -1),
            (1, 1, -1),
            (-1, 1, -1),
            (-1, -1, 1),
            (1, -1, 1),
            (1, 1, 1),
            (-1, 1, 1),
        )
    )
    faces = (
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    )
    accumulator.append(vertices, faces)


def append_chamfered_box(
    accumulator: MeshAccumulator,
    center: Vector,
    size: Vector,
    chamfer: float,
) -> None:
    """Append a closed box with chamfered corners in its front-facing X/Z profile."""

    half = size * 0.5
    inset = min(chamfer, half.x * 0.45, half.z * 0.45)
    if inset <= 0.0:
        append_box(accumulator, center, size)
        return

    profile = (
        (-half.x + inset, -half.z),
        (half.x - inset, -half.z),
        (half.x, -half.z + inset),
        (half.x, half.z - inset),
        (half.x - inset, half.z),
        (-half.x + inset, half.z),
        (-half.x, half.z - inset),
        (-half.x, -half.z + inset),
    )
    vertices = tuple(
        center + Vector((x, y, z))
        for y in (-half.y, half.y)
        for x, z in profile
    )
    faces: list[tuple[int, ...]] = [
        tuple(reversed(range(8))),
        tuple(range(8, 16)),
    ]
    for index in range(8):
        following = (index + 1) % 8
        faces.append((index, following, following + 8, index + 8))
    accumulator.append(vertices, faces)


def append_fractured_box(
    accumulator: MeshAccumulator,
    center: Vector,
    size: Vector,
    negative_end_offsets: Sequence[float] = (0.0, 0.0, 0.0, 0.0),
    positive_end_offsets: Sequence[float] = (0.0, 0.0, 0.0, 0.0),
) -> None:
    """Append a closed beam whose X-facing ends have irregular fracture planes."""

    if len(negative_end_offsets) != 4 or len(positive_end_offsets) != 4:
        raise ValueError("Fracture end offsets must each contain four values")
    half = size * 0.5
    yz_corners = (
        (-half.y, -half.z),
        (half.y, -half.z),
        (half.y, half.z),
        (-half.y, half.z),
    )
    vertices = tuple(
        center + Vector((-half.x + negative_end_offsets[index], y, z))
        for index, (y, z) in enumerate(yz_corners)
    ) + tuple(
        center + Vector((half.x + positive_end_offsets[index], y, z))
        for index, (y, z) in enumerate(yz_corners)
    )
    faces = (
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    )
    accumulator.append(vertices, faces)


def append_cylinder(
    accumulator: MeshAccumulator,
    center: Vector,
    radius: float,
    depth: float,
    segments: int = 12,
    radial_wave: float = 0.0,
    radial_frequency: int = 8,
) -> None:
    """Append a closed vertical low-poly cylinder with optional shallow fluting."""

    if segments < 3:
        raise ValueError("Cylinder segments must be at least three")
    half_depth = depth * 0.5
    bottom: list[Vector] = []
    top: list[Vector] = []
    for index in range(segments):
        angle = math.tau * index / segments
        local_radius = radius * (
            1.0 + radial_wave * math.cos(radial_frequency * angle)
        )
        offset = Vector((math.cos(angle) * local_radius, math.sin(angle) * local_radius, 0.0))
        bottom.append(center + offset + Vector((0.0, 0.0, -half_depth)))
        top.append(center + offset + Vector((0.0, 0.0, half_depth)))

    faces: list[tuple[int, ...]] = []
    for index in range(segments):
        next_index = (index + 1) % segments
        faces.append((index, next_index, next_index + segments, index + segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple(range(segments, segments * 2)))
    accumulator.append((*bottom, *top), faces)


def append_arch_segment(
    accumulator: MeshAccumulator,
    center: Vector,
    width: float,
    height: float,
    depth: float,
    segments: int = 10,
    opening_ratio: float = 0.56,
) -> None:
    """Append a tall open arch with two piers and a low-poly half-ring crown."""

    if segments < 4:
        raise ValueError("Arch segments must be at least four")
    if not 0.35 <= opening_ratio <= 0.78:
        raise ValueError("Arch opening ratio must preserve visible piers")

    outer_radius = width * 0.5
    inner_radius = width * opening_ratio * 0.5
    bottom_z = center.z - height * 0.5
    arch_center_z = center.z + height * 0.5 - outer_radius
    pier_height = arch_center_z - bottom_z
    if pier_height <= 0.0:
        raise ValueError("Arch height must exceed half its width")
    pier_width = (width - width * opening_ratio) * 0.5
    pier_center_x = inner_radius + pier_width * 0.5
    pier_center_z = bottom_z + pier_height * 0.5
    for side in (-1.0, 1.0):
        append_box(
            accumulator,
            center=Vector(
                (
                    center.x + side * pier_center_x,
                    center.y,
                    pier_center_z,
                )
            ),
            size=Vector((pier_width, depth, pier_height)),
        )

    half_depth = depth * 0.5
    vertices: list[Vector] = []
    for index in range(segments + 1):
        angle = math.pi - math.pi * index / segments
        cosine = math.cos(angle)
        sine = math.sin(angle)
        for y, radius in (
            (-half_depth, outer_radius),
            (-half_depth, inner_radius),
            (half_depth, outer_radius),
            (half_depth, inner_radius),
        ):
            vertices.append(
                Vector(
                    (
                        center.x + cosine * radius,
                        center.y + y,
                        arch_center_z + sine * radius,
                    )
                )
            )

    faces: list[tuple[int, ...]] = []
    for index in range(segments):
        current = index * 4
        following = (index + 1) * 4
        faces.extend(
            (
                (current, following, following + 1, current + 1),
                (current + 2, current + 3, following + 3, following + 2),
                (current, current + 2, following + 2, following),
                (current + 1, following + 1, following + 3, current + 3),
            )
        )
    final = segments * 4
    faces.extend(((0, 1, 3, 2), (final, final + 2, final + 3, final + 1)))
    accumulator.append(vertices, faces)


def append_arch_arc(
    accumulator: MeshAccumulator,
    center: Vector,
    width: float,
    height: float,
    depth: float,
    start_angle: float,
    end_angle: float,
    segments: int = 10,
    opening_ratio: float = 0.56,
) -> None:
    """Append a partial arch crown for broken, open architectural silhouettes."""

    if segments < 2:
        raise ValueError("An arch arc needs at least two segments")
    if not 0.35 <= opening_ratio <= 0.78:
        raise ValueError("Arch opening ratio must preserve visible crown thickness")
    if end_angle <= start_angle:
        raise ValueError("Arch arc end angle must be greater than start angle")

    outer_radius = width * 0.5
    inner_radius = width * opening_ratio * 0.5
    arch_center_z = center.z + height * 0.5 - outer_radius
    half_depth = depth * 0.5
    vertices: list[Vector] = []
    for index in range(segments + 1):
        angle = start_angle + (end_angle - start_angle) * index / segments
        cosine = math.cos(angle)
        sine = math.sin(angle)
        for y, radius in (
            (-half_depth, outer_radius),
            (-half_depth, inner_radius),
            (half_depth, outer_radius),
            (half_depth, inner_radius),
        ):
            vertices.append(
                Vector(
                    (
                        center.x + cosine * radius,
                        center.y + y,
                        arch_center_z + sine * radius,
                    )
                )
            )

    faces: list[tuple[int, ...]] = []
    for index in range(segments):
        current = index * 4
        following = (index + 1) * 4
        faces.extend(
            (
                (current, following, following + 1, current + 1),
                (current + 2, current + 3, following + 3, following + 2),
                (current, current + 2, following + 2, following),
                (current + 1, following + 1, following + 3, current + 3),
            )
        )
    final = segments * 4
    faces.extend(((0, 1, 3, 2), (final, final + 2, final + 3, final + 1)))
    accumulator.append(vertices, faces)


def append_stair_run(
    accumulator: MeshAccumulator,
    origin: Vector,
    step_count: int,
    width: float,
    tread_depth: float,
    riser_height: float,
) -> None:
    """Append a solid stair run rising in local positive X."""

    if step_count < 1:
        raise ValueError("A stair run needs at least one step")
    for index in range(step_count):
        height = (index + 1) * riser_height
        append_box(
            accumulator,
            center=Vector(
                (
                    origin.x + (index + 0.5) * tread_depth,
                    origin.y,
                    origin.z + height * 0.5,
                )
            ),
            size=Vector((tread_depth, width, height)),
        )


def append_rounded_monolith(
    accumulator: MeshAccumulator,
    center: Vector,
    width: float,
    height: float,
    depth: float,
    corner_radius: float,
) -> None:
    """Append a closed chamfered slab used as a low-poly monolith primitive."""

    radius = min(corner_radius, width * 0.24, height * 0.12)
    half_width = width * 0.5
    half_height = height * 0.5
    profile = (
        (-half_width + radius, -half_height),
        (half_width - radius, -half_height),
        (half_width, -half_height + radius),
        (half_width, half_height - radius),
        (half_width - radius, half_height),
        (-half_width + radius, half_height),
        (-half_width, half_height - radius),
        (-half_width, -half_height + radius),
    )
    vertices = tuple(
        center + Vector((x, y, z))
        for y in (-depth * 0.5, depth * 0.5)
        for x, z in profile
    )
    faces: list[tuple[int, ...]] = [
        tuple(reversed(range(8))),
        tuple(range(8, 16)),
    ]
    for index in range(8):
        next_index = (index + 1) % 8
        faces.append((index, next_index, next_index + 8, index + 8))
    accumulator.append(vertices, faces)


def create_mesh_object(
    name: str,
    accumulator: MeshAccumulator,
    material: bpy.types.Material,
    smooth: bool = True,
) -> bpy.types.Object:
    """Create a smooth named object with a local pivot at its bounding center."""

    if not accumulator.vertices:
        raise ValueError(f"Cannot create empty mesh object: {name}")
    min_corner = Vector(
        tuple(min(vertex[axis] for vertex in accumulator.vertices) for axis in range(3))
    )
    max_corner = Vector(
        tuple(max(vertex[axis] for vertex in accumulator.vertices) for axis in range(3))
    )
    pivot = (min_corner + max_corner) * 0.5
    local_vertices = [Vector(vertex) - pivot for vertex in accumulator.vertices]

    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(local_vertices, [], accumulator.faces)
    mesh.materials.append(material)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = smooth

    obj = bpy.data.objects.new(name, mesh)
    obj.location = pivot
    bpy.context.collection.objects.link(obj)
    return obj


def count_triangles(objects: Iterable[bpy.types.Object]) -> int:
    """Count triangles after triangulating each polygon logically."""

    return sum(
        len(polygon.vertices) - 2
        for obj in objects
        for polygon in obj.data.polygons
    )


def export_glb(objects: Sequence[bpy.types.Object], output_path: Path) -> None:
    """Export selected named objects without flattening their hierarchy."""

    if not objects:
        raise ValueError("At least one object is required for GLB export")
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


def build_gltf_transform_command(
    input_path: Path,
    output_path: Path,
) -> list[str]:
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
        "--simplify",
        "false",
    ]


def compress_glb(output_path: Path) -> None:
    """Draco-compress a GLB through a temporary file and replace atomically."""

    optimized_path = output_path.with_name(f"{output_path.stem}.optimized.glb")
    command = build_gltf_transform_command(output_path, optimized_path)
    try:
        subprocess.run(command, check=True)
        optimized_path.replace(output_path)
    except (OSError, subprocess.CalledProcessError) as error:
        optimized_path.unlink(missing_ok=True)
        raise RuntimeError(f"GLB compression failed: {output_path}") from error


def validate_asset_budget(
    output_path: Path,
    triangle_count: int,
    budget: CompressionBudget,
) -> None:
    """Enforce strict size and triangle limits after compression."""

    size_bytes = output_path.stat().st_size
    if size_bytes >= budget.max_bytes:
        raise ValueError(
            f"Asset exceeds size budget: {size_bytes} >= {budget.max_bytes} bytes"
        )
    if triangle_count >= budget.max_triangles:
        raise ValueError(
            "Asset exceeds triangle budget: "
            f"{triangle_count} >= {budget.max_triangles}"
        )


def export_and_compress_glb(
    objects: Sequence[bpy.types.Object],
    output_path: Path,
    budget: CompressionBudget = CompressionBudget(),
) -> AssetStats:
    """Export, Draco-compress, validate, and summarize a web GLB."""

    triangle_count = count_triangles(objects)
    if triangle_count >= budget.max_triangles:
        raise ValueError(
            "Asset exceeds triangle budget before export: "
            f"{triangle_count} >= {budget.max_triangles}"
        )
    export_glb(objects, output_path)
    compress_glb(output_path)
    validate_asset_budget(output_path, triangle_count, budget)
    return AssetStats(
        size_bytes=output_path.stat().st_size,
        triangle_count=triangle_count,
        object_names=tuple(obj.name for obj in objects),
    )


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    """Aim a camera or light's negative Z axis at a target."""

    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    color: tuple[float, float, float],
    energy: float,
    size: float,
    target: Vector,
) -> bpy.types.Object:
    """Add one targeted disk area light and return its object."""

    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    light = bpy.data.objects.new(name, data)
    light.location = location
    look_at(light, target)
    bpy.context.collection.objects.link(light)
    return light


def configure_turntable_rig(
    output_directory: Path,
    config: TurntableConfig = TurntableConfig(),
) -> bpy.types.Object:
    """Configure a warm product-lighting scene and return its camera."""

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = config.resolution[0]
    scene.render.resolution_y = config.resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.filepath = str(output_directory / "turntable-01.png")

    world = bpy.data.worlds.get("Warm_Ivory_World")
    if world is None:
        world = bpy.data.worlds.new("Warm_Ivory_World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background is None:
        raise RuntimeError("Blender did not create a World Background node")
    background.inputs["Color"].default_value = (1.0, 0.93, 0.82, 1.0)
    background.inputs["Strength"].default_value = 0.72

    target = Vector(config.light_target)
    add_area_light(
        "Warm_Key",
        (5.8, -4.8, 7.5),
        (1.0, 0.72, 0.42),
        720.0,
        4.5,
        target,
    )
    add_area_light(
        "Cool_Fill",
        (-5.5, -1.5, 3.5),
        (0.62, 0.72, 0.86),
        330.0,
        5.5,
        target,
    )
    add_area_light(
        "Rim",
        (1.4, 4.0, 4.8),
        (1.0, 0.86, 0.63),
        520.0,
        3.4,
        target,
    )

    camera_data = bpy.data.cameras.new("Turntable_Camera")
    camera_data.lens = config.lens_millimeters
    camera_data.sensor_width = 36
    camera_data.dof.use_dof = False
    camera = bpy.data.objects.new("Turntable_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    return camera


def orbit_camera_positions(
    config: TurntableConfig = TurntableConfig(),
) -> tuple[tuple[float, float, float], ...]:
    """Return the six deterministic camera positions for comparison renders."""

    if len(config.camera_height_offsets) != len(config.orbit_angles):
        raise ValueError("Camera height offsets must match orbit angle count")
    return tuple(
        (
            math.sin(math.radians(degrees)) * config.radius,
            -math.cos(math.radians(degrees)) * config.radius,
            config.camera_height + config.camera_height_offsets[index],
        )
        for index, degrees in enumerate(config.orbit_angles)
    )


def orbit_camera_targets(
    config: TurntableConfig = TurntableConfig(),
) -> tuple[tuple[float, float, float], ...]:
    """Return per-view targets, optionally looking across an interior orbit."""

    base = Vector(config.camera_target)
    if len(config.target_height_offsets) != len(config.orbit_angles):
        raise ValueError("Target height offsets must match orbit angle count")
    return tuple(
        (
            base.x - math.sin(math.radians(degrees)) * config.orbit_target_radius,
            base.y + math.cos(math.radians(degrees)) * config.orbit_target_radius,
            base.z + config.target_height_offsets[index],
        )
        for index, degrees in enumerate(config.orbit_angles)
    )


def render_turntable_orbit(
    camera: bpy.types.Object,
    output_directory: Path,
    config: TurntableConfig = TurntableConfig(),
) -> None:
    """Render the configured six-view orbit to numbered PNG files."""

    output_directory.mkdir(parents=True, exist_ok=True)
    targets = orbit_camera_targets(config)
    for index, (position, target) in enumerate(
        zip(orbit_camera_positions(config), targets),
        start=1,
    ):
        camera.location = Vector(position)
        look_at(camera, Vector(target))
        filename = f"turntable-{index:02d}.png"
        bpy.context.scene.render.filepath = str(output_directory / filename)
        bpy.ops.render.render(write_still=True)
        print(f"Rendered {filename}")
