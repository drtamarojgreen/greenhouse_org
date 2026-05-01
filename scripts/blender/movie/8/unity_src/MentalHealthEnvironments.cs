// MentalHealthEnvironments.cs - Specialized controllers for Mindscape environments

using UnityEngine;

namespace Movie8
{
    public abstract class MentalHealthEnvironmentBase : MonoBehaviour, IMentalHealthEnvironment
    {
        [SerializeField] private string environmentId;
        [SerializeField] [TextArea] private string psychologicalMeaning;

        private bool isActive;
        private float currentIntensity;

        public string EnvironmentId => environmentId;
        public string PsychologicalMeaning => psychologicalMeaning;
        public bool IsActive => isActive;
        public float CurrentIntensity => currentIntensity;

        public virtual void Activate()
        {
            isActive = true;
            gameObject.SetActive(true);
        }

        public virtual void Deactivate()
        {
            isActive = false;
            gameObject.SetActive(false);
        }

        public virtual void UpdateMentalState(float intensity)
        {
            currentIntensity = intensity;
        }
    }

    public class PsychiatricOfficeController : MentalHealthEnvironmentBase
    {
        public PsychiatricOfficeController()
        {
            // Direct initialization for testability without SerializedFields
            var field = typeof(MentalHealthEnvironmentBase).GetField("environmentId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(this, "psychiatric_office");

            var meaningField = typeof(MentalHealthEnvironmentBase).GetField("psychologicalMeaning", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            meaningField?.SetValue(this, "Structural stability and vulnerability processing.");
        }

        public override void UpdateMentalState(float intensity)
        {
            base.UpdateMentalState(intensity);
            Debug.Log($"Psychiatric Office processing vulnerability at intensity: {intensity}");
        }
    }

    public class WellnessGardenController : MentalHealthEnvironmentBase
    {
        public WellnessGardenController()
        {
            var field = typeof(MentalHealthEnvironmentBase).GetField("environmentId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(this, "wellness_garden");

            var meaningField = typeof(MentalHealthEnvironmentBase).GetField("psychologicalMeaning", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            meaningField?.SetValue(this, "Neuroplasticity and self-regulation greenhouse.");
        }

        public override void UpdateMentalState(float intensity)
        {
            base.UpdateMentalState(intensity);
            Debug.Log($"Wellness Garden stimulating growth at intensity: {intensity}");
        }
    }

    public class MountainForestController : MentalHealthEnvironmentBase
    {
        public MountainForestController()
        {
            var field = typeof(MentalHealthEnvironmentBase).GetField("environmentId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(this, "mountain_forest");
        }

        public override void UpdateMentalState(float intensity)
        {
            base.UpdateMentalState(intensity);
            Debug.Log($"Mountain Forest testing resilience at intensity: {intensity}");
        }
    }

    public class BeachGazeboController : MentalHealthEnvironmentBase
    {
        public BeachGazeboController()
        {
            var field = typeof(MentalHealthEnvironmentBase).GetField("environmentId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(this, "beach_gazebo");
        }

        public override void UpdateMentalState(float intensity)
        {
            base.UpdateMentalState(intensity);
            Debug.Log($"Beach Gazebo promoting clarity at intensity: {intensity}");
        }
    }

    public class MeditationLibraryController : MentalHealthEnvironmentBase
    {
        public MeditationLibraryController()
        {
            var field = typeof(MentalHealthEnvironmentBase).GetField("environmentId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(this, "meditation_library");
        }

        public override void UpdateMentalState(float intensity)
        {
            base.UpdateMentalState(intensity);
            Debug.Log($"Meditation Library facilitating introspection at intensity: {intensity}");
        }
    }
}
