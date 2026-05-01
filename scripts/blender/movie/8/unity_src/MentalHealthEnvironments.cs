// MentalHealthEnvironments.cs - Specialized controllers for Mindscape environments

using UnityEngine;

namespace Movie8
{
    public abstract class MentalHealthEnvironmentBase : MonoBehaviour, IMentalHealthEnvironment
    {
        [SerializeField] private string environmentId;
        [SerializeField] [TextArea] private string psychologicalMeaning;

        public string EnvironmentId => environmentId;
        public string PsychologicalMeaning => psychologicalMeaning;

        public virtual void Activate() => gameObject.SetActive(true);
        public virtual void Deactivate() => gameObject.SetActive(false);
        public abstract void UpdateMentalState(float intensity);
    }

    public class PsychiatricOfficeController : MentalHealthEnvironmentBase
    {
        /// <summary>
        /// Psychological Rationale: The Psychiatric Office provides a 'Clinical Anchor'.
        /// Structural stability represents the analytical mind's ability to contain and
        /// process raw emotion.
        /// </summary>
        public override void UpdateMentalState(float intensity)
        {
            // Focus on structural stability and analytical clarity
            // e.g., adjust lighting focus or "supportive" asset positioning
            Debug.Log($"Psychiatric Office processing vulnerability at intensity: {intensity}");
        }
    }

    public class WellnessGardenController : MentalHealthEnvironmentBase
    {
        /// <summary>
        /// Psychological Rationale: The Wellness Garden represents the Greenhouse's core mission.
        /// Procedural growth and rhythmic motion simulate neuroplasticity and the
        /// cultivation of self-regulation.
        /// </summary>
        public override void UpdateMentalState(float intensity)
        {
            // Focus on neuroplasticity and growth
            // e.g., animate trellis growth or neural path pulsing
            Debug.Log($"Wellness Garden stimulating growth at intensity: {intensity}");
        }
    }

    public class MountainForestController : MentalHealthEnvironmentBase
    {
        public override void UpdateMentalState(float intensity)
        {
            // Focus on resilience and overcoming obstacles
            // e.g., adjust "ruggedness" of the path or wind intensity on pine sentinels
            Debug.Log($"Mountain Forest testing resilience at intensity: {intensity}");
        }
    }

    public class BeachGazeboController : MentalHealthEnvironmentBase
    {
        public override void UpdateMentalState(float intensity)
        {
            // Focus on clarity and mindfulness
            // e.g., adjust wave transparency or gazebo light airy feel
            Debug.Log($"Beach Gazebo promoting clarity at intensity: {intensity}");
        }
    }

    public class MeditationLibraryController : MentalHealthEnvironmentBase
    {
        public override void UpdateMentalState(float intensity)
        {
            // Focus on introspection and cognitive storage
            // e.g., adjust rhythmic light pulses or "Records of Reason" accessibility
            Debug.Log($"Meditation Library facilitating introspection at intensity: {intensity}");
        }
    }
}
