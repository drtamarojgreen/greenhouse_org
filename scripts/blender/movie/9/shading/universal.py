import movie_configuration as mc
from scripts.blender.movie.style_utilities.shaders import UniversalShader
from scripts.blender.movie.registry import registry

registry.register_shading("UniversalShader", UniversalShader)
