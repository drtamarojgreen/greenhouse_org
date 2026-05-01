// Movie8ComponentTests.cs - C# Unit Tests for Unity Components

using NUnit.Framework;
using UnityEngine;
using System.Collections.Generic;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class Movie8ComponentTests
    {
        [Test]
        public void ListToVector3_ValidList_ReturnsCorrectVector()
        {
            // Given
            List<float> input = new List<float> { 1.5f, -2.0f, 3.7f };

            // When
            Vector3 result = input.ToVector3();

            // Then
            Assert.AreEqual(1.5f, result.x);
            Assert.AreEqual(-2.0f, result.y);
            Assert.AreEqual(3.7f, result.z);
        }

        [Test]
        public void ListToVector3_EmptyList_ReturnsZeroVector()
        {
            // Given
            List<float> input = new List<float>();

            // When
            Vector3 result = input.ToVector3();

            // Then
            Assert.AreEqual(Vector3.zero, result);
        }

        [Test]
        public void ListToVector3_NullList_ReturnsZeroVector()
        {
            // Given
            List<float> input = null;

            // When
            Vector3 result = input.ToVector3();

            // Then
            Assert.AreEqual(Vector3.zero, result);
        }

        [Test]
        public void CharacterData_Initialization_StoresReferences()
        {
            // Given
            GameObject go = new GameObject("TestChar");
            Animator anim = go.AddComponent<Animator>();

            // When
            CharacterData data = new CharacterData {
                GameObject = go,
                Animator = anim
            };

            // Then
            Assert.AreEqual(go, data.GameObject);
            Assert.AreEqual(anim, data.Animator);

            Object.DestroyImmediate(go);
        }

        [Test]
        public void SwitchEnvironment_ActivatesCorrectObject()
        {
            // Given
            GameObject go = new GameObject("Manager");
            var manager = go.AddComponent<Movie8GameManager>();

            var env1Go = new GameObject("env1");
            var ctrl1 = env1Go.AddComponent<PsychiatricOfficeController>();
            var env2Go = new GameObject("env2");
            var ctrl2 = env2Go.AddComponent<WellnessGardenController>();

            var envsField = typeof(Movie8GameManager).GetField("environments", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            envsField?.SetValue(manager, new Dictionary<string, IMentalHealthEnvironment> {
                { "psychiatric_office", ctrl1 },
                { "wellness_garden", ctrl2 }
            });

            // When
            manager.SwitchEnvironment("psychiatric_office");

            // Then
            Assert.IsTrue(ctrl1.IsActive, "Requested environment should be active.");
            Assert.IsFalse(ctrl2.IsActive, "Other environment should be inactive.");

            Object.DestroyImmediate(go);
            Object.DestroyImmediate(env1Go);
            Object.DestroyImmediate(env2Go);
        }
    }
}
