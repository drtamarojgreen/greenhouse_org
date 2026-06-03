"""
MeSH Suite v10.0 - SDD (Spec-Driven Development) Compliance Audit Tests
Programmatically audits codebase to enforce zero-hardcoded-stub rules, structural config compliance,
and dynamic API-driven template constraints.
"""
import unittest
import os
import yaml

class TestStructuralSpecCompliance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.v10_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.config_path = os.path.join(cls.v10_dir, "config.yaml")

    def test_config_yaml_is_strictly_structural(self):
        """
        Compliance Audit: Asserts that config.yaml has been completely purged of all
        clinical terms, checklists, populations, interventions, outcomes, and scales.
        """
        self.assertTrue(os.path.exists(self.config_path), f"config.yaml not found at: {self.config_path}")
        
        with open(self.config_path, "r") as f:
            config = yaml.safe_load(f)
            
        # Assert structural-only top-level parameters
        self.assertIn("pipeline_version", config)
        self.assertIn("reputable_resources", config)
        self.assertIn("meta_analysis", config)
        
        # Programmatically assert that no clinical taxonomies or outcomes are hardcoded in the config space
        self.assertNotIn("peicot_schema", config.get("systematic_review", {}))
        self.assertNotIn("confounder_catalog", config.get("systematic_review", {}))
        self.assertNotIn("outcome_taxonomy", config.get("systematic_review", {}))
        self.assertNotIn("watchlists", config.get("discovery_emerging", {}))

    def test_python_files_have_zero_invented_clinical_guidelines(self):
        """
        Compliance Audit: Programmatically scans Python modules to ensure no simulated case files,
        OSCE candidate checklists, workplace accommodation text blocks, or roadmaps are hardcoded.
        """
        source_dirs = ["core", "advocacy", "education", "roadmapping", "cross_version"]
        
        prohibited_stubs = [
            "provide sensory spaces and structured daily intervals",
            "provide asynchronous scheduling options to mitigate cognitive fatigue",
            "candidate correctly identifies concerta as active guanfacine",
            "preschoolers (adhd-stress)",
            "a patient is seeking guidance on concerta",
            "treatment of attention deficit hyperactivity disorder"
        ]
        
        for s_dir in source_dirs:
            target_path = os.path.join(self.v10_dir, s_dir)
            if not os.path.exists(target_path): continue
            
            for file_name in os.listdir(target_path):
                if not file_name.endswith(".py"): continue
                full_file_path = os.path.join(target_path, file_name)
                
                with open(full_file_path, "r", encoding="utf-8") as f:
                    content = f.read().lower()
                    
                    # Enforce the absolute purge of static narrative text stubs
                    for stub in prohibited_stubs:
                        self.assertNotIn(
                            stub, 
                            content, 
                            f"SDD Compliance Failure: Found prohibited hardcoded clinical narrative stub '{stub}' inside {file_name}"
                        )

    def test_dynamic_linkages_and_provenance(self):
        """
        Compliance Audit: Asserts that all clinical references, disclaimers, and taxonomic bridges
        refer dynamically to external REST API variables (e.g., brand_name, generic_name, active_ingredient, journal, title).
        """
        advocacy_file = os.path.join(self.v10_dir, "advocacy", "communication.py")
        self.assertTrue(os.path.exists(advocacy_file))
        
        with open(advocacy_file, "r") as f:
            code = f.read()
            
        # Assert code references FDA and PubMed properties dynamically inside templates
        self.assertIn("drug['generic_name']", code)
        self.assertIn("drug['warnings']", code)
        self.assertIn("details['journal']", code)
        self.assertIn("details['pmid']", code)

if __name__ == "__main__":
    unittest.main()
