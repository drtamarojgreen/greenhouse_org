import bpy
import math
import mathutils
import style
from constants import SCENE_MAP

def setup_camera_keyframes(master, cam, target):
    """Consolidated camera keyframes with dramatic fly-ins and drone sweeps."""
    title_loc = (0, -12, 0)
    origin = (0, 0, 0)
    high_target = (0, 0, 1.5)

    def kf_eased(frame, cam_loc, target_loc, easing='EASE_IN_OUT'):
        cam.location = cam_loc
        target.location = target_loc
        cam.keyframe_insert(data_path="location", frame=frame)
        target.keyframe_insert(data_path="location", frame=frame)

        # Set easing on the just-inserted keyframe
        if cam.animation_data and cam.animation_data.action:
            for fc in style.get_action_curves(cam.animation_data.action):
                if fc.data_path == "location":
                    kp = fc.keyframe_points[-1]
                    kp.interpolation = 'BEZIER'
                    kp.easing = easing

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

    # Opening drone - audience first sees the greenhouse from above
    drone_sweep(101, 180,
                start_xy=(-40, -40),
                end_xy=(40, -20),
                altitude=75,
                look_at=(0, 0, 0))

    # Descend from drone into establishing shot
    kf_eased(180, (40, -20, 75),  (0, 0, 0))
    kf_eased(200, (0, -30, 10),   (0, 0, 1.5))

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

    # Knowledge Exchange (951 - 1250)
    kf_eased(951, title_loc, origin)
    kf_eased(1051, (6,-12,3), (0, 0, 1.5))
    kf_eased(1250, (-6,-12,3), (0, 0, 1.5))

    # Sanctuary fly-in: crane shot from above descending (3901 - 4100)
    kf_eased(3901, (0, -80, 40), (0, 0, 0), easing='EASE_IN')       # extreme wide aerial
    kf_eased(3950, (0, -80, 40), (0, 0, 0), easing='EASE_IN')       # hold
    kf_eased(4050, (0, -25, 10), (0, 0, 2), easing='EASE_IN_OUT')   # descend
    kf_eased(4100, (0, -18, 5), (0, 0, 1.5), easing='EASE_OUT')     # settle

    # Interaction sequence: start wide establish, then commit (4501 - 9500)
    kf_eased(4501, (0, -80, 30), (0, 0, 1), easing='EASE_IN')       # very wide
    kf_eased(4600, (0, -80, 30), (0, 0, 1), easing='EASE_IN')       # hold wide
    kf_eased(4800, (0, -25, 10), (-1, 0, 1.5), easing='EASE_IN_OUT')# dramatic fly-in
    kf_eased(5000, (0, -15, 4), (-2, 0, 1.5), easing='EASE_OUT')    # medium shot

    # Dialogue closeups (9501 - 13000)
    # Scene 16 (9501-10200): Herbaceous speaks first, then Arbor
    kf_eased(9501,  (0, -15, 4),    (0, 0, 1.5))        # wide
    kf_eased(9525,  (-1.5, -3, 1.8), (-2, 0, 1.8))      # Herbaceous face
    kf_eased(9780,  (0, -15, 4),    (0, 0, 1.5))        # wide
    kf_eased(9830,  (1.5, -3, 1.8),  (2, 0, 1.8))       # Arbor face
    kf_eased(10100, (0, -15, 4),    (0, 0, 1.5))        # pull back

    # Scene 17 (10201-10900): Arbor speaks first
    kf_eased(10201, (0, -15, 4),    (0, 0, 1.5))
    kf_eased(10250, (1.5, -3, 1.8),  (2, 0, 1.8))       # Arbor closeup
    kf_eased(10540, (0, -15, 4),    (0, 0, 1.5))
    kf_eased(10590, (-1.5, -3, 1.8), (-2, 0, 1.8))      # Herbaceous closeup
    kf_eased(10850, (0, -15, 4),    (0, 0, 1.5))

    # Scene 18 (10901-11600): Gnome enters
    kf_eased(10901, (0, -15, 4),    (0, 0, 1.5))
    kf_eased(10950, (-1.5, -3, 1.8), (-2, 0, 1.8))      # Herbaceous speaks
    kf_eased(11200, (4, -3, 1.5),   (5, 0, 1.2))        # Gnome reaction
    kf_eased(11500, (0, -20, 6),    (0, 0, 1))          # wide

    # Scenes 19-21: peaks
    kf_eased(11601, (-1.5, -3, 1.8), (-2, 0, 1.8))
    kf_eased(11900, (4, -2.5, 1.5), (5, 0, 1.2))        # Gnome fear
    kf_eased(12000, (-1.5, -3, 1.8), (-2, 0, 1.8))
    kf_eased(12200, (4, -2.5, 1.5), (5, 0, 1.2))
    kf_eased(12300, (1.5, -3, 1.8),  (2, 0, 1.8))       # Arbor
    kf_eased(12500, (4, -2.5, 1.5), (5, 0, 1.2))
    kf_eased(12700, (0, -25, 10),   (0, 0, 1))          # wide
    kf_eased(13000, (-1.5, -3, 1.8), (-2, 0, 1.8))      # final argument

    # Scene 22 retreat camera (13701-14500)
    s22_start = SCENE_MAP['scene22_retreat'][0]
    kf_eased(s22_start,       (6, 6, 2),    (3, 3, 1.2))   # gnome closeup
    kf_eased(s22_start + 100, (0, -8, 3),   (1, 1, 1.5))   # pull back
    kf_eased(s22_start + 200, (-2, -10, 4), (-1, 1, 1.5))  # swing to plants
    kf_eased(s22_start + 350, (0, -30, 15), (0, 0, 1))     # wide shot - gnome tiny
    kf_eased(s22_start + 500, (0, -15, 5),  (0, 0, 1.5))   # settle on plants
    kf_eased(14400,           (0, -15, 5),  (0, 0, 1.5))   # hold

    # Victory drone
    drone_sweep(14200, 14400,
                start_xy=(-60, -60),
                end_xy=(60, 60),
                altitude=90,
                look_at=(0, 0, 0))

    # Credits (14501 - 15000)
    kf_eased(SCENE_MAP['scene12_credits'][0], (0,-10,0), (0, 0, 5))
    kf_eased(SCENE_MAP['scene12_credits'][1], (0,-10,0), (0, 0, 15))
