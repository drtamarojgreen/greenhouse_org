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
    }
}
