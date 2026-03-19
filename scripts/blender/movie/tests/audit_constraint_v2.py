import bpy

print("\n--- Shrinkwrap Constraint Audit V2 ---")
obj = bpy.data.objects.new("AuditObj", None)
con = obj.constraints.new('SHRINKWRAP')

# Print all properties and their current values to find the one that defaults to 'NEAREST_SURFACEPOINT' or similar
for attr in dir(con):
    if not attr.startswith("_"):
        try:
            val = getattr(con, attr)
            print(f"  {attr}: {val}")
        except:
            pass

bpy.data.objects.remove(obj)
