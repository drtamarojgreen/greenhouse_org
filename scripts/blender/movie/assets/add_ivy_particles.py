import bpy

def add_ivy_particles(target_name="Greenhouse_Main"):
    """
    Point 94: Deferred particle system setup.
    Adds ivy particles as a separate pass after the scene is built.
    """
    target = bpy.data.objects.get(target_name)
    if not target: 
        print(f"WARNING: Target {target_name} not found for particles.")
        return
    
    # Check if already added
    if "IvyParticles" in target.modifiers:
        return

    # Deferred particle system setup
    psys_mod = target.modifiers.new(name="IvyParticles", type='PARTICLE_SYSTEM')
    settings = psys_mod.particle_system.settings
    
    settings.type = 'HAIR'
    settings.count = 200 # Lower count for efficiency
    settings.hair_length = 0.3
    settings.use_advanced_hair = True
    
    # Physics/Render settings
    settings.render_type = 'PATH'
    
    print(f"INFO: Added deferred ivy particles to {target_name}")

if __name__ == "__main__":
    add_ivy_particles()
