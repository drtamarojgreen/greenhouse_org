try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None
import unittest
    from asset_manager import
except (ImportError, ModuleNotFoundError):
        from ..asset_manager import
    except (ImportError, ModuleNotFoundError):
        from ...asset_manager import AssetManager
    from director import
except (ImportError, ModuleNotFoundError):
        from ..director import
    except (ImportError, ModuleNotFoundError):
        from ...director import Director
    from render import
except (ImportError, ModuleNotFoundError):
        from ..render import
    except (ImportError, ModuleNotFoundError):
        from ...render import build_scene
    from animation_handler import
except (ImportError, ModuleNotFoundError):
        from ..animation_handler import
    except (ImportError, ModuleNotFoundError):
        from ...animation_handler import AnimationHandler
    from character_builder import
except (ImportError, ModuleNotFoundError):
        from ..character_builder import
    except (ImportError, ModuleNotFoundError):
        from ...character_builder import CharacterBuilder
except ImportError:
    from ..asset_manager import AssetManager
    from ..director import Director
    from ..render import build_scene
    from ..animation_handler import AnimationHandler
    from ..character_builder import CharacterBuilder

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)

# Verify we can find the module
import importlib.util
spec = importlib.util.find_spec("movie_configuration")
if spec is None:
    # Try alternate pathing for Blender environment
    alt_root = os.path.join(os.getcwd(), "scripts", "blender", "movie", "10")
    if alt_root not in sys.path:
        sys.path.insert(0, alt_root)
