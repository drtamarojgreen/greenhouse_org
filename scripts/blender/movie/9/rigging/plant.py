import movie_configuration as mc
from scripts.blender.movie.scene_utilities.riggers import PlantRigger
from scripts.blender.movie.registry import registry

registry.register_rigging("PlantRigger", PlantRigger)
