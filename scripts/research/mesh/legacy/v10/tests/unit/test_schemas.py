"""
MeSH Suite v10.0 - Unit Tests: Schemas & Harmonization
Verifies dynamic extraction of PEICOT elements, Confounders, and Scale transformations.
"""
import unittest
from scripts.research.mesh.v10.core.schemas import PEICOTSchema, ConfounderCatalog, ScaleHarmonizer

class TestSystematicReviewSchemas(unittest.TestCase):
    def test_dynamic_peicot_extraction_from_human_data(self):
        """
        Asserts that if the researcher has already reviewed and supplied PEICOT parameters
        in the study record, the schema extracts them exactly, avoiding any AI-invented assumptions.
        """
        record = {
            "pmid": "12345678",
            "title": "Custom RCT on Exercise for ADHD",
            "abstract": "This study analyzes clinical trials.",
            "peicot": {
                "population": "Adult ADHD Patients",
                "exposure": "Sedentary Lifestyle",
                "intervention": "Daily High-Intensity Interval Training",
                "comparator": "Stretching Control Group",
                "outcome": "Conners Inattention Scale Score",
                "timing": "6-Month Follow-Up"
            }
        }
        
        peicot = PEICOTSchema.validate_and_extract(record, record["title"] + " " + record["abstract"])
        
        self.assertEqual(peicot.population, "Adult ADHD Patients")
        self.assertEqual(peicot.exposure, "Sedentary Lifestyle")
        self.assertEqual(peicot.intervention, "Daily High-Intensity Interval Training")
        self.assertEqual(peicot.comparator, "Stretching Control Group")
        self.assertEqual(peicot.outcome, "Conners Inattention Scale Score")
        self.assertEqual(peicot.timing, "6-Month Follow-Up")

    def test_dynamic_peicot_extraction_fallback(self):
        """
        Asserts that if no PEICOT fields are pre-coded, the schema extracts them dynamically
        from text keywords using official API-driven indicators.
        """
        record = {
            "pmid": "87654321",
            "title": "Impact of Chronic Stress in Youth and pediatric populations",
            "abstract": "Evaluated cortisol response under academic testing stressors.",
            "intervention": "Cognitive Behavioral Therapy"
        }
        
        peicot = PEICOTSchema.validate_and_extract(record, record["title"] + " " + record["abstract"])
        
        self.assertEqual(peicot.population, "Pediatric")
        self.assertEqual(peicot.exposure, "Psychological Stress")
        self.assertEqual(peicot.intervention, "Cognitive Behavioral Therapy")
        self.assertEqual(peicot.outcome, "Diurnal Cortisol Rhythms")

    def test_confounder_catalog_extraction(self):
        """
        Asserts that confounders are parsed dynamically from the study record or abstract.
        """
        record = {
            "pmid": "9999999",
            "title": "Clinical Study on sleep deprivation and ADHD under stimulant treatment",
            "abstract": "Adjusting for socioeconomic status and baseline insomnia.",
            "confounders": {
                "sleep": ["Severe Sleep Apnea"],
                "ses": ["Low Household Income"]
            }
        }
        
        conf = ConfounderCatalog.extract_confounders(record, record["title"] + " " + record["abstract"])
        
        self.assertEqual(conf.sleep_confounders, ["Severe Sleep Apnea"])
        self.assertEqual(conf.ses_confounders, ["Low Household Income"])
        # Fallbacks dynamically parsed from text
        self.assertIn("Active Medication", conf.medication_status[0])

    def test_scale_harmonizer_transforms(self):
        """
        Asserts standard 0-100 normalization and weighting profiles of ScaleHarmonizer.
        """
        # Conners scale normalization
        val_conners = ScaleHarmonizer.harmonize_adhd_scale(35.0, "Conners Rating Scale", 50.0)
        self.assertEqual(val_conners, 70.0)
        
        # SNAP-IV normalization with alignment weight
        val_snap = ScaleHarmonizer.harmonize_adhd_scale(18.0, "SNAP-IV Scale", 20.0)
        self.assertEqual(val_snap, 94.5)  # 18/20 * 100 * 1.05 = 94.5%
        
        # DASS-Stress normalization
        val_dass = ScaleHarmonizer.harmonize_stress_scale(15.0, "DASS-Stress", 20.0)
        self.assertEqual(val_dass, 82.5)  # 15/20 * 100 * 1.1 = 82.5%

        # Impact index
        impact = ScaleHarmonizer.calculate_integrated_impact(80.0, 50.0)
        self.assertEqual(impact, 63.25)  # sqrt(80 * 50) = 63.245...

if __name__ == "__main__":
    unittest.main()
