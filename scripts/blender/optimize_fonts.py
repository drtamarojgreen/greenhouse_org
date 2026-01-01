
import bpy
import os
try:
    from optimizer_base import BaseOptimizer
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from optimizer_base import BaseOptimizer

class FontOptimizer(BaseOptimizer):
    """
    Optimizes fonts by replacing missing or broken paths with local system fonts.
    """
    def __init__(self, config=None):
        super().__init__(config)
        self.fallback_fonts = [
            "/usr/share/fonts/google-carlito-fonts/Carlito-Regular.ttf",
            "/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Regular.ttf",
            "/usr/share/fonts/google-droid-sans-fonts/DroidSans.ttf"
        ]
        self.available_fallbacks = [f for f in self.fallback_fonts if os.path.exists(f)]
        self.replacement_font = None

    def _ensure_fallback_font_loaded(self):
        """
        Loads the fallback font if it hasn't been loaded or has been cleared.
        """
        # Check if the font is already loaded and valid
        if self.replacement_font and self.replacement_font.name in bpy.data.fonts:
            return

        if self.available_fallbacks:
            try:
                self.replacement_font = bpy.data.fonts.load(self.available_fallbacks[0])
                print(f" - Loaded master fallback font: {self.replacement_font.name}")
            except Exception as e:
                print(f" - Error loading fallback font: {e}")
                self.replacement_font = None
        else:
            self.replacement_font = None

    def process(self, context, obj):
        self._ensure_fallback_font_loaded()
        
        if not self.replacement_font:
            return

        # 1. Handle Text Objects
        if obj.type == 'FONT':
            vfont = obj.data.font
            if self.is_font_missing(vfont):
                print(f" - Replacing missing font on {obj.name} with {self.replacement_font.name}")
                obj.data.font = self.replacement_font

        # 2. Handle Grease Pencil (Blender 4.3+ or older)
        elif obj.type == 'GPENCIL':
            # In newer Blender, GP text is often part of a 'Geometry Node' or a specific GP layer
            # For brevity, we focus on the data level if it's explicitly linked.
            pass

    def is_font_missing(self, vfont):
        if not vfont: return True
        if vfont.name == "Bfont": return False # Built-in is fine
        
        path = bpy.path.abspath(vfont.filepath)
        # Check for non-existent or "remote" paths
        if not os.path.exists(path) or "development/LLM" in path or vfont.filepath == "<builtin>":
            return True
        return False

    def post_process(self, context):
        """
        Cleanup unused fonts.
        """
        for vfont in bpy.data.fonts:
            if vfont.users == 0 and vfont.name != "Bfont":
                bpy.data.fonts.remove(vfont)
        
        if self.config.get('pack_assets', True):
            bpy.ops.file.pack_all()
            print(" - All assets packed.")
