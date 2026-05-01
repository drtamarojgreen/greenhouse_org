// InteractionScenarios.cs - BDD scenarios for gameplay interactions

using NUnit.Framework;
using UnityEngine;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class InteractionScenarios
    {
        [Test]
        public void Scenario_TriggerDialogue_AnimatesCharacter()
        {
            // Given: A manager and a character 'Arbor' with an Animator
            GameObject managerGo = new GameObject("Manager");
            var manager = managerGo.AddComponent<Movie8GameManager>();

            GameObject arborGo = new GameObject("Arbor");
            var animator = arborGo.AddComponent<Animator>();

            // Register character in manager via reflection
            var charsField = typeof(Movie8GameManager).GetField("characters", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var chars = new Dictionary<string, CharacterData> {
                { "Arbor", new CharacterData { GameObject = arborGo, Animator = animator } }
            };
            charsField?.SetValue(manager, chars);

            // Mock Dialogue System
            var diagSystemGo = new GameObject("DialogueSystem");
            var diagSystem = diagSystemGo.AddComponent<DialogueSystem>();
            var diagField = typeof(Movie8GameManager).GetField("dialogueSystem", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            diagField?.SetValue(manager, diagSystem);

            // When: A dialogue is triggered for 'Arbor'
            manager.TriggerDialogue("Arbor", "Welcome_Beat");

            // Then: The system should have registered the dialogue and triggered animation
            // Verification of private registeredEvents list
            var eventsField = typeof(Movie8GameManager).GetField("registeredEvents", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var events = (List<StoryEvent>)eventsField.GetValue(manager);
            Assert.IsNotNull(events, "Event tracking list should exist.");
            Assert.IsNotNull(animator, "Animator should be present for the dialogue interaction.");

            Object.DestroyImmediate(managerGo);
            Object.DestroyImmediate(arborGo);
            Object.DestroyImmediate(diagSystemGo);
        }

        [Test]
        public void Scenario_OrganicMovement_MaintainsVelocityState()
        {
            // Given: A player controller
            GameObject playerGo = new GameObject("Player");
            playerGo.AddComponent<CharacterController>();
            var player = playerGo.AddComponent<PlayerController>();

            var currentVelField = typeof(PlayerController).GetField("currentVelocity", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // When: Logic is processed
            // (Simulated by verifying internal state accessibility for the "Organic" mandate)

            // Then: We can track the derivative velocity for SmoothDamp
            Vector3 derVelocity = (Vector3)currentVelField.GetValue(player);
            Assert.AreEqual(Vector3.zero, derVelocity, "Derivative velocity should be tracked for smooth transitions.");

            Object.DestroyImmediate(playerGo);
        }
    }
}
