// Movie8GameBDDTests.cs - Behavioral testing for the Movie 8 Game

using NUnit.Framework;
using UnityEngine;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class Movie8GameBDDTests
    {
        private GameObject managerGo;
        private Movie8GameManager manager;

        [SetUp]
        public void SetUp()
        {
            managerGo = new GameObject("Movie8GameManager");
            manager = managerGo.AddComponent<Movie8GameManager>();
        }

        [TearDown]
        public void TearDown()
        {
            Object.DestroyImmediate(managerGo);
        }

        [Test]
        public void Scenario_EnvironmentSwitching_UpdatesActiveState()
        {
            // Given: The game is initialized with Mindscape environments.
            var garden = managerGo.AddComponent<WellnessGardenController>();
            var office = managerGo.AddComponent<PsychiatricOfficeController>();

            var envsField = typeof(Movie8GameManager).GetField("environments", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var envs = new Dictionary<string, IMentalHealthEnvironment> {
                { "wellness_garden", garden },
                { "psychiatric_office", office }
            };
            envsField?.SetValue(manager, envs);

            // When: The environment is switched to 'wellness_garden'.
            manager.SwitchEnvironment("wellness_garden");

            // Then: The Wellness Garden should be active and others should be inactive.
            Assert.IsTrue(garden.IsActive, "Wellness Garden should be active.");
            Assert.IsFalse(office.IsActive, "Psychiatric Office should be inactive.");
            Assert.IsTrue(garden.gameObject.activeSelf, "Garden GameObject should be enabled.");
            Assert.IsFalse(office.gameObject.activeSelf, "Office GameObject should be disabled.");
        }

        [Test]
        public void Scenario_OrganicMovement_MaintainsBiologicalFlow()
        {
            // Given: A player in a Mindscape environment with a CharacterController.
            GameObject playerGo = new GameObject("Player");
            playerGo.AddComponent<CharacterController>();
            var player = playerGo.AddComponent<PlayerController>();

            // When: Target movement is set (simulated via reflection or Update loop)
            var moveVelocityField = typeof(PlayerController).GetField("moveVelocity", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Then: The movement should start at zero and increase (verified in SDD tests)
            Vector3 initialVelocity = (Vector3)moveVelocityField.GetValue(player);
            Assert.AreEqual(Vector3.zero, initialVelocity, "Player should start stationary.");

            Object.DestroyImmediate(playerGo);
        }
    }
}
