// MentalHealthEnvironmentTests.cs - SDD tests for Mindscape components

using NUnit.Framework;
using UnityEngine;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class MentalHealthEnvironmentTests
    {
        [Test]
        public void PsychiatricOffice_Component_ImplementsPsychologicalMandate()
        {
            GameObject go = new GameObject();
            var office = go.AddComponent<PsychiatricOfficeController>();

            Assert.AreEqual("psychiatric_office", office.EnvironmentId);
            Assert.IsNotNull(office.PsychologicalMeaning);
            Assert.Contains("vulnerability", office.PsychologicalMeaning.ToLower());

            Object.DestroyImmediate(go);
        }

        [Test]
        public void WellnessGarden_Component_PromotesNeuroplasticity()
        {
            GameObject go = new GameObject();
            var garden = go.AddComponent<WellnessGardenController>();

            Assert.AreEqual("wellness_garden", garden.EnvironmentId);
            Assert.Contains("neuroplasticity", garden.PsychologicalMeaning.ToLower());

            Object.DestroyImmediate(go);
        }

        [Test]
        public void MountainForest_Component_SymbolizesResilience()
        {
            GameObject go = new GameObject();
            var mountain = go.AddComponent<MountainForestController>();

            Assert.AreEqual("mountain_forest", mountain.EnvironmentId);
            Assert.Contains("resilience", mountain.PsychologicalMeaning.ToLower());

            Object.DestroyImmediate(go);
        }

        [Test]
        public void BeachGazebo_Component_EncouragesClarity()
        {
            GameObject go = new GameObject();
            var beach = go.AddComponent<BeachGazeboController>();

            Assert.AreEqual("beach_gazebo", beach.EnvironmentId);
            Assert.Contains("clarity", beach.PsychologicalMeaning.ToLower());

            Object.DestroyImmediate(go);
        }

        [Test]
        public void MeditationLibrary_Component_EnablesIntrospection()
        {
            GameObject go = new GameObject();
            var library = go.AddComponent<MeditationLibraryController>();

            Assert.AreEqual("meditation_library", library.EnvironmentId);
            Assert.Contains("introspection", library.PsychologicalMeaning.ToLower());

            Object.DestroyImmediate(go);
        }
    }
}
