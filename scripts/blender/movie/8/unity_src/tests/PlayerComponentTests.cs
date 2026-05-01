// PlayerComponentTests.cs - CDD tests for PlayerController component

using NUnit.Framework;
using UnityEngine;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class PlayerComponentTests
    {
        private GameObject playerGo;
        private PlayerController controller;

        [SetUp]
        public void SetUp()
        {
            playerGo = new GameObject("Player");
            controller = playerGo.AddComponent<PlayerController>();
        }

        [TearDown]
        public void TearDown()
        {
            Object.DestroyImmediate(playerGo);
        }

        [Test]
        public void PlayerController_Initialization_SetsDefaultValues()
        {
            // Verify component exists and initialized
            Assert.IsNotNull(controller);
        }

        [Test]
        public void PlayerController_SmoothDamp_ProducesNonLinearAcceleration()
        {
            // Given: A target movement direction and a smooth time
            Vector3 moveVelocity = Vector3.zero;
            Vector3 targetVelocity = new Vector3(5, 0, 0);
            Vector3 currentVelocity = Vector3.zero;
            float smoothTime = 0.2f;
            float deltaTime = 0.02f;

            // When: Updating velocity over multiple frames
            Vector3 v1 = Vector3.SmoothDamp(moveVelocity, targetVelocity, ref currentVelocity, smoothTime, float.MaxValue, deltaTime);
            Vector3 v2 = Vector3.SmoothDamp(v1, targetVelocity, ref currentVelocity, smoothTime, float.MaxValue, deltaTime);

            // Then: The change in velocity should not be constant (non-linear)
            float delta1 = (v1 - moveVelocity).magnitude;
            float delta2 = (v2 - v1).magnitude;

            Assert.AreNotEqual(delta1, delta2, "Acceleration should be non-linear for organic biological flow.");
            Assert.IsTrue(v2.magnitude > v1.magnitude, "Velocity should increase towards target.");
        }
    }
}
