// DialogueSystemTests.cs - Testing UI and Dialogue logic

using NUnit.Framework;
using UnityEngine;
using TMPro;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class DialogueSystemTests
    {
        private GameObject dialogueGo;
        private DialogueSystem dialogueSystem;
        private TMP_Text speakerText;
        private TMP_Text contentText;

        [SetUp]
        public void SetUp()
        {
            dialogueGo = new GameObject("DialogueSystem");
            dialogueSystem = dialogueGo.AddComponent<DialogueSystem>();

            // Mock UI components using Reflection or finding children
            // For unit testing, we usually use SerializedFields, here we'll mock the assignment
            var panel = new GameObject("Panel");
            panel.transform.SetParent(dialogueGo.transform);

            var speakerGo = new GameObject("Speaker");
            speakerText = speakerGo.AddComponent<TextMeshProUGUI>();

            var contentGo = new GameObject("Content");
            contentText = contentGo.AddComponent<TextMeshProUGUI>();

            // Use reflection to set private fields if necessary, or just verify public state
        }

        [TearDown]
        public void TearDown()
        {
            Object.DestroyImmediate(dialogueGo);
        }

        [Test]
        public void Dialogue_Start_UpdatesUIComponents()
        {
            // Given
            string dialogueId = "Insight_01";
            GameObject speaker = new GameObject("Arbor_Speaker");

            // Setup private fields via reflection to avoid null refs in tests
            var panelField = typeof(DialogueSystem).GetField("dialoguePanel", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var panel = new GameObject("Panel");
            panelField?.SetValue(dialogueSystem, panel);

            var speakerField = typeof(DialogueSystem).GetField("speakerNameText", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            speakerField?.SetValue(dialogueSystem, speakerText);

            var contentField = typeof(DialogueSystem).GetField("dialogueText", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            contentField?.SetValue(dialogueSystem, contentText);

            // When
            dialogueSystem.StartDialogue(dialogueId, speaker);

            // Then
            Assert.IsTrue(panel.activeSelf, "Dialogue panel should be active.");
            Assert.AreEqual("Arbor_Speaker", speakerText.text, "Speaker name should be correctly assigned.");
            Assert.IsTrue(contentText.text.Contains(dialogueId), "Dialogue text should mention the ID.");

            Object.DestroyImmediate(speaker);
            Object.DestroyImmediate(panel);
        }

        [Test]
        public void Dialogue_End_HidesPanel()
        {
            // Given
            var panelField = typeof(DialogueSystem).GetField("dialoguePanel", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var panel = new GameObject("Panel");
            panel.SetActive(true);
            panelField?.SetValue(dialogueSystem, panel);

            // When
            dialogueSystem.EndDialogue();

            // Then
            Assert.IsFalse(panel.activeSelf, "Dialogue panel should be hidden after EndDialogue.");
            Object.DestroyImmediate(panel);
        }
    }
}
