import bpy
import math
import mathutils
import style
from constants import SCENE_MAP

def setup_all_camera_logic(master):
    """Initializes camera, target, and keyframes."""
    # Camera
    cam_data = bpy.data.cameras.new("MovieCamera")
    cam = bpy.data.objects.new("MovieCamera", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0, -8, 0)
    master.scene.camera = cam

    # Target
    target = bpy.data.objects.get("CamTarget")
    if not target:
        target = bpy.data.objects.new("CamTarget", None)
        bpy.context.scene.collection.objects.link(target)
    master.cam_target = target

    con = cam.constraints.new(type='TRACK_TO')
    con.target = target
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Z' # Standard for Z-up world (Point 142)
    
    # Point 92: Set focus object to target Empty (animatable focus via target location)
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = target
    cam.data.dof.aperture_fstop = 2.8

    if master.mode == 'SILENT_FILM':
        # Enhanced Handheld Noise Layer
        style.insert_looping_noise(cam, "location", strength=0.02, scale=2.0, frame_start=1, frame_end=15000)
        # Slower, more organic rotation sway
        style.insert_looping_noise(cam, "rotation_euler", index=2, strength=0.005, scale=5.0, frame_start=1, frame_end=15000)
        style.insert_looping_noise(cam, "rotation_euler", index=0, strength=0.005, scale=4.0, frame_start=1, frame_end=15000)

    setup_camera_keyframes(master, cam, target)

def setup_camera_keyframes(master, cam, target):
    """Consolidated camera keyframes with dramatic fly-ins and drone sweeps."""
    title_loc = (0, -12, 0)
    origin = (0, 0, 0)
    high_target = (0, 0, 1.5)

    def kf_eased(frame, cam_loc, target_loc, roll=0, focus_obj=None, lens=None, easing='EASE_IN_OUT'):
        """Enhanced kf with Dutch Angle (roll), DoF (Enhancement #2), Focal Length (Enhancement #4) and easing."""
        cam.location = cam_loc
        target.location = target_loc
        # Dutch Angle (roll) - Enhancement #1
        cam.rotation_euler[2] = math.radians(roll)

        if lens:
            cam.data.lens = lens
            cam.data.keyframe_insert(data_path="lens", frame=frame)

        if focus_obj:
            cam.data.dof.use_dof = True
            # Note: focus_object itself is not animatable. 
            # We use the target Empty as the global focus_object and animate its location.

        cam.keyframe_insert(data_path="location", frame=frame)
        target.keyframe_insert(data_path="location", frame=frame)
        cam.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)

        # Set easing on the just-inserted keyframe
        if cam.animation_data and cam.animation_data.action:
            for fc in style.get_action_curves(cam.animation_data.action):
                if fc.data_path in ["location", "rotation_euler"]:
                    kp = fc.keyframe_points[-1]
                    kp.interpolation = 'BEZIER'
                    kp.easing = easing

        if cam.data.animation_data and cam.data.animation_data.action:
            for fc in style.get_action_curves(cam.data.animation_data.action):
                if fc.data_path in ["lens", "focus_distance"]:
                    kp = fc.keyframe_points[-1]
                    kp.interpolation = 'BEZIER'
                    kp.easing = easing

    def crash_zoom(frame, target_lens, duration=10):
        """Enhancement #4: Crash Zoom on Key Dramatic Beats."""
        start_lens = cam.data.lens
        cam.data.keyframe_insert(data_path="lens", frame=frame)
        cam.data.lens = target_lens
        cam.data.keyframe_insert(data_path="lens", frame=frame + duration)

        # Jarring linear interpolation for crash zoom
        for fc in style.get_action_curves(cam.data.animation_data.action):
            if fc.data_path == "lens":
                for kp in fc.keyframe_points:
                    if kp.co[0] in [frame, frame+duration]:
                        kp.interpolation = 'LINEAR'

    def whip_pan(frame, target_loc, target_look_at, duration=5):
        """Enhancement #7: Whip Pan Transitions Between Scenes."""
        kf_eased(frame, cam.location, target.location, easing='EASE_IN')
        kf_eased(frame + duration, target_loc, target_look_at, easing='EASE_OUT')
        # We simulate whip pan blur via rapid movement,
        # actual motion blur is enabled in setup_engine.

    def circular_dolly(frame_start, frame_end, center, radius, height, look_at=(0,0,0)):
        """Enhancement #10: Circular Dolly Around Characters."""
        for f in range(frame_start, frame_end + 1, 24):
            angle = math.pi * (f - frame_start) / (frame_end - frame_start)
            x = center[0] + radius * math.cos(angle)
            y = center[1] + radius * math.sin(angle)
            kf_eased(f, (x, y, height), look_at, easing='LINEAR')

    def apply_impact_shake(frame, intensity=0.1):
        """Enhancement #9: Motivated Camera Shake on Impact."""
        # Sharp shake over 2-3 frames
        orig_loc = cam.location.copy()
        kf_eased(frame, orig_loc + mathutils.Vector((0, 0, intensity)), target.location, easing='LINEAR')
        kf_eased(frame + 2, orig_loc, target.location, easing='EASE_OUT')

    # Drone shot helper - adds a lateral sweep at altitude
    def drone_sweep(frame_start, frame_end,
                    start_xy, end_xy, altitude=70,
                    look_at=(0,0,0)):
        """
        Moves camera in a slow lateral arc at high altitude,
        looking nearly straight down with slight forward angle.
        """
        kf_eased(frame_start,
           (start_xy[0], start_xy[1], altitude),
           look_at, easing='EASE_IN')
        kf_eased(frame_end,
           (end_xy[0], end_xy[1], altitude),
           look_at, easing='EASE_OUT')

    # Extend clip_end for high altitude drone shots
    cam.data.clip_end = 500.0
    cam.data.clip_start = 0.1

    # Branding (1 - 100)
    kf_eased(1, title_loc, origin)
    kf_eased(100, title_loc, origin)

    # Opening Forest Zoom OUT - start deep in trees, pull back to reveal hill
    kf_eased(101, (100, 100, 8), (80, 80, 5), lens=24, easing='EASE_OUT') # Deep forest

    # Opening drone - sweep across the hill
    drone_sweep(120, 160,
                start_xy=(80, 80),
                end_xy=(0, -40),
                altitude=60,
                look_at=(0, 0, 0))

    # Descend from drone into establishing shot (Reach Z <= 20 by 180 for Test 2.1.1)
    kf_eased(180, (0, -30, 15),  (0, 0, 0))
    kf_eased(200, (0, -30, 10),  (0, 0, 1.5))

    # Intro / Establishing Shot (101 - 200) - Already handled by drone-to-descend
    # Brain (201 - 400)
    kf_eased(SCENE_MAP['scene_brain'][0], (0,-30,8), origin)
    kf_eased(SCENE_MAP['scene_brain'][1], (0,-35,10), origin)

    # Garden fly-in: start very wide, push into the characters (401 - 650)
    kf_eased(401, (0, -60, 25), (0, 0, 0), easing='EASE_IN')        # extreme wide
    kf_eased(450, (0, -60, 25), (0, 0, 0), easing='EASE_IN')        # slow out of hold
    kf_eased(550, (0, -20, 8), (-2, 0, 1.5), easing='EASE_IN_OUT')  # fly in
    kf_eased(650, (5, -15, 3), (-2, 0, 1.5), easing='EASE_OUT')     # settle

    # Garden scene drone pass
    drone_sweep(401, 480,
                start_xy=(-50, 20),
                end_xy=(50, 20),
                altitude=60,
                look_at=(0, 5, 0))

    # Socratic (651 - 950)
    kf_eased(651, title_loc, origin)
    kf_eased(750, title_loc, origin)
    kf_eased(751, (0,-15,4), high_target)
    kf_eased(950, (0,-18,5), high_target)

    # Whip Pan (#7) transition to Knowledge Exchange
    whip_pan(951, title_loc, origin, duration=5)

    # Knowledge Exchange (951 - 1250)
    kf_eased(951, title_loc, origin)
    kf_eased(1051, (6,-12,3), (0, 0, 1.5))
    kf_eased(1250, (-6,-12,3), (0, 0, 1.5))

    # Sanctuary fly-in: crane shot from above descending (3901 - 4100)
    kf_eased(3901, (0, -80, 40), (0, 0, 0), easing='EASE_IN')
    kf_eased(3950, (0, -80, 40), (0, 0, 0), easing='EASE_IN')       # hold
    kf_eased(4050, (0, -25, 10), (0, 0, 2), easing='EASE_IN_OUT')   # descend
    kf_eased(4100, (0, -18, 5), (0, 0, 1.5), easing='EASE_OUT')     # settle

    # Interaction sequence: start wide establish, then commit (4501 - 9500)
    kf_eased(4501, (0, -80, 30), (0, 0, 1), easing='EASE_IN', lens=24)       # Ultra wide
    kf_eased(4600, (0, -80, 30), (0, 0, 1), easing='EASE_IN', lens=24)       # hold wide
    kf_eased(4800, (0, -25, 10), (-1, 0, 1.5), easing='EASE_IN_OUT', lens=35)# dramatic fly-in
    kf_eased(5000, (0, -15, 4), (-2, 0, 1.5), easing='EASE_OUT', lens=50)    # medium shot commit

    # Dialogue closeups (9501 - 13000)
    # Point 93: Target Armatures instead of meshes for better Rig Tracking
    h1_obj = bpy.data.objects.get("Herbaceous")
    h2_obj = bpy.data.objects.get("Arbor")
    gnome_obj = bpy.data.objects.get("GloomGnome")

    # Scene 16 (9501-10200): Herbaceous speaks first, then Arbor
    kf_eased(9501,  (0, -15, 4),    (0, 0, 1.5), lens=35)        # wide
    # Rack Focus (#2) and Over-the-Shoulder (#3) - Moved closer for hero status (dist < 4)
    kf_eased(9525,  (1.0, 1.0, 1.5), (-2, 0, 1.5), focus_obj=h1_obj, lens=85) # OTS Arbor to Herbaceous
    kf_eased(9780,  (0, -15, 4),    (0, 0, 1.5), lens=35)        # wide
    kf_eased(9830,  (-1.0, 1.0, 1.5), (2, 0, 1.5), focus_obj=h2_obj, lens=85) # OTS Herbaceous to Arbor
    kf_eased(10100, (0, -15, 4),    (0, 0, 1.5), lens=35)        # pull back

    # Scene 17 (10201-10900): Arbor speaks first
    kf_eased(10201, (0, -15, 4),    (0, 0, 1.5), lens=35)
    kf_eased(10250, (-1.0, 1.0, 1.5), (2, 0, 1.5), focus_obj=h2_obj, lens=85) # Arbor closeup
    kf_eased(10540, (0, -15, 4),    (0, 0, 1.5), lens=35)
    kf_eased(10590, (1.0, 1.0, 1.5), (-2, 0, 1.5), focus_obj=h1_obj, lens=85) # Herbaceous closeup
    kf_eased(10850, (0, -15, 4),    (0, 0, 1.5), lens=35)

    # Scene 18 (10901-11600): Gnome enters - Dutch Angle Enhancement #1
    kf_eased(10901, (0, -15, 4),    (0, 0, 1.5), roll=0, lens=35)
    crash_zoom(10901, 80, duration=5) # Enhancement #4: Crash Zoom on Gnome entry
    kf_eased(10950, (-1.5, -3, 1.2), (-2, 0, 1.8), roll=5, focus_obj=h1_obj, lens=50)      # Herbaceous Low Angle (#5)
    kf_eased(11200, (4, -3, 1.5),   (5, 0, 1.2), roll=-15, focus_obj=gnome_obj, lens=24)  # Gnome Dutch Angle (#1) - wide and distorted
    kf_eased(11500, (0, -20, 6),    (0, 0, 1), roll=0, lens=35)

    # Scenes 19-21: peaks - High Tension Dutch Angles and Hero Shots
    kf_eased(11601, (-1.5, -3, 1.0), (-2, 0, 1.8), roll=10, focus_obj=h1_obj, lens=85)     # Low Angle Hero (#5)
    kf_eased(11900, (4, -2.5, 1.8), (5, 0, 1.0), roll=-25, focus_obj=gnome_obj, lens=21)      # Extreme Dutch for Gnome (#1)

    apply_impact_shake(11900, intensity=0.2) # Impact Shake (#9)

    kf_eased(12000, (-1.5, -3, 1.0), (-2, 0, 1.8), roll=15, focus_obj=h1_obj, lens=105) # Extreme closeup
    kf_eased(12200, (4, -2.5, 1.8), (5, 0, 1.0), roll=-25, focus_obj=gnome_obj, lens=21)
    kf_eased(12300, (1.5, -3, 1.0),  (2, 0, 1.8), roll=15, focus_obj=h2_obj, lens=85)      # Arbor Hero Shot (#5)
    kf_eased(12500, (4, -2.5, 1.8), (5, 0, 1.0), roll=-25, focus_obj=gnome_obj, lens=21)
    kf_eased(12700, (0, -25, 10),   (0, 0, 1), roll=0, lens=35)          # wide
    kf_eased(13000, (-1.5, -3, 1.0), (-2, 0, 1.8), roll=20, focus_obj=h1_obj, lens=85)     # Final Hero Argument (#5)

    # Enhancement #10: Circular Dolly Around Characters during climax
    # Enhancement #12: Anticipation before circular dolly
    style.apply_anticipation(cam, "location", 13100, mathutils.Vector((0, 2, 0)), duration=10)
    circular_dolly(13100, 13600, center=(0,0,0), radius=10, height=2, look_at=(0,0,1))

    # Whip Pan (#7) transition to Retreat
    whip_pan(SCENE_MAP['scene22_retreat'][0] - 10, (6, 6, 2), (3, 3, 1.2), duration=5)

    # Scene 22 retreat camera (13701-14500)
    s22_start = SCENE_MAP['scene22_retreat'][0]
    kf_eased(s22_start,       (6, 6, 2),    (3, 3, 1.2))   # gnome closeup
    kf_eased(s22_start + 100, (0, -8, 3),   (1, 1, 1.5))   # pull back
    kf_eased(s22_start + 200, (-2, -10, 4), (-1, 1, 1.5))  # swing to plants
    kf_eased(s22_start + 350, (0, -30, 15), (0, 0, 1))     # wide shot - gnome tiny
    kf_eased(s22_start + 500, (0, -15, 5),  (0, 0, 1.5))   # settle on plants
    kf_eased(14400,           (0, -15, 5),  (0, 0, 1.5))   # hold

    # Victory Forest Zoom IN - sweep from wide forest back to the sanctuary
    drone_sweep(14200, 14450,
                start_xy=(-120, -120),
                end_xy=(0, -20),
                altitude=80,
                look_at=(0, 0, 1.5))

    kf_eased(14500, (0, -12, 3), (0, 0, 1.5), lens=50, easing='EASE_OUT')

    # Credits (14501 - 15000)
    kf_eased(SCENE_MAP['scene12_credits'][0], (0,-10,0), (0, 0, 5))
    kf_eased(SCENE_MAP['scene12_credits'][1], (0,-10,0), (0, 0, 15))
