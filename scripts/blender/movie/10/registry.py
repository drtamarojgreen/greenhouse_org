class Registry:
    def __init__(self):
        self.modelers = {}
        self.riggers = {}
        self.shading = {}

    def register_modeling(self, name, cls):
        self.modelers[name] = cls

    def register_rigging(self, name, cls):
        self.riggers[name] = cls

    def register_shading(self, name, cls):
        self.shading[name] = cls

registry = Registry()
