class ComponentRegistry:
    """Registry to map configuration strings to implementation classes."""
    def __init__(self):
        self._modeling = {}
        self._rigging = {}
        self._shading = {}
        self._animation = {}

    def register_modeling(self, name, impl): self._modeling[name] = impl
    def register_rigging(self, name, impl): self._rigging[name] = impl
    def register_shading(self, name, impl): self._shading[name] = impl
    def register_animation(self, name, impl): self._animation[name] = impl

    def get_modeling(self, name): return self._modeling.get(name)
    def get_rigging(self, name): return self._rigging.get(name)
    def get_shading(self, name): return self._shading.get(name)
    def get_animation(self, name): return self._animation.get(name)

# Singleton instance
registry = ComponentRegistry()
