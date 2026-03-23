"""
Run this script inside Blender:
  1. Open Blender
  2. Open final.blend
  3. Go to Scripting tab
  4. Open this file and click Run Script
  5. The GLB will be saved to apps/web/public/bottle.glb

It will:
 - Remove any brand text / logo objects
 - Rename materials for the liquid so the website can find it
 - Export as a single GLB file
"""

import bpy
import os

# Path to export (relative to the .blend file location)
BLEND_DIR = os.path.dirname(bpy.data.filepath)
OUTPUT_PATH = os.path.join(BLEND_DIR, "..", "apps", "web", "public", "bottle.glb")
OUTPUT_PATH = os.path.normpath(OUTPUT_PATH)

print(f"Exporting to: {OUTPUT_PATH}")

# ── Remove branding objects ────────────────────────────────────────────────────
REMOVE_KEYWORDS = ["text", "logo", "brand", "label", "valentino", "lettering"]
to_remove = []
for obj in bpy.data.objects:
    name_lower = obj.name.lower()
    if any(kw in name_lower for kw in REMOVE_KEYWORDS):
        to_remove.append(obj)
        print(f"  Removing object: {obj.name}")

bpy.ops.object.select_all(action="DESELECT")
for obj in to_remove:
    obj.select_set(True)
if to_remove:
    bpy.ops.object.delete()

# ── Rename liquid material so JS can find it ──────────────────────────────────
for mat in bpy.data.materials:
    name_lower = mat.name.lower()
    if any(kw in name_lower for kw in ["liquid", "perfume", "fluid", "juice", "eau"]):
        mat.name = "liquid"
        print(f"  Renamed material to 'liquid': {mat.name}")

# ── Gold / metal cap: rename for JS to adjust hue ────────────────────────────
for mat in bpy.data.materials:
    name_lower = mat.name.lower()
    if any(kw in name_lower for kw in ["cap", "metal", "gold", "chrome", "stopper"]):
        mat.name = "cap_metal"
        print(f"  Renamed material to 'cap_metal': {mat.name}")

# ── Export as GLB ─────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_animations=True,
    export_draco_mesh_compression_enable=True,
)

print(f"\n✓ Exported successfully to: {OUTPUT_PATH}")
print("  Next: refresh your browser at http://localhost:3000")
