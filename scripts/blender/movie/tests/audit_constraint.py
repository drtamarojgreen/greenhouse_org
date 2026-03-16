import bpy

print("\n--- Shrinkwrap Constraint Audit ---")
obj = bpy.data.objects.new("AuditObj", None)
con = obj.constraints.new('SHRINKWRAP')
print(f"Constraint type: {type(con)}")
print("Available attributes:")
for attr in dir(con):
    if not attr.startswith("_"):
        print(f"  {attr}")
bpy.data.objects.remove(obj)
