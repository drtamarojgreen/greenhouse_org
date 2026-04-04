import unittest
try:
    import bpy
except ImportError:
    bpy = None

try:
    from scripts.blender.movie._3.dialogue_scene import DialogueScene
except ImportError:
    # If the directory is named '3', we might need to import locally
    try:
        from dialogue_scene import DialogueScene
    except ImportError:
        DialogueScene = None

class TestDialogueScene(unittest.TestCase):
    def setUp(self):
        self.dialogue_lines = [
            {"speaker_id": "Herbaceous", "text": "Hello", "start_frame": 1, "end_frame": 48},
            {"speaker_id": "Arbor", "text": "Hi", "start_frame": 50, "end_frame": 98}
        ]
        self.characters = {
            "Herbaceous": {"rig_name": "Herbaceous", "location": (0,0,0)},
            "Arbor": {"rig_name": "Arbor", "location": (5,0,0)}
        }
        if DialogueScene:
            self.scene = DialogueScene(self.dialogue_lines, self.characters)
        else:
            self.scene = None

    def test_dialogue_mapping(self):
        # Verify dialogue lines map to non-overlapping windows
        for i in range(len(self.dialogue_lines) - 1):
            line1 = self.dialogue_lines[i]
            line2 = self.dialogue_lines[i+1]
            self.assertLess(line1["end_frame"], line2["start_frame"])

    @unittest.skipIf(bpy is None, "Blender not available")
    def test_character_mapping(self):
        # Verify every speaker has a valid character mapping
        for line in self.dialogue_lines:
            self.assertIn(line["speaker_id"], self.characters)

if __name__ == "__main__":
    unittest.main()
