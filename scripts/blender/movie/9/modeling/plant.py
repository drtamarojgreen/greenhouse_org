import movie_configuration as mc
from scripts.blender.movie.scene_utilities.modelers import PlantModeler
from scripts.blender.movie.registry import registry

# Inherit and keep local registration if needed, or just rely on shared.
# Here we just import it to ensure registry registration.
registry.register_modeling("PlantModeler", PlantModeler)
