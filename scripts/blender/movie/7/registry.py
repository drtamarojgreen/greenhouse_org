class ComponentRegistry:
    """Registry to map configuration strings to implementation classes."""
    _modeling = {}
    _rigging = {}
    _shading = {}
    _animation = {}

    @classmethod
    def register_modeling(cls, name, impl): cls._modeling[name] = impl
    @classmethod
    def register_rigging(cls, name, impl): cls._rigging[name] = impl
    @classmethod
    def register_shading(cls, name, impl): cls._shading[name] = impl
    @classmethod
    def register_animation(cls, name, impl): cls._animation[name] = impl

    @classmethod
    def get_modeling(cls, name): return cls._modeling.get(name)
    @classmethod
    def get_rigging(cls, name): return cls._rigging.get(name)
    @classmethod
    def get_shading(cls, name): return cls._shading.get(name)
    @classmethod
    def get_animation(cls, name): return cls._animation.get(name)

registry = ComponentRegistry()
