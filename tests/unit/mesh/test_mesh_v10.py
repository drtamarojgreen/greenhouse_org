"""
Unit Test Suite for MeSH Discovery & Systematic Review Suite v10.0
Tests the mathematical, clinical, and infrastructure elements.
"""
import unittest
import numpy as np
import os
import sys

# Add work dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from scripts.research.mesh.v10.core.schemas import PEICOTSchema, ScaleHarmonizer
from scripts.research.mesh.v10.meta_analysis.pooling import MetaAnalysisEngine, EffectSizeConverter
from scripts.research.mesh.v10.meta_analysis.diagnostics import MetaDiagnostics
from scripts.research.mesh.v10.infrastructure.reproducibility import InfrastructureManager
from scripts.research.mesh.v10.cross_version.strategy import CrossVersionStrategist
from scripts.research.mesh.v10.neuro_modeling.systems import NeuroSystemsModeler

class TestMeshV10(unittest.TestCase):
    def setUp(self):
        self.config = {
            "systematic_review": {
                "peicot_schema": {
                    "population": ["ADHD", "Attention Deficit"],
                    "exposures": ["Stress", "Trauma"],
                    "interventions": ["Methylphenidate", "CBT"],
                    "comparators": ["Placebo", "Waitlist"],
                    "outcomes": ["Attention Span", "Cortisol"],
                    "timing": ["Short-term (weeks)", "Long-term"]
                }
            }
        }
        self.infra = InfrastructureManager(self.config)
        self.cross_ver = CrossVersionStrategist(self.config)
        self.systems = NeuroSystemsModeler(self.config)

    def test_effect_size_conversions(self):
        """
        Verifies exactness of SMD, Odds Ratio, Relative Risk conversions.
        """
        # Test OR to SMD
        smd = EffectSizeConverter.or_to_smd(2.5)
        self.assertAlmostEqual(smd, 0.505, places=3)
        
        # Test SMD to OR (inverse)
        or_back = EffectSizeConverter.smd_to_or(smd)
        self.assertAlmostEqual(or_back, 2.5, places=1)

        # Test HR to SMD
        smd_hr = EffectSizeConverter.hr_to_smd(1.8)
        self.assertAlmostEqual(smd_hr, 0.356, places=3)

    def test_peicot_schema_extraction(self):
        """
        Tests extraction of Population, Exposure, Intervention, Comparator, Outcome, Timing.
        """
        abstract = "We evaluated ADHD children exposed to severe stress compared to placebo on attention span over short-term (weeks)."
        schema = PEICOTSchema.validate_and_extract(abstract, self.config)
        
        self.assertEqual(schema.population, "ADHD")
        self.assertEqual(schema.exposure, "Stress")
        self.assertEqual(schema.intervention, "Underspecified Intervention") # CBT/Methylphenidate not in text
        self.assertEqual(schema.comparator, "Placebo")
        self.assertEqual(schema.outcome, "Attention Span")
        self.assertEqual(schema.timing, "Short-term (weeks)")

    def test_scale_harmonization(self):
        """
        Verifies standardizing clinical rating scales to 0-100 values.
        """
        # Conners raw score 35 on a 50-point max scale
        conners_harmonized = ScaleHarmonizer.harmonize_adhd_scale(35.0, "Conners Rating Scale", 50.0)
        self.assertEqual(conners_harmonized, 70.0)

        # PSS raw score 18 on a 40-point max scale
        pss_harmonized = ScaleHarmonizer.harmonize_stress_scale(18.0, "PSS-10", 40.0)
        self.assertEqual(pss_harmonized, 45.0)

        # Integrated load load calculations
        load = ScaleHarmonizer.calculate_integrated_impact(conners_harmonized, pss_harmonized)
        self.assertAlmostEqual(load, 56.12, places=2) # sqrt(70 * 45) = 56.1249

    def test_meta_pooling(self):
        """
        Asserts random-effects (DerSimonian-Laird) and fixed-effects inverse variance pooling metrics.
        """
        effects = [0.45, 0.32, 0.62, 0.51]
        variances = [0.0576, 0.0484, 0.0625, 0.0900]
        
        pool_res = MetaAnalysisEngine.pool(effects, variances, model="random-effects")
        
        self.assertIn("pooled_effect", pool_res)
        self.assertIn("ci_lower", pool_res)
        self.assertIn("ci_upper", pool_res)
        self.assertIn("I2", pool_res)
        self.assertIn("pi_lower", pool_res)
        
        # Test directionality of pooled effects (positive)
        self.assertGreater(pool_res["pooled_effect"], 0.0)
        self.assertLess(pool_res["ci_lower"], pool_res["pooled_effect"])
        self.assertGreater(pool_res["ci_upper"], pool_res["pooled_effect"])

    def test_duplicate_cohort_detection(self):
        """
        Verifies that overlapping studies from identical authors/institutions are flagged.
        """
        studies = [
            {"pmid": "1", "author": "Chen R, et al.", "institution": "Greenhouse Clinic", "sample_size": 60},
            {"pmid": "2", "author": "Chen R, et al.", "institution": "Greenhouse Clinic", "sample_size": 50},
            {"pmid": "3", "author": "Carter A, et al.", "institution": "Oakwood Medical Center", "sample_size": 120}
        ]
        dups = self.infra.detect_duplicated_cohorts(studies)
        self.assertEqual(len(dups), 1)
        self.assertEqual(dups[0]["pmid_a"], "1")
        self.assertEqual(dups[0]["pmid_b"], "2")
        self.assertEqual(dups[0]["risk_level"], "HIGH DUP_COHORT RISK")

    def test_quality_rollups(self):
        """
        Verifies Risk of Bias scoring deductions (Observational, Attrition, Selective reporting).
        """
        # Scenario 1: Perfect RCT, no attrition, no selective reporting deviation
        q1 = self.infra.calculate_quality_rollups("1", "RCT", 0.0, 0.0)
        self.assertEqual(q1["quality_score"], 100)
        self.assertEqual(q1["risk_of_bias"], "Low")

        # Scenario 2: Observational Cohort, 22% attrition, 15% selective reporting deviation
        q2 = self.infra.calculate_quality_rollups("2", "Cohort", 22.0, 15.0)
        # Deductions: 15 (Cohort) + 20 (Attrition) + 20 (Reporting Dev) = 55 points deduction
        self.assertEqual(q2["quality_score"], 45)
        self.assertEqual(q2["risk_of_bias"], "High")

    def test_diagnostics_and_corrections(self):
        """
        Verifies leave-one-out influence and Egger's regression corrections.
        """
        effects = [0.45, 0.32, 0.62, 0.51]
        variances = [0.0576, 0.0484, 0.0625, 0.0900]
        years = [2021, 2022, 2024, 2025]
        
        loo = MetaDiagnostics.run_leave_one_out(effects, variances)
        self.assertEqual(len(loo), 4)

        cum = MetaDiagnostics.run_cumulative_meta(effects, variances, years)
        self.assertEqual(len(cum), 4)
        # Last step of cumulative meta should equal overall pooled effect
        overall = MetaAnalysisEngine.pool(effects, variances, model="random-effects")
        self.assertAlmostEqual(cum[-1]["pooled_effect"], overall["pooled_effect"], places=2)

        correction = MetaDiagnostics.apply_small_study_correction(effects, variances)
        self.assertIn("egger_p_value", correction)
        self.assertIn("bias_detected", correction)

    def test_cross_version_bridges(self):
        """
        Verifies upscaling v7 degrees to systematic weights and mapping v8 trial sums.
        """
        # Test v7 network bridges
        mock_v7 = [{"node": "HPA-axis", "degree": 12}]
        bridged_v7 = self.cross_ver.apply_v7_network_bridge(mock_v7)
        self.assertEqual(bridged_v7[0]["importance_tag"], "Primary Hub")
        self.assertEqual(bridged_v7[0]["v10_systematic_weight"], 1.5)

        # Test v8 trial bridges
        mock_v8 = {
            "ADHD": [
                {"nct_id": "NCT1", "interventions": ["Methylphenidate"], "phase": ["PHASE3"]}
            ]
        }
        bridged_v8 = self.cross_ver.apply_v8_enrichment_bridge(mock_v8)
        self.assertEqual(bridged_v8["ADHD"]["total_trial_count"], 1)
        self.assertEqual(bridged_v8["ADHD"]["unique_interventions_count"], 1)

    def test_neuro_physiological_simulation(self):
        """
        Asserts HPA-axis simulation limits and stress hormone circadian rhythm outputs.
        """
        sim = self.systems.run_physiological_simulation(steps=24)
        self.assertEqual(len(sim["hours"]), 24)
        self.assertEqual(len(sim["cortisol_levels"]), 24)
        self.assertEqual(len(sim["executive_function_scores"]), 24)
        
        # Verify boundary constraints
        for c in sim["cortisol_levels"]:
            self.assertGreaterEqual(c, 1.0)
        for e in sim["executive_function_scores"]:
            self.assertLessEqual(e, 100.0)
            self.assertGreaterEqual(e, 10.0)

if __name__ == "__main__":
    unittest.main()
