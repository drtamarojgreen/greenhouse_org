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
        // [SerializeField] private CombatSystem combatSystem; // Future expansion
        [SerializeField] private DialogueSystem dialogueSystem;
        // [SerializeField] private LevelManager levelManager; // Future expansion
        
        // Runtime state
        private Dictionary<string, CharacterData> characters = new Dictionary<string, CharacterData>();
        private Dictionary<string, AnimationClip> loadedAnimations = new Dictionary<string, AnimationClip>();
        private AssetManifest manifest;
        
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
            LoadAllCharacters();
            SetupStoryEvents();
            
            Debug.Log($"Movie 8 Initialized. {characters.Count} characters loaded.");
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
        
        private void LoadAllCharacters()
        {
            if (manifest?.gameplay_config?.ensemble_entities == null) return;
            
            foreach (var charConfig in manifest.gameplay_config.ensemble_entities)
            {
                LoadCharacter(charConfig.id);
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
    }
    
    [System.Serializable]
    public class AssetManifest
    {
        public string version;
        public int character_count;
        public int animation_count;
        public GameplayConfig gameplay_config;
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
    
    public class CharacterData
    {
        public GameObject GameObject;
        public Animator Animator;
    }
}
