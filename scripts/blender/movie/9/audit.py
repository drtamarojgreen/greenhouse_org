import bpy
import mathutils
import movie_configuration

class AuditManager:
    """
    Handles cinematic and environmental audits for Movie 9.
    Provides ASCII layout visualizations and visibility matrices.
    """

    def __init__(self, width=70, height=40):
        self.width = width
        self.height = height
        # Hero-area zoom bounds
        self.bounds = {
            "x": (-25, 25),
            "y": (-15, 35)
        }

    def generate_ascii_layout(self):
        """Prints an ASCII top-view map of the current scene state."""
        grid = [[" " for _ in range(self.width)] for _ in range(self.height)]
        
        self._draw_axes(grid)
        self._map_entities(grid)
        self._map_backdrops(grid)
        self._map_cameras(grid)

        output = ["\n--- TOP-VIEW SCENE LAYOUT (ASCII) ---",
                  "  * = Camera, + = Protagonist, @ = Antagonist, S = Spirit",
                  "  U = Back Backdrop, [ = Left, ] = Right",
                  "+" + "-" * self.width + "+"]
        
        for row in grid:
            output.append("|" + "".join(row) + "|")
        
        output.append("+" + "-" * self.width + "+")
        print("\n".join(output))

    def generate_visibility_table(self):
        """Prints a table showing which entities are visible to which cameras."""
        entities = [e["id"] for e in movie_configuration.get("ensemble.entities", [])]
        cameras = [o for o in bpy.data.objects if o.type == 'CAMERA']
        
        header = f"{'Camera':<12} | " + " | ".join([f"{e[:4]:<4}" for e in entities])
        print("\n--- VISIBILITY AUDIT TABLE ---")
        print(header)
        print("-" * len(header))

        original_camera = bpy.context.scene.camera

        for cam in cameras:
            bpy.context.scene.camera = cam
            bpy.context.view_layer.update()
            
            row_data = []
            for e_id in entities:
                obj = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
                is_vis = "YES " if (obj and not obj.hide_render) else "NO  "
                row_data.append(is_vis)
            
            print(f"{cam.name:<12} | " + " | ".join(row_data))
        
        bpy.context.scene.camera = original_camera

    def _world_to_grid(self, x, y):
        x_min, x_max = self.bounds["x"]
        y_min, y_max = self.bounds["y"]
        
        gx = int(((x - x_min) / (x_max - x_min)) * (self.width - 1))
        gy = int(((y - y_min) / (y_max - y_min)) * (self.height - 1))
        
        # Clamp and flip Y for top-down
        gx = max(0, min(self.width - 1, gx))
        gy = self.height - 1 - max(0, min(self.height - 1, gy))
        return gx, gy

    def _draw_axes(self, grid):
        zx, zy = self._world_to_grid(0, 0)
        for y in range(self.height): grid[y][zx] = "|"
        for x in range(self.width): grid[zy][x] = "-"
        grid[zy][zx] = "o"

    def _map_entities(self, grid):
        entities = movie_configuration.get("ensemble.entities", [])
        for ent in entities:
            e_id = ent["id"]
            obj = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
            if not obj: continue
            
            gx, gy = self._world_to_grid(obj.location.x, obj.location.y)
            if ent.get("is_protagonist"):
                grid[gy][gx] = "+"
            elif ent.get("is_antagonist"):
                grid[gy][gx] = "@"
            else:
                grid[gy][gx] = "S"

    def _map_backdrops(self, grid):
        symbols = {"wide": "U", "ots1": "[", "ots2": "]"}
        for key, sym in symbols.items():
            obj = bpy.data.objects.get(f"chroma_backdrop_{key}")
            if obj:
                gx, gy = self._world_to_grid(obj.location.x, obj.location.y)
                grid[gy][gx] = sym

    def _map_cameras(self, grid):
        bpy.context.view_layer.update()
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            pos = cam.matrix_world.translation
            gx, gy = self._world_to_grid(pos.x, pos.y)
            current = grid[gy][gx]
            if current == " ":
                grid[gy][gx] = "*"
            elif current == "*":
                grid[gy][gx] = "2"
            elif current.isdigit():
                grid[gy][gx] = str(min(9, int(current) + 1))
