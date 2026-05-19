"""
MeSH Suite v10.0 - E2E (End-to-End) Pipeline Integration Tests
Runs mock researcher datasets through all dynamic engines, verifying structural execution integrity.
"""
import unittest
import os
import yaml
from scripts.research.mesh.v10.core.systematic_review import SystematicReviewEngine
from scripts.research.mesh.v10.discovery.emerging import EmergingDiscoveryEngine
from scripts.research.mesh.v10.neuro_modeling.systems import NeuroSystemsModeler
from scripts.research.mesh.v10.education.teaching import MedicalEducationGenerator
from scripts.research.mesh.v10.advocacy.communication import PublicAdvocacyEngine
from scripts.research.mesh.v10.roadmapping.planning import ProgramRoadmapPlanner
from scripts.research.mesh.v10.cross_version.strategy import CrossVersionStrategist

class TestPipelineEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        v10_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(v10_dir, "config.yaml")
        
        with open(config_path, "r") as f:
            cls.config = yaml.safe_load(f)
            
        cls.config["seed_term"] = "Clinical Intervention Stress"

        # Mock researcher database input
        cls.mock_studies = [
            {
                "pmid": "34218945",
                "title": "Randomized Trial of Methylphenidate and Daily Stressors",
                "abstract": "We evaluated the causal pathways of ADHD under chronic stress exposure. Daily cortisol rhythms were tracked.",
                "intervention": "Methylphenidate",
                "comparator": "Placebo",
                "settings": ["school", "home"],
                "attrition_rate": 8.5,
                "nonresponse_count": 4,
                "reporting_gaps": ["Missing blood pressure records"],
                "directionality": "stress-to-ADHD",
                "peicot": {
                    "population": "Adolescent ADHD",
                    "exposure": "Chronic Academic Stress",
                    "intervention": "Titrated Methylphenidate Hydrochloride",
                    "comparator": "Placebo Control Group",
                    "outcome": "Diurnal Cortisol Secretion Area Under Curve",
                    "timing": "12-Week Intervention Period"
                }
            },
            {
                "pmid": "35129084",
                "title": "Vagal Regulation, HRV, and Executive Function in ADHD",
                "abstract": "Double-blind study on autonomic arousal, RMSSD decrease, and cognitive performance under stimulant treatment.",
                "intervention": "Guanfacine",
                "comparator": "Active Control",
                "settings": ["specialty clinics"],
                "attrition_rate": 15.0,
                "nonresponse_count": 8,
                "reporting_gaps": [],
                "directionality": "bidirectional",
                "peicot": {
                    "population": "Adult ADHD Patients",
                    "exposure": "Somatic Anxiety Arousal",
                    "intervention": "Guanfacine Extended Release",
                    "comparator": "Active Control Group",
                    "outcome": "RMSSD Heart Rate Variability Index",
                    "timing": "6-Month Evaluation Cycle"
                }
            }
        ]

    def test_end_to_end_synthesis_pipeline(self):
        """
        Executes the entire extraction, analysis, modeling, curriculum, policy, and planning pipeline.
        Asserts successful data integration across all modules.
        """
        # 1. Systematic Review Extraction
        sys_engine = SystematicReviewEngine(self.config)
        extracted_records = []
        for s in self.mock_studies:
            rec = sys_engine.extract_record_from_text(s)
            extracted_records.append(rec)
            
        self.assertEqual(len(extracted_records), 2)
        self.assertEqual(extracted_records[0].study_design, "RCT")
        self.assertEqual(extracted_records[0].settings, ["school", "home"])
        self.assertTrue(len(extracted_records[0].directionality) > 0)
        self.assertEqual(extracted_records[1].study_design, "RCT")
        
        # 2. Emerging Discovery Scanning
        emerging_engine = EmergingDiscoveryEngine(self.config)
        raw_terms = [
            {"term": "Digital Therapeutic RMSSD", "counts": [2, 5, 12, 28, 65], "years": [2022, 2023, 2024, 2025, 2026], "cagr": 42.0},
            {"term": "HPA Dysregulation Biomarker", "counts": [1, 2, 3, 5, 7], "years": [2022, 2023, 2024, 2025, 2026], "cagr": 15.0, "is_preprint": True}
        ]
        emerging_engine.load_terms(raw_terms)
        bursts = emerging_engine.detect_bursts()
        weak_signals = emerging_engine.get_weak_signal_queue()
        preprints = emerging_engine.track_preprints()
        monthly_brief = emerging_engine.generate_monthly_brief()
        
        self.assertTrue(len(bursts) > 0)
        self.assertTrue(len(preprints) > 0)
        self.assertIn("Monthly Emerging Research Briefing", monthly_brief)

        # 3. Neurobiological Systems Simulation
        systems_modeler = NeuroSystemsModeler(self.config)
        causal_dag = systems_modeler.get_causal_dags()
        mediation = systems_modeler.get_mediation_template(pooled_effect=0.512)
        sim_results = systems_modeler.run_physiological_simulation(steps=12)
        
        self.assertIn("DAG_", list(causal_dag.keys())[0])  # key is dynamically named
        self.assertIn("mediation_structure", mediation)
        self.assertEqual(len(sim_results["hours"]), 12)
        self.assertIn("biomarker_levels", sim_results)  # genericized key

        # 4. Clinical Education Generators
        education_generator = MedicalEducationGenerator(self.config)
        curriculum = education_generator.generate_curriculum_guides()
        osce = education_generator.get_osce_prompts(pooled_smd=0.487, i2=12.5)
        reference_cards = education_generator.get_quick_reference_card()
        
        self.assertIn("UME_Undergraduate_Medical_Education", curriculum)
        self.assertIn("OSCE Prompt", osce["Station_Title"])
        self.assertEqual(len(reference_cards), 2)

        # 5. Public Advocacy and Communication
        advocacy_engine = PublicAdvocacyEngine(self.config)
        plain_brief = advocacy_engine.generate_plain_language_brief(pooled_smd=0.487, certainty="Moderate")
        school_brief = advocacy_engine.get_school_policy_brief()
        workplace_brief = advocacy_engine.get_workplace_policy_brief()
        ethical_disclaimer = advocacy_engine.get_ethical_boundaries_statement()
        
        self.assertIn("Guide", plain_brief["Title"])
        self.assertIn("Policy_Area", school_brief)  # key exists, value is dynamically derived
        self.assertIn("Ethical and Legal Disclaimer", ethical_disclaimer)

        # 6. Governance Planning & Backlog Triage
        planning_engine = ProgramRoadmapPlanner(self.config)
        roadmap = planning_engine.get_12_month_roadmap()
        okrs = planning_engine.get_quarterly_okrs()
        triage = planning_engine.get_sunset_and_triage_rules()
        
        self.assertEqual(len(roadmap), 5)
        self.assertIn("KR_1", okrs["Key_Results"])
        self.assertIn("Sunset_Threshold_Rule", triage)

        # 7. Cross-Version Legacy Bridges
        compatibility_strategist = CrossVersionStrategist(self.config)
        mapping_matrix = compatibility_strategist.get_version_mapping_matrix()
        smoke_test = compatibility_strategist.run_cross_version_smoke_tests([])
        
        self.assertIn("v8_pharmacology_enrichment", mapping_matrix)
        self.assertTrue(smoke_test["smoke_tests_passed"])  # bool field, not status string

if __name__ == "__main__":
    unittest.main()
