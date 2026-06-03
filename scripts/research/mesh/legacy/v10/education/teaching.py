"""
MeSH Discovery & Systematic Review Suite V10 - Medical Education Integration
Undergraduate/Residency curriculum guides, interprofessional teaching packs, case scenarios,
OSCE prompts, myth-vs-evidence aids, journal-club kits, rubrics, and quick-reference cards.
Features: 101 - 120
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Tuple, Optional
from scripts.research.mesh.v10.infrastructure.api_clients import ExternalAPIFetcher

class MedicalEducationGenerator:
    """
    Generates curriculum-ready packages and educational aids from dynamic live evidence.
    """
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def _get_query_term(self) -> str:
        """
        Derives active search query terms dynamically from pipeline parameters.
        """
        peicot = self.config.get("systematic_review", {}).get("peicot_schema", {})
        population = peicot.get("population", ["Clinical Population"])[0]
        exposures = peicot.get("exposures", ["Exposure"])[0]
        return f"{population} {exposures}"

    def _get_active_drug(self, index: int = 0) -> Dict[str, str]:
        peicot = self.config.get("systematic_review", {}).get("peicot_schema", {})
        interventions = peicot.get("interventions", ["Standard Intervention"])
        intervention = interventions[index] if len(interventions) > index else interventions[0] if interventions else "Standard Intervention"
        
        try:
            drug = ExternalAPIFetcher.fetch_opendrug_metadata(intervention)
        except Exception:
            drug = {
                "brand_name": intervention, "generic_name": intervention, 
                "active_ingredient": intervention, "indications": "Not specified in active dataset", 
                "warnings": "Not specified", "dosage_and_administration": "Not specified", 
                "adverse_reactions": "Not specified"
            }
        return drug

    def generate_curriculum_guides(self) -> Dict[str, Any]:
        term = self._get_query_term()
        try:
            trials = ExternalAPIFetcher.fetch_clinical_trials(term, limit=2)
        except Exception:
            trials = []
            
        guides = {}
        for idx, t in enumerate(trials):
            level = "UME_Undergraduate_Medical_Education" if idx == 0 else "GME_Graduate_Medical_Education"
            guides[level] = {
                "Title": f"Evidence Appraisal: Dynamic Clinical Trial Integration ({t.get('nct_id', 'Unknown')})",
                "Trial_Focus": t.get("title", "Unknown"),
                "Sponsor": t.get("sponsor", "Unknown"),
                "Phase": t.get("phase", "Unknown"),
                "Registry_Status": t.get("status", "Unknown"),
                "Core_Competencies": [
                    f"Critically analyze registered trials for {term} interventions.",
                    f"Evaluate protocol validity based on {t.get('phase', 'Unknown')} trial design."
                ],
                "Brief_Summary": t.get("brief_summary", "Unknown")
            }
        return guides

    def get_case_scenarios(self, pooled_smd: float = 0.500) -> List[Dict[str, Any]]:
        peicot = self.config.get("systematic_review", {}).get("peicot_schema", {})
        population = peicot.get("population", ["Clinical Population"])[0]
        exposures = peicot.get("exposures", ["Exposure"])[0]
        
        scenarios = []
        for role in ["Junior_Resident", "Senior_Fellow"]:
            scenarios.append({
                "Target_Audience": role,
                "Case_Presentation": (
                    f"Patient presents with signs of {population} combined with high levels of {exposures}. "
                    f"The active systematic literature evaluates the relationship between these factors and long-term trajectories."
                ),
                "Discussion_Prompts": [
                    f"How do the findings from the active dataset generalize to a patient exhibiting high {exposures} levels?",
                    f"Evaluate the dynamic pooled effect size ({pooled_smd:.3f}) relative to individual clinical presentations."
                ]
            })
        return scenarios

    def get_osce_prompts(self, pooled_smd: float = 0.500, i2: float = 0.0) -> Dict[str, Any]:
        drug = self._get_active_drug(0)
        peicot = self.config.get("systematic_review", {}).get("peicot_schema", {})
        population = peicot.get("population", ["Clinical Population"])[0]
        
        return {
            "Station_Title": f"Clinical OSCE Prompt: Pharmacological Appraisal of {drug['brand_name']}",
            "Time_Allowed": "12 Minutes",
            "Candidate_Instructions": (
                f"A patient ({population}) is seeking guidance on {drug['brand_name']} ({drug['generic_name']}). "
                f"Active substance: {drug['active_ingredient']}. The FDA-approved purpose/indication is: {drug['indications'][:150]}. "
                f"Given the pooled systematic evidence mean difference of {pooled_smd:.3f} (Heterogeneity I2: {i2:.1f}%), "
                "explain the expected therapeutic benefits, clinical warnings, and adverse profiles."
            ),
            "Actor_Instructions": (
                f"You are a caregiver inquiring if {drug['brand_name']} is safe. "
                f"Express anxiety regarding the stated warnings: {drug['warnings'][:180]}... "
                f"And potential adverse reactions: {drug['adverse_reactions'][:160]}..."
            ),
            "Scoring_Rubric": {
                "Drug_Identification": f"Candidate correctly identifies {drug['generic_name']} as active {drug['active_ingredient']}.",
                "Indication_Clarity": f"Candidate explains the approved indication: {drug['indications'][:100]}...",
                "Risk_Communication": f"Candidate accurately conveys FDA warnings: {drug['warnings'][:120]}...",
                "Statistical_Fluency": f"Candidate explains pooled effect size ({pooled_smd:.3f}) and heterogeneity ({i2:.1f}%) clearly."
            }
        }

    def get_myth_versus_evidence(self) -> List[Dict[str, str]]:
        drug = self._get_active_drug(0)
        return [
            {
                "Myth": f"Clinical pharmacotherapy like {drug['brand_name']} lacks clear clinical mechanisms and specific FDA boundaries.",
                "Evidence": f"FDA approved {drug['brand_name']} ({drug['generic_name']}) for: {drug['indications'][:150]}... with strict dosing guidelines: {drug['dosage_and_administration'][:150]}..."
            },
            {
                "Myth": "Such therapies pose completely unpredictable, undocumented hazards to physiological systems.",
                "Evidence": f"FDA outlines specific, codified clinical warnings: {drug['warnings'][:150]}... and tracked adverse reactions: {drug['adverse_reactions'][:150]}..."
            }
        ]

    def get_bias_language_guidance(self) -> Dict[str, List[str]]:
        drug = self._get_active_drug(0)
        peicot = self.config.get("systematic_review", {}).get("peicot_schema", {})
        population = peicot.get("population", ["Clinical Population"])[0]
        
        return {
            "Avoid_Stigmatizing_Stubs": [
                f"Avoid defining patients primarily by their diagnosis ({population}) rather than as individuals with the condition.",
                "Avoid over-claiming diagnostic outcomes without statistical backing."
            ],
            "Preferred_Scientific_Terminology": [
                f"Refer to the pharmaceutical substance by its official generic name: '{drug['generic_name']}'.",
                f"Describe chemical actions based on the active ingredient: '{drug['active_ingredient']}'."
            ]
        }

    def get_journal_club_kit(self) -> Dict[str, Any]:
        peicot = self.config.get("systematic_review", {}).get("peicot_schema", {})
        population = peicot.get("population", ["Clinical Population"])[0]
        exposures = peicot.get("exposures", ["Exposure"])[0]
        
        return {
            "Article_Title": f"Dynamic Systematic Review on {population} and {exposures}",
            "Authors": "Active Dataset Consortium",
            "Citation_Source": "Dynamic Synthesis Run",
            "Critical_Appraisal_Questions": [
                f"How does the target study design in the active dataset control for {population} heterogeneity?",
                "Evaluate the risk of selective reporting in the methods-stated outcomes of this synthesis.",
                "Analyze how the extracted literature controls for potential funding and conflict of bias."
            ]
        }

    def get_quick_reference_card(self) -> List[Dict[str, Any]]:
        drug1 = self._get_active_drug(0)
        drug2 = self._get_active_drug(1)
        
        return [
            {
                "Drug": drug1["brand_name"],
                "Generic_Name": drug1["generic_name"],
                "Active_Ingredient": drug1["active_ingredient"],
                "Indications": drug1["indications"][:180] + "...",
                "Common_Adverse_Reactions": drug1["adverse_reactions"][:150] + "...",
                "FDA_Dosing_Guide": drug1["dosage_and_administration"][:180] + "..."
            },
            {
                "Drug": drug2["brand_name"],
                "Generic_Name": drug2["generic_name"],
                "Active_Ingredient": drug2["active_ingredient"],
                "Indications": drug2["indications"][:180] + "...",
                "Common_Adverse_Reactions": drug2["adverse_reactions"][:150] + "...",
                "FDA_Dosing_Guide": drug2["dosage_and_administration"][:180] + "..."
            }
        ]
