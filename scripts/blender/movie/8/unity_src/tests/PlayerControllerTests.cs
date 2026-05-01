// PlayerControllerTests.cs - Testing movement logic and organic acceleration

using NUnit.Framework;
using UnityEngine;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class PlayerControllerTests
    {
        [Test]
        public void Movement_SmoothDamp_Calculation_Logic()
        {
            // Note: SmoothDamp is an internal Unity physics/math function.
            // We test the intended behavior: gradual velocity changes.

            // Given
            Vector3 current = Vector3.zero;
            Vector3 target = new Vector3(10, 0, 0);
            Vector3 currentVelocity = Vector3.zero;
            float smoothTime = 0.1f;
            float deltaTime = 0.02f; // Simulate 50fps

            // When - First frame of movement
            Vector3 next = Vector3.SmoothDamp(current, target, ref currentVelocity, smoothTime, float.MaxValue, deltaTime);

            // Then
            Assert.IsTrue(next.x > 0, "Velocity should increase from zero.");
            Assert.IsTrue(next.x < target.x, "Velocity should not snap to target immediately (organic ease-in).");

            // When - After more time
            for(int i = 0; i < 10; i++)
            {
                current = next;
                next = Vector3.SmoothDamp(current, target, ref currentVelocity, smoothTime, float.MaxValue, deltaTime);
            }

            Assert.IsTrue(next.x > current.x, "Velocity should continue to increase towards target.");
        }

        [Test]
        public void Input_Normalization_PreventsDiagonalSpeedBoost()
        {
            // Given
            float x = 1.0f;
            float z = 1.0f;

            // When
            Vector3 move = new Vector3(x, 0, z).normalized;

            // Then
            Assert.LessOrEqual(move.magnitude, 1.01f, "Normalized direction should not exceed unit length.");
            Assert.Greater(move.magnitude, 0.99f);
        }
    }
}
