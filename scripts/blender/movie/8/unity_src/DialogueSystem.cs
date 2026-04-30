// DialogueSystem.cs (Movie 8)

using UnityEngine;
using System.Collections.Generic;
using System;
using TMPro;
using UnityEngine.UI;

namespace Movie8
{
    public class DialogueSystem : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject dialoguePanel;
        [SerializeField] private TMP_Text speakerNameText;
        [SerializeField] private TMP_Text dialogueText;
        
        [Header("Settings")]
        [SerializeField] private float textSpeed = 0.03f;
        
        // State
        private bool isDialogueActive;
        
        private void Start()
        {
            if (dialoguePanel != null)
                dialoguePanel.SetActive(false);
        }
        
        public void StartDialogue(string dialogueId, GameObject speaker = null)
        {
            isDialogueActive = true;
            if (dialoguePanel != null)
                dialoguePanel.SetActive(true);
            
            if (speakerNameText != null && speaker != null)
                speakerNameText.text = speaker.name;
                
            if (dialogueText != null)
                dialogueText.text = $"Dialogue session for {dialogueId} started.";
                
            Debug.Log($"Starting dialogue: {dialogueId}");
        }
        
        public void EndDialogue()
        {
            isDialogueActive = false;
            if (dialoguePanel != null)
                dialoguePanel.SetActive(false);
        }
    }
}
