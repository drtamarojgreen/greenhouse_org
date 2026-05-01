// UtilityTests.cs - Testing C# extensions and helper logic

using NUnit.Framework;
using UnityEngine;
using System.Collections.Generic;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class UtilityTests
    {
        [Test]
        public void ListToVector3_StandardInput_ReturnsExpected()
        {
            var list = new List<float> { 10f, 20f, 30f };
            Assert.AreEqual(new Vector3(10, 20, 30), list.ToVector3());
        }

        [Test]
        public void ListToVector3_Null_ReturnsZero()
        {
            List<float> list = null;
            Assert.AreEqual(Vector3.zero, list.ToVector3());
        }

        [Test]
        public void ListToVector3_TooShort_ReturnsZero()
        {
            var list = new List<float> { 1f, 2f };
            Assert.AreEqual(Vector3.zero, list.ToVector3());
        }

        [Test]
        public void ListToVector3_Longer_TakesFirstThree()
        {
            var list = new List<float> { 1f, 2f, 3f, 4f };
            Assert.AreEqual(new Vector3(1, 2, 3), list.ToVector3());
        }
    }
}
