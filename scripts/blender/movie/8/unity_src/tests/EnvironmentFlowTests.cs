// EnvironmentFlowTests.cs - BDD scenarios for environment transitions

using NUnit.Framework;
using UnityEngine;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class EnvironmentFlowTests
    {
        private GameObject managerGo;
        private Movie8GameManager manager;

        [SetUp]
        public void SetUp()
        {
            managerGo = new GameObject("Manager");
            manager = managerGo.AddComponent<Movie8GameManager>();
            // Note: In real Unity Test Runner, [UnityTest] would handle lifecycle
        }

        [TearDown]
        public void TearDown()
        {
            Object.DestroyImmediate(managerGo);
        }

        [Test]
        public void Scenario_SwitchToWellnessGarden_ActivatesCorrectController()
        {
            // Given: The game has initialized all mental health environments
            // (Simulated by manual setup or manager init)
            var garden = managerGo.AddComponent<WellnessGardenController>();

            // When: The environment is switched to 'wellness_garden'
            manager.SwitchEnvironment("wellness_garden");

            // Then: The Wellness Garden should be active
            Assert.IsTrue(garden.IsActive, "Wellness Garden should be explicitly active.");
            Assert.IsTrue(garden.gameObject.activeSelf, "Garden GameObject should be enabled.");
        }

        [Test]
        public void Scenario_SwitchToBeach_DeactivatesPreviousEnvironment()
        {
            // Given: The Psychiatric Office is currently active
            var office = managerGo.AddComponent<PsychiatricOfficeController>();
            var beach = managerGo.AddComponent<BeachGazeboController>();

            var envsField = typeof(Movie8GameManager).GetField("environments", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            envsField?.SetValue(manager, new Dictionary<string, IMentalHealthEnvironment> {
                { "psychiatric_office", office },
                { "beach_gazebo", beach }
            });

            office.Activate();

            // When: We switch to the Beach Gazebo
            manager.SwitchEnvironment("beach_gazebo");

            // Then: The Psychiatric Office should be deactivated
            Assert.IsFalse(office.IsActive, "Psychiatric Office should have been deactivated.");
            Assert.IsTrue(beach.IsActive, "Beach Gazebo should now be active.");
        }
    }
}
