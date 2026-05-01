// DataModelTests.cs - Exhaustive validation of serialization and data structures

using NUnit.Framework;
using UnityEngine;
using System.Collections.Generic;
using Movie8;

namespace Movie8.Tests
{
    [TestFixture]
    public class DataModelTests
    {
        [Test]
        public void AssetManifest_FromJson_BindsCorrectly()
        {
            string json = @"{
                ""version"": ""8.0.0"",
                ""character_count"": 10,
                ""gameplay_config"": {
                    ""total_frames"": 4800,
                    ""ensemble_entities"": [],
                    ""story_beats"": []
                }
            }";

            var manifest = AssetManifest.FromJson(json);

            Assert.AreEqual("8.0.0", manifest.version);
            Assert.AreEqual(10, manifest.character_count);
            Assert.AreEqual(4800, manifest.gameplay_config.total_frames);
        }

        [Test]
        public void LevelLayout_FromJson_MapsCharacterPositions()
        {
            string json = @"{
                ""characters"": [
                    { ""id"": ""Arbor"", ""transform"": [1, 2, 3], ""rotation"": [0, 0, 0], ""scale"": [1, 1, 1] }
                ],
                ""spawn_points"": [],
                ""waypoints"": []
            }";

            var layout = LevelLayout.FromJson(json);

            Assert.AreEqual(1, layout.characters.Count);
            Assert.AreEqual("Arbor", layout.characters[0].id);
            Assert.AreEqual(new Vector3(1, 2, 3), layout.characters[0].transform.ToVector3());
        }

        [Test]
        public void StoryBeat_Structure_IsPreserved()
        {
            var beat = new StoryBeat {
                beat = "Intro",
                events = new List<StoryEvent> {
                    new StoryEvent { target = "Arbor", action = "Talk", start_frame = 10 }
                }
            };

            Assert.AreEqual("Intro", beat.beat);
            Assert.AreEqual(1, beat.events.Count);
            Assert.AreEqual("Talk", beat.events[0].action);
        }
    }
}
