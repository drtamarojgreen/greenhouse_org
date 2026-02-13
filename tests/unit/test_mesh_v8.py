import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os
import json
import asyncio
import aiohttp

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from scripts.research.mesh.v8.data_sources.pubmed_client import PubMedClient
from scripts.research.mesh.v8.data_sources.clinicaltrials_client import ClinicalTrialsClient
from scripts.research.mesh.v8.data_sources.opentargets_client import OpenTargetsClient
from scripts.research.mesh.v8.graph_builder import GraphBuilder

class TestMeshV8(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.cache_db = "test_cache_v8.db"

    def tearDown(self):
        if os.path.exists(self.cache_db):
            os.remove(self.cache_db)

    @patch('aiohttp.ClientSession.get')
    async def test_pubmed_client(self, mock_get):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"esearchresult": {"idlist": ["12345"]}})
        mock_get.return_value.__aenter__.return_value = mock_response

        client = PubMedClient(cache_db=self.cache_db)
        async with aiohttp.ClientSession() as session:
            pmids = await client.search_articles(session, "test")
            self.assertEqual(pmids, ["12345"])

    @patch('aiohttp.ClientSession.get')
    async def test_pubmed_xml_parsing(self, mock_get):
        xml_content = """<?xml version="1.0"?>
        <PubmedArticleSet>
            <PubmedArticle>
                <MedlineCitation>
                    <PMID>12345</PMID>
                    <Article>
                        <ArticleTitle>Test Paper</ArticleTitle>
                        <AuthorList>
                            <Author><LastName>Doe</LastName><ForeName>John</ForeName></Author>
                        </AuthorList>
                    </Article>
                </MedlineCitation>
            </PubmedArticle>
        </PubmedArticleSet>"""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=xml_content)
        mock_get.return_value.__aenter__.return_value = mock_response

        client = PubMedClient(cache_db=self.cache_db)
        async with aiohttp.ClientSession() as session:
            articles = await client.get_article_details(session, ["12345"])
            self.assertEqual(len(articles), 1)
            self.assertEqual(articles[0]["title"], "Test Paper")
            self.assertEqual(articles[0]["authors"], ["John Doe"])

    @patch('aiohttp.ClientSession.post')
    async def test_opentargets_client(self, mock_post):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "data": {
                "disease": {
                    "knownDrugs": {
                        "rows": [{"drug": {"id": "CHEMBL1", "name": "Drug1", "maximumClinicalTrialPhase": 4}}]
                    }
                }
            }
        })
        mock_post.return_value.__aenter__.return_value = mock_response

        client = OpenTargetsClient(cache_db=self.cache_db)
        async with aiohttp.ClientSession() as session:
            drugs = await client.get_drugs_for_disease(session, "EFO_1")
            self.assertEqual(len(drugs), 1)
            self.assertEqual(drugs[0]["name"], "Drug1")

    @patch('aiohttp.ClientSession.get')
    async def test_clinical_trials_client(self, mock_get):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "studies": [{
                "protocolSection": {
                    "identificationModule": {"nctId": "NCT000", "briefTitle": "Test Trial"},
                    "statusModule": {"overallStatus": "RECRUITING"},
                    "armsInterventionsModule": {"interventions": [{"name": "Drug X"}]}
                }
            }]
        })
        mock_get.return_value.__aenter__.return_value = mock_response

        client = ClinicalTrialsClient(cache_db=self.cache_db)
        async with aiohttp.ClientSession() as session:
            trials = await client.get_trials_for_disorder(session, "test")
            self.assertEqual(len(trials), 1)
            self.assertEqual(trials[0]["nct_id"], "NCT000")

    def test_graph_builder(self):
        builder = GraphBuilder()
        builder.build_from_data(
            "Alzheimer",
            [{"id": "D1", "name": "Donepezil"}],
            [{"nct_id": "NCT1", "title": "Trial 1", "interventions": ["CBT"]}],
            [{"pmid": "P1", "title": "Paper 1", "authors": ["John Doe"]}]
        )

        self.assertIn("DISORDER_ALZHEIMER", builder.nodes)
        self.assertIn("DRUG_D1", builder.nodes)
        self.assertIn("NCT1", builder.nodes)
        self.assertIn("PMID:P1", builder.nodes)

        csv_path = "test_graph_v8.csv"
        builder.export_to_csv(csv_path)
        self.assertTrue(os.path.exists(csv_path))
        os.remove(csv_path)

if __name__ == "__main__":
    unittest.main()
