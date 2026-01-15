
import bpy
ffmpeg = bpy.context.scene.render.ffmpeg
print("FFMPEG RNA ATTRIBUTES:")
for p in ffmpeg.bl_rna.properties:
    if p.type == 'ENUM':
        items = [i.identifier for i in p.enum_items]
        print(f"  {p.identifier}: {items}")
    else:
        print(f"  {p.identifier}: {p.type}")
