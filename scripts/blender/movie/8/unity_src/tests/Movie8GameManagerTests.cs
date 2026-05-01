// Movie8GameManagerTests.cs - Deep testing of the Movie 8 Game Manager logic

using NUnit.Framework;
using UnityEngine;
using System.Collections.Generic;
using Newtonsoft.Json;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class Movie8GameManagerTests
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
        public void Manifest_Deserialization_HandlesValidJson()
        {
            // Given
            string json = @"{
                ""version"": ""8.0.0"",
                ""character_count"": 1,
                ""gameplay_config"": {
                    ""total_frames"": 100,
                    ""ensemble_entities"": [{ ""id"": ""Arbor"", ""type"": ""MESH"" }],
                    ""story_beats"": []
                }
            }";

            // When
            var manifest = JsonConvert.DeserializeObject<AssetManifest>(json);

            // Then
            Assert.AreEqual("8.0.0", manifest.version);
            Assert.AreEqual(1, manifest.gameplay_config.ensemble_entities.Count);
            Assert.AreEqual("Arbor", manifest.gameplay_config.ensemble_entities[0].id);
        }

        [Test]
        public void Layout_Deserialization_HandlesComplexPlacements()
        {
            // Given
            string json = @"{
                ""characters"": [
                    {
                        ""id"": ""Herbaceous"",
                        ""transform"": [1.0, 0.0, 2.0],
                        ""rotation"": [0.0, 90.0, 0.0],
                        ""scale"": [1.0, 1.0, 1.0]
                    }
                ],
                ""spawn_points"": [],
                ""waypoints"": []
            }";

            // When
            var layout = JsonConvert.DeserializeObject<LevelLayout>(json);

            // Then
            Assert.AreEqual(1, layout.characters.Count);
            Assert.AreEqual(1.0f, layout.characters[0].transform[0]);
            Vector3 pos = layout.characters[0].transform.ToVector3();
            Assert.AreEqual(new Vector3(1.0f, 0.0f, 2.0f), pos);
        }

        [Test]
        public void ListToVector3_HandlesMalformedInputGracefully()
        {
            // Given
            List<float> shortList = new List<float> { 1.0f, 2.0f }; // Missing Z

            // When
            Vector3 result = shortList.ToVector3();

            // Then
            Assert.AreEqual(Vector3.zero, result, "Should return zero vector if list is incomplete.");
        }
    }
}
