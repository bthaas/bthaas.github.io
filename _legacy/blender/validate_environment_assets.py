"""Validate compressed environment GLBs and their interactive node contracts."""

from __future__ import annotations

import json
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import bpy


ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = int(2.5 * 1024 * 1024)
MAX_TRIANGLES = 120_000
DRACO_EXTENSION = "KHR_draco_mesh_compression"


@dataclass(frozen=True)
class AssetContract:
    """Required identity and budget contract for one environment asset."""

    path: Path
    required_nodes: frozenset[str]


CONTRACTS = (
    AssetContract(
        ROOT / "public/models/ruins-ring.glb",
        frozenset(
            {
                "ruin_arch_02",
                "ruin_arch_03",
                "ruin_column_01",
                "ruin_column_03",
                "ruin_fragment_01",
            }
        ),
    ),
    AssetContract(
        ROOT / "public/models/stair-timeline.glb",
        frozenset(f"stair_landing_{index:02d}" for index in range(1, 5)),
    ),
    AssetContract(
        ROOT / "public/models/monolith-field.glb",
        frozenset(f"monolith_{index:02d}" for index in range(1, 4)),
    ),
)


def read_glb_json(path: Path) -> dict[str, Any]:
    """Read and decode the JSON chunk from a GLB container."""

    with path.open("rb") as stream:
        magic, version, _length = struct.unpack("<4sII", stream.read(12))
        if magic != b"glTF" or version != 2:
            raise ValueError(f"Not a glTF 2.0 binary: {path}")
        chunk_length, chunk_type = struct.unpack("<II", stream.read(8))
        if chunk_type != 0x4E4F534A:
            raise ValueError(f"First GLB chunk is not JSON: {path}")
        json_chunk = stream.read(chunk_length).rstrip(b"\x00 ")
    return json.loads(json_chunk.decode("utf-8"))


def validate_contract(contract: AssetContract) -> tuple[int, int, int]:
    """Re-import an asset and enforce size, Draco, triangle, and node budgets."""

    size_bytes = contract.path.stat().st_size
    if size_bytes >= MAX_BYTES:
        raise ValueError(f"Asset exceeds compressed size budget: {contract.path}")

    document = read_glb_json(contract.path)
    if DRACO_EXTENSION not in document.get("extensionsRequired", []):
        raise ValueError(f"Asset is not Draco-compressed: {contract.path}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(contract.path))
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    object_names = {obj.name for obj in mesh_objects}
    missing_nodes = contract.required_nodes - object_names
    if missing_nodes:
        missing = ", ".join(sorted(missing_nodes))
        raise ValueError(f"Missing required nodes in {contract.path}: {missing}")

    triangle_count = sum(len(obj.data.polygons) for obj in mesh_objects)
    if triangle_count >= MAX_TRIANGLES:
        raise ValueError(f"Asset exceeds triangle budget: {contract.path}")
    return size_bytes, triangle_count, len(mesh_objects)


def main() -> None:
    """Validate every rebuilt environment and print its measured budget."""

    for contract in CONTRACTS:
        size_bytes, triangles, node_count = validate_contract(contract)
        print(
            f"{contract.path.name}: {size_bytes} bytes, {triangles} triangles, "
            f"{node_count} named mesh nodes, Draco verified"
        )


if __name__ == "__main__":
    main()
