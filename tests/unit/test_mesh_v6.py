import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os
import json
import asyncio
import aiohttp

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from scripts.research.mesh.v6.core.api_clients import DiscoveryClientV6
from scripts.research.mesh.v6.core.engine import DiscoveryEngineV6

class TestMeshV6Async(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.cache_db = "test_cache_async.db"
        self.config = {"max_concurrency": 2, "cache_db": self.cache_db}

    def tearDown(self):
        if os.path.exists(self.cache_db):
            os.remove(self.cache_db)

    @patch('aiohttp.ClientSession.get')
    async def test_api_client_pubmed(self, mock_get):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"esearchresult": {"count": "42"}})
        mock_get.return_value.__aenter__.return_value = mock_response

        client = DiscoveryClientV6(cache_db=self.cache_db)
        async with aiohttp.ClientSession() as session:
            data = await client.get_pubmed_data(session, "Depression")
            self.assertEqual(data["review_articles_count"], 42)

    def test_engine_csv_parsing(self):
        csv_path = "test_graph_async.csv"
        with open(csv_path, 'w') as f:
            f.write('"Node A",1,"[2,3]",100,1\n')
            f.write('"Node B",2,"[]",50,2\n')

        engine = DiscoveryEngineV6(self.config)
        nodes = engine.parse_graph_csv(csv_path)
        self.assertEqual(len(nodes), 2)
        self.assertEqual(nodes[0]["name"], "Node A")
        self.assertEqual(nodes[0]["composite_score"], 102) # 100 + 2 edges
        os.remove(csv_path)

    @patch('scripts.research.mesh.v6.core.api_clients.DiscoveryClientV6.get_pubmed_data', new_callable=AsyncMock)
    @patch('scripts.research.mesh.v6.core.api_clients.DiscoveryClientV6.get_clinical_trials_data', new_callable=AsyncMock)
    @patch('scripts.research.mesh.v6.core.api_clients.DiscoveryClientV6.get_fda_drugs_data', new_callable=AsyncMock)
    async def test_engine_run(self, mock_fda, mock_ct, mock_pubmed):
        mock_pubmed.return_value = {"review_articles_count": 10}
        mock_ct.return_value = {"trials_count": 5, "interventions": ["A"]}
        mock_fda.return_value = {"related_drugs": ["Drug X"]}

        csv_path = "test_graph_run_async.csv"
        with open(csv_path, 'w') as f:
            f.write('"Node A",1,"[]",100,1\n')

        engine = DiscoveryEngineV6(self.config)
        output_path = "test_output_async.json"

        await engine.run(csv_path, 1, output_path)
        self.assertTrue(os.path.exists(output_path))
        with open(output_path, 'r') as f:
            data = json.load(f)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["node_name"], "Node A")

        os.remove(csv_path)
        os.remove(output_path)

if __name__ == "__main__":
    unittest.main()
