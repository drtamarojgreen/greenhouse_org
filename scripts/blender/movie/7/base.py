class Modeler:
    """Abstract base class for character modeling."""
    def build_mesh(self, char_id, params): raise NotImplementedError()

class Rigger:
    """Abstract base class for character rigging."""
    def build_rig(self, char_id, params): raise NotImplementedError()

class Shader:
    """Abstract base class for character shading."""
    def apply_materials(self, mesh, params): raise NotImplementedError()

class Animator:
    """Abstract base class for character animation."""
    def apply_action(self, rig, tag, frame, params): raise NotImplementedError()
