// IMentalHealthEnvironment.cs - Interface for environment components (Movie 8 Game)

using UnityEngine;

namespace Movie8
{
    /// <summary>
    /// Defines the contract for mental health environments in the Greenhouse system.
    /// Psychological Rationale: Standardizing environment interactions ensures that different
    /// mental states are processed through a consistent internal API, mirroring the mind's
    /// regulatory systems.
    /// </summary>
    public interface IMentalHealthEnvironment
    {
        string EnvironmentId { get; }
        string PsychologicalMeaning { get; }
        void Activate();
        void Deactivate();
        void UpdateMentalState(float intensity);
    }
}
