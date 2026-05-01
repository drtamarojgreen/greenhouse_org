// Movie8GameManager.cs - Unity-side game controller (Movie 8)

using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.SceneManagement;
using Newtonsoft.Json;

namespace Movie8
{
    public class Movie8GameManager : MonoBehaviour
    {
        [Header("Game Settings")]
        [SerializeField] private string characterManifestPath = "Assets/StreamingAssets/AssetManifest.json";
        [SerializeField] private float gameTimeScale = 1f;
        
        [Header("Gameplay Systems")]
        [SerializeField] private PlayerController playerController;
        [SerializeField] private DialogueSystem dialogueSystem;
        
        // Runtime state
        private Dictionary<string, CharacterData> characters = new Dictionary<string, CharacterData>();
        private Dictionary<string, IMentalHealthEnvironment> environments = new Dictionary<string, IMentalHealthEnvironment>();
        private AssetManifest manifest;
        private LevelLayout layout;
        
        public static Movie8GameManager Instance { get; private set; }
        
        public PlayerController Player => playerController;
        public DialogueSystem Dialogue => dialogueSystem;
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
                return;
            }
            
            InitializeGame();
        }
        
        private void InitializeGame()
        {
            Time.timeScale = gameTimeScale;
            LoadManifest();
            LoadLayout();
            LoadEnvironments();
            LoadAllCharacters();
            SetupStoryEvents();
            
            Debug.Log($"Movie 8 Initialized. {characters.Count} characters, {environments.Count} environments loaded.");
        }

        private void LoadEnvironments()
        {
            // Load specialized mental health environment controllers
            var psychiatricOffice = gameObject.AddComponent<PsychiatricOfficeController>();
            var wellnessGarden = gameObject.AddComponent<WellnessGardenController>();
            var mountainForest = gameObject.AddComponent<MountainForestController>();
            var beachGazebo = gameObject.AddComponent<BeachGazeboController>();
            var meditationLibrary = gameObject.AddComponent<MeditationLibraryController>();

            environments["psychiatric_office"] = psychiatricOffice;
            environments["wellness_garden"] = wellnessGarden;
            environments["mountain_forest"] = mountainForest;
            environments["beach_gazebo"] = beachGazebo;
            environments["meditation_library"] = meditationLibrary;

            foreach (var env in environments.Values)
            {
                env.Deactivate();
            }
        }
        
        private void LoadManifest()
        {
            TextAsset manifestAsset = Resources.Load<TextAsset>("AssetManifest");
            if (manifestAsset == null) {
                Debug.LogError("AssetManifest.json not found in Resources!");
                return;
            }
            
            manifest = JsonConvert.DeserializeObject<AssetManifest>(manifestAsset.text);
            
            if (manifest == null)
            {
                Debug.LogError("Failed to parse asset manifest!");
                return;
            }
            
            Debug.Log($"Loaded manifest v{manifest.version}");
        }

        private void LoadLayout()
        {
            TextAsset layoutAsset = Resources.Load<TextAsset>("LevelLayout");
            if (layoutAsset == null) {
                Debug.LogWarning("LevelLayout.json not found in Resources. Using defaults.");
                return;
            }

            layout = JsonConvert.DeserializeObject<LevelLayout>(layoutAsset.text);
            Debug.Log($"Loaded level layout with {layout.characters.Count} character placements.");
        }
        
        private void LoadAllCharacters()
        {
            if (manifest?.gameplay_config?.ensemble_entities == null) return;
            
            foreach (var charConfig in manifest.gameplay_config.ensemble_entities)
            {
                GameObject charObj = LoadCharacter(charConfig.id);

                // Position character if layout data exists
                if (charObj != null && layout != null)
                {
                    var charLayout = layout.characters.Find(c => c.id == charConfig.id);
                    if (charLayout != null)
                    {
                        charObj.transform.position = charLayout.transform.ToVector3();
                        charObj.transform.rotation = Quaternion.Euler(charLayout.rotation.ToVector3());
                        charObj.transform.localScale = charLayout.scale.ToVector3();
                    }
                }
            }
        }
        
        private GameObject LoadCharacter(string characterId)
        {
            // Load character prefab
            string prefabPath = $"Characters/{characterId}/Prefab";
            GameObject characterPrefab = Resources.Load<GameObject>(prefabPath);
            
            if (characterPrefab == null)
            {
                Debug.LogWarning($"Character prefab not found: {characterId}");
                return null;
            }
            
            GameObject character = Instantiate(characterPrefab);
            character.name = characterId;
            
            // Setup character components
            CharacterController charCtrl = character.GetComponent<CharacterController>() ?? character.AddComponent<CharacterController>();
            
            // Load animations
            Animator animator = character.GetComponent<Animator>();
            
            characters[characterId] = new CharacterData
            {
                GameObject = character,
                Animator = animator
            };
            
            return character;
        }
        
        private void SetupStoryEvents()
        {
            if (manifest?.gameplay_config?.story_beats == null) return;
            
            foreach (var beat in manifest.gameplay_config.story_beats)
            {
                foreach (var storyEvent in beat.events)
                {
                    Debug.Log($"Registered story event: {storyEvent.action} for {storyEvent.target}");
                }
            }
        }
        
        public void TriggerDialogue(string characterId, string dialogueId)
        {
            if (characters.TryGetValue(characterId, out CharacterData charData))
            {
                dialogueSystem.StartDialogue(dialogueId, charData.GameObject);
                
                // Trigger talking animation if available
                if (charData.Animator != null)
                {
                    charData.Animator.SetTrigger("Talk");
                }
            }
        }

        public void SwitchEnvironment(string environmentId)
        {
            foreach (var env in environments)
            {
                if (env.Key == environmentId)
                    env.Value.Activate();
                else
                    env.Value.Deactivate();
            }
            Debug.Log($"Switched to environment: {environmentId}");
        }
    }
    
    [System.Serializable]
    public class AssetManifest
    {
        public string version;
        public int character_count;
        public int animation_count;
        public GameplayConfig gameplay_config;

        public static AssetManifest FromJson(string json) => JsonConvert.DeserializeObject<AssetManifest>(json);
    }
    
    [System.Serializable]
    public class GameplayConfig
    {
        public int total_frames;
        public List<CharacterEntity> ensemble_entities;
        public List<StoryBeat> story_beats;
    }

    [System.Serializable]
    public class CharacterEntity {
        public string id;
        public string type;
    }

    [System.Serializable]
    public class StoryBeat {
        public string beat;
        public List<StoryEvent> events;
    }

    [System.Serializable]
    public class StoryEvent {
        public string target;
        public string action;
        public int start_frame;
        public Dictionary<string, string> params_dict; // Simplified
    }

    [System.Serializable]
    public class LevelLayout
    {
        public List<CharacterPlacement> characters;
        public List<SpawnPoint> spawn_points;
        public List<WaypointPath> waypoints;

        public static LevelLayout FromJson(string json) => JsonConvert.DeserializeObject<LevelLayout>(json);
    }

    [System.Serializable]
    public class CharacterPlacement
    {
        public string id;
        public List<float> transform;
        public List<float> rotation;
        public List<float> scale;
    }

    [System.Serializable]
    public class SpawnPoint
    {
        public string name;
        public List<float> position;
        public List<float> rotation;
        public float focal_length;
    }

    [System.Serializable]
    public class WaypointPath
    {
        public string id;
        public List<List<float>> points;
        public bool loop;
    }
    
    public class CharacterData
    {
        public GameObject GameObject;
        public Animator Animator;
    }

    public static class ListExtensions
    {
        public static Vector3 ToVector3(this List<float> list)
        {
            if (list == null || list.Count < 3) return Vector3.zero;
            return new Vector3(list[0], list[1], list[2]);
        }
    }
}
