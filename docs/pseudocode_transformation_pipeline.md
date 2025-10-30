# Transformation Pipeline Pseudocode

This document outlines the client-side pseudocode for transforming raw notes into a structured JSON format suitable for the educational simulation.

```
FUNCTION transformNotesToSimulationInput(rawNotes, lexicon):
  // 1. Input Ingestion & Initialization
  SET simulation = {
    session_id: generateUUID(),
    consent: true, // Assuming consent is handled before this function is called
    created_at: new UTC_ISO_String(),
    nodes: [],
    synapses: [],
    events: [],
    meta: { source_counts: { research: 0, patient: 0, user: 0 } }
  }
  SET tempNodeMap = new Map()

  // 2. Process each note
  FOR each note in rawNotes:
    // 2.1 Sanitize and Validate
    SET sanitizedContent = sanitizeAndRedactPII(note.content)
    IF sanitizedContent is flagged for high-risk PII:
      log_warning("Potential PII detected, skipping note:", note)
      CONTINUE // Skip this note

    // 2.2 Tagging and Classification
    SET domainTags = extractTags(sanitizedContent, lexicon.domain_tags)
    SET neuroAffinities = extractTags(sanitizedContent, lexicon.neurotransmitter_affinity)
    SET sourceType = note.type
    simulation.meta.source_counts[sourceType]++

    // For this simulation, we'll create a single conceptual node per note
    SET nodeLabel = createLabel(sanitizedContent) // e.g., "CBT for MDD" -> "CBT_MDD"

    IF NOT tempNodeMap.has(nodeLabel):
      // 2.3 Confidence/Scaling Heuristics
      SET strengthPrior = 0.5 // Default
      IF sourceType is "research":
        // In a real implementation, parse effect size here
        strengthPrior = 0.75
      ELSE IF sourceType is "patient":
        strengthPrior = 0.4
      ELSE IF sourceType is "user":
        strengthPrior = 0.2 // User notes have low "evidence" prior

      // 2.4 Graph Construction (Nodes)
      LET newNode = {
        id: "node-" + (tempNodeMap.size + 1),
        type: sourceType,
        label: nodeLabel,
        domain_tags: domainTags,
        strength_prior: strengthPrior,
        neuro_affinity: neuroAffinities,
        notes_ref: [generateNoteRef(note)]
      }
      tempNodeMap.set(nodeLabel, newNode)
      simulation.nodes.push(newNode)

    // 2.5 Event Generation
    IF sourceType is "user":
      LET newEvent = {
        id: "evt-" + (simulation.events.length + 1),
        node: tempNodeMap.get(nodeLabel).id,
        type: "practice",
        subtype: inferSubtype(sanitizedContent), // e.g., "breathing_practice"
        timestamp: new UTC_ISO_String(),
        intensity: inferIntensity(sanitizedContent), // e.g., 0.5 for a 10-min session
        duration_minutes: inferDuration(sanitizedContent), // e.g., 10
        notes_snippet: truncate(sanitizedContent, 50)
      }
      simulation.events.push(newEvent)

  // 2.6 Graph Construction (Synapses - simplified for this example)
  // Create a simple link between the first two nodes for demonstration
  IF simulation.nodes.length >= 2:
    LET synapse = {
      id: "syn-1",
      pre: simulation.nodes[0].id,
      post: simulation.nodes[1].id,
      weight: (simulation.nodes[0].strength_prior + simulation.nodes[1].strength_prior) / 2,
      plasticity_rate: 0.01,
      neurotransmitter: "serotonin" // Default
    }
    simulation.synapses.push(synapse)

  // 3. Output Validation & Return
  IF validateSimulationObject(simulation):
    RETURN simulation
  ELSE:
    log_error("Failed to create valid simulation object")
    RETURN null

END FUNCTION
```
