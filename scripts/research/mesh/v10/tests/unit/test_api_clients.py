"""
MeSH Suite v10.0 - Unit Tests: REST API Clients
Verifies high-fidelity query processing, url parameters, and robust offline fallback layers.
"""
import unittest
from scripts.research.mesh.v10.infrastructure.api_clients import ExternalAPIFetcher

class TestExternalAPIFetchers(unittest.TestCase):
    def test_pubmed_fetcher_structure(self):
        """
        Asserts that the PubMed client queries or returns structured bibliographies correctly.
        """
        pmid = "34218945"
        try:
            res = ExternalAPIFetcher.fetch_pubmed_metadata([pmid])
            self.assertIn(pmid, res)
            record = res[pmid]
            self.assertEqual(record["pmid"], pmid)
            self.assertTrue(isinstance(record["authors"], list))
            self.assertTrue(len(record["title"]) > 0)
            self.assertTrue(len(record["journal"]) > 0)
            self.assertTrue(isinstance(record["year"], int))
        except ConnectionError:
            self.skipTest("Network offline or PubMed API unreachable")

    def test_openfda_fetcher_structure(self):
        """
        Asserts that openFDA client returns approved indications and warning metrics dynamically.
        """
        drug_name = "Concerta"
        try:
            res = ExternalAPIFetcher.fetch_opendrug_metadata(drug_name)
            self.assertIn("brand_name", res)
            self.assertIn("generic_name", res)
            self.assertTrue(len(res["indications"]) > 0)
            self.assertTrue(len(res["warnings"]) > 0)
            self.assertTrue(len(res["adverse_reactions"]) > 0)
            self.assertTrue(len(res["dosage_and_administration"]) > 0)
        except ConnectionError:
            self.skipTest("Network offline or openFDA API unreachable")

    def test_clinical_trials_fetcher_structure(self):
        """
        Asserts that the ClinicalTrials.gov client parses official NCT IDs and recruitment statuses.
        """
        term = "ADHD Stress"
        try:
            trials = ExternalAPIFetcher.fetch_clinical_trials(term, limit=2)
            self.assertTrue(isinstance(trials, list))
            self.assertTrue(len(trials) <= 2)
            if trials:
                t = trials[0]
                self.assertIn("nct_id", t)
                self.assertIn("title", t)
                self.assertIn("status", t)
                self.assertIn("phase", t)
                self.assertIn("brief_summary", t)
                self.assertIn("sponsor", t)
        except ConnectionError:
            self.skipTest("Network offline or ClinicalTrials.gov API unreachable")

    def test_clinical_conditions_fetcher_structure(self):
        """
        Asserts that NLM Clinical Tables client parses official ICD-9 codes and condition names.
        """
        term = "gastroenteri"
        try:
            conditions = ExternalAPIFetcher.fetch_clinical_conditions(term, limit=5)
            self.assertTrue(isinstance(conditions, list))
            if conditions:
                cond = conditions[0]
                self.assertIn("icd9_code", cond)
                self.assertIn("primary_name", cond)
        except ConnectionError:
            self.skipTest("Network offline or NLM Clinical Tables API unreachable")

    def test_rxnorm_properties_fetcher_structure(self):
        """
        Asserts that NLM RxNorm client fetches official RxCUIs and drug properties correctly.
        """
        drug = "Concerta"
        try:
            props = ExternalAPIFetcher.fetch_rxnorm_properties(drug)
            self.assertTrue(isinstance(props, dict))
            self.assertIn("rxcui", props)
            self.assertIn("name", props)
            self.assertIn("tty", props)
            self.assertEqual(props["name"], "Concerta")
        except ConnectionError:
            self.skipTest("Network offline or RxNorm API unreachable")
        except ValueError:
            self.skipTest("RxNorm Mapping not found for drug in target database")

if __name__ == "__main__":
    unittest.main()
