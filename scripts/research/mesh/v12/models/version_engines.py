import logging
import asyncio
import json
import os
from collections import deque
from typing import Dict, Any, Set, Optional
from xml.etree import ElementTree
from .base import BaseModel
from . import register_model
from ..utils.async_pubmed_client import NativeAsyncPubMedClient
from ..utils.ct_client import NativeClinicalTrialsClient

logger = logging.getLogger(__name__)


@register_model("NativeV3Engine")
class NativeV3Engine(BaseModel):
    """
    Natively ported V3 engine: async BFS discovery + checkpointing + NLP theme extraction.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.client = NativeAsyncPubMedClient()
        self.min_count = params.get("min_count", 100)
        self.max_terms = params.get("max_terms", 20)
        self.checkpoint_path = params.get("checkpoint_path", "scripts/research/mesh/v12/checkpoint_v3.json")

    def run(self, data: Any) -> Dict[str, Any]:
        seed_term = data if isinstance(data, str) else data.get("seed_term", "Mental Health")
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, self._run_async(seed_term)).result()
        except RuntimeError:
            pass
        return asyncio.run(self._run_async(seed_term))

    async def _run_async(self, seed_term: str) -> Dict[str, Any]:
        logger.info(f"Starting V3-style async BFS discovery for: {seed_term}")
        visited = set()
        results = []
        queue = deque([seed_term])

        while queue and len(results) < self.max_terms:
            current_term = queue.popleft()
            if current_term in visited:
                continue
            visited.add(current_term)
            logger.info(f"Processing term: {current_term}")

            count = await self.client.get_publication_count(current_term)

            if count >= self.min_count:
                logger.info(f"Accepted: {current_term} ({count} publications)")
                related = await self._discover_related(current_term)
                results.append({
                    "term": current_term,
                    "count": count,
                    "related": sorted(list(related))
                })
                for r in related:
                    if r not in visited and r not in queue:
                        queue.append(r)

                # Checkpoint
                self._save_checkpoint(visited, results, list(queue))
            else:
                logger.info(f"Rejected: {current_term} ({count} < {self.min_count})")

        # NLP extraction from top 3 terms
        abstracts = []
        for r in results[:3]:
            query = f"({r['term']}[MeSH Major Topic])"
            search_data = await self.client.esearch(query, retmax=5)
            ids = search_data.get("esearchresult", {}).get("idlist", [])
            if ids:
                xml_content = await self.client.efetch(ids=ids)
                if xml_content and not isinstance(xml_content, dict):
                    try:
                        root = ElementTree.fromstring(xml_content)
                        for abstract in root.findall(".//AbstractText"):
                            if abstract.text:
                                abstracts.append(abstract.text)
                    except Exception as e:
                        logger.error(f"XML parse error: {e}")

        return results

    async def _discover_related(self, term: str) -> Set[str]:
        query = f"({term}[MeSH Major Topic:noexp])"
        search_data = await self.client.esearch(query, retmax=50)
        ids = search_data.get("esearchresult", {}).get("idlist", [])
        if not ids:
            return set()
        xml_content = await self.client.efetch(ids=ids)
        related = set()
        if xml_content and not isinstance(xml_content, dict):
            try:
                root = ElementTree.fromstring(xml_content)
                for heading in root.iter("DescriptorName"):
                    if heading.text and heading.text.lower() != term.lower():
                        related.add(heading.text)
            except Exception as e:
                logger.error(f"XML parsing error: {e}")
        generic = {"Humans", "Adult", "Male", "Female", "Middle Aged", "Aged"}
        return {t for t in related if t not in generic}

    def _save_checkpoint(self, visited, results, queue):
        try:
            os.makedirs(os.path.dirname(self.checkpoint_path), exist_ok=True)
            with open(self.checkpoint_path, 'w') as f:
                json.dump({"visited": list(visited), "results": results, "queue": queue}, f)
        except Exception:
            pass

    def fit(self, X, y): pass
    def predict(self, X): return []
    def predict_proba(self, X): return []


@register_model("NativeV5Engine")
class NativeV5Engine(BaseModel):
    """
    Natively ported V5 engine: longitudinal temporal analysis.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.client = NativeAsyncPubMedClient()
        self.start_year = params.get("start_year", 1980)
        self.end_year = params.get("end_year", 2025)
        self.interval_years = params.get("interval_years", 5)
        self.conditions = params.get("conditions", ["Depression", "Anxiety", "PTSD"])

    def run(self, data: Any) -> Dict[str, Any]:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, self._run_async()).result()
        except RuntimeError:
            pass
        return asyncio.run(self._run_async())

    async def _run_async(self) -> Dict[str, Any]:
        intervals = []
        for year in range(self.start_year, self.end_year + 1, self.interval_years):
            interval_end = min(year + self.interval_years - 1, self.end_year)
            intervals.append((year, interval_end))

        interval_labels = [f"{s}-{e}" for s, e in intervals]
        datasets = []

        for condition in self.conditions:
            counts = []
            for start, end in intervals:
                logger.info(f"Fetching counts for '{condition}' during {start}-{end}...")
                query = f"({condition}[MeSH Major Topic]) AND ({start}:{end}[PDAT])"
                search_data = await self.client.esearch(query, retmax=0)
                count = int(search_data.get("esearchresult", {}).get("count", 0))
                counts.append(count)
            datasets.append({"label": condition, "counts": counts})

        return {
            "project": "V12 Longitudinal Study (V5 mode)",
            "intervals": interval_labels,
            "datasets": datasets
        }

    def fit(self, X, y): pass
    def predict(self, X): return []
    def predict_proba(self, X): return []


@register_model("NativeV6Engine")
class NativeV6Engine(BaseModel):
    """
    Natively ported V6 engine: graph CSV processing + multi-source discovery.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.csv_path = params.get("csv_path", "docs/endpoints/graph.csv")
        self.num_nodes = params.get("top_nodes_limit", 50)

    def run(self, data: Any) -> Dict[str, Any]:
        import csv
        logger.info(f"Processing graph CSV: {self.csv_path}")
        nodes = []
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if not row or len(row) < 4:
                        continue
                    try:
                        label = row[0].strip().strip('"')
                        node_id = row[1].strip()
                        connections_str = row[2].strip()
                        weight = int(row[3].strip())
                        num_edges = 0
                        if connections_str.startswith('[') and connections_str.endswith(']'):
                            conn_list = connections_str[1:-1].split(',')
                            num_edges = len([c for c in conn_list if c.strip()])
                        nodes.append({
                            "name": label, "id": node_id, "weight": weight,
                            "num_edges": num_edges, "composite_score": num_edges + weight
                        })
                    except (ValueError, IndexError):
                        continue
        except FileNotFoundError:
            logger.error(f"Graph CSV not found at {self.csv_path}")
            return []

        sorted_nodes = sorted(nodes, key=lambda x: (x['composite_score'], x['weight']), reverse=True)
        seen = set()
        top = []
        for node in sorted_nodes:
            if node['name'] not in seen:
                top.append(node)
                seen.add(node['name'])
            if len(top) >= self.num_nodes:
                break

        return top

    def fit(self, X, y): pass
    def predict(self, X): return []
    def predict_proba(self, X): return []


@register_model("NativeV7Engine")
class NativeV7Engine(BaseModel):
    """
    Natively ported V7 engine: NetworkX graph analysis from CSV.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.csv_path = params.get("csv_path", "docs/endpoints/graph.csv")

    def run(self, data: Any) -> Dict[str, Any]:
        import ast
        import csv
        import networkx as nx

        G = nx.DiGraph()
        try:
            with open(self.csv_path, 'r', newline='', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if not row:
                        continue
                    try:
                        source_node = int(row[1])
                        target_nodes_str = row[2]
                        if target_nodes_str.strip() == '[]':
                            target_nodes = []
                        else:
                            target_nodes = ast.literal_eval(target_nodes_str)
                        G.add_node(source_node)
                        for target in target_nodes:
                            G.add_edge(source_node, int(target))
                    except (ValueError, SyntaxError, IndexError):
                        continue
        except FileNotFoundError:
            logger.error(f"CSV not found: {self.csv_path}")
            return {}

        sorted_degrees = sorted(G.degree(), key=lambda item: item[1], reverse=True)
        top_nodes = [{"node": n, "degree": d} for n, d in sorted_degrees[:50]]

        return {
            "num_nodes": G.number_of_nodes(),
            "num_edges": G.number_of_edges(),
            "density": round(nx.density(G), 4) if G.number_of_nodes() > 1 else 0,
            "top_50_nodes": top_nodes
        }

    def fit(self, X, y): pass
    def predict(self, X): return []
    def predict_proba(self, X): return []


@register_model("NativeV8Engine")
class NativeV8Engine(BaseModel):
    """
    Natively ported V8 engine: multi-source graph builder
    (DrugBank, DisGeNET, OpenTargets, ClinicalTrials, PubMed).
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.disorder = params.get("disorder", "Attention Deficit Hyperactivity Disorder")
        self.ct_client = NativeClinicalTrialsClient()
        self.pubmed = NativeAsyncPubMedClient()

    def run(self, data: Any) -> Dict[str, Any]:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, self._run_async()).result()
        except RuntimeError:
            pass
        return asyncio.run(self._run_async())

    async def _run_async(self) -> Dict[str, Any]:
        from ..utils.graph_builder import NativeGraphBuilder
        logger.info(f"Starting V8 multi-source graph building for: {self.disorder}")

        trials = await self.ct_client.get_trials(self.disorder, max_pages=2)
        logger.info(f"Fetched {len(trials)} clinical trials")

        builder = NativeGraphBuilder()
        disorder_id = f"DISORDER_{self.disorder.upper().replace(' ', '_')}"
        builder.add_node(disorder_id, self.disorder, "Disorder", weight=10.0)

        for trial in trials:
            nct_id = trial.get("nct_id")
            if not nct_id:
                continue
            builder.add_node(nct_id, (trial.get("title") or "")[:50], "ClinicalTrial", weight=3.0)
            builder.add_edge(disorder_id, nct_id)
            for intervention in trial.get("interventions", []):
                if intervention:
                    int_id = f"INT_{intervention.upper().replace(' ', '_')}"
                    builder.add_node(int_id, intervention, "Intervention", weight=2.0)
                    builder.add_edge(nct_id, int_id)

        builder.analyze()
        await self.ct_client.close()

        return {
            "disorder": self.disorder,
            "graph": builder,
            "top_nodes": builder.get_top_nodes(50),
            "num_nodes": builder.G.number_of_nodes(),
            "num_edges": builder.G.number_of_edges()
        }

    def fit(self, X, y): pass
    def predict(self, X): return []
    def predict_proba(self, X): return []


@register_model("NativeVBEngine")
class NativeVBEngine(BaseModel):
    """
    Natively ported VB engine: stdlib-only BFS discovery with depth tracking.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.max_depth = params.get("max_depth", 2)
        self.threshold = params.get("threshold", 5000)
        self.max_terms = params.get("max_terms", 20)

    def run(self, data: Any) -> Dict[str, Any]:
        import urllib.request
        import urllib.parse
        import xml.etree.ElementTree as ET

        seed = data if isinstance(data, str) else data.get("seed_term", "Mental Health")
        logger.info(f"Starting VB-style stdlib discovery: seed='{seed}', depth={self.max_depth}, threshold={self.threshold}")

        queue = deque([(seed, 0)])
        visited = set()
        accepted = []
        results = []

        while queue and len(accepted) < self.max_terms:
            term, depth = queue.popleft()
            if term in visited:
                continue
            visited.add(term)
            logger.info(f"Processing '{term}' (depth {depth})")

            # get_count
            query = urllib.parse.quote(f"({term}[MeSH Major Topic])")
            url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmode=json&retmax=0"
            try:
                with urllib.request.urlopen(url) as response:
                    data_resp = json.loads(response.read().decode())
                    count = int(data_resp.get("esearchresult", {}).get("count", 0))
            except Exception as e:
                logger.error(f"Error fetching count for {term}: {e}")
                count = 0

            import time as _time
            _time.sleep(0.4)

            if count >= self.threshold:
                logger.info(f"  -> Accepted! (Count: {count})")
                accepted.append(term)

                related = []
                if depth < self.max_depth:
                    search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax=50&sort=pub_date&retmode=json"
                    try:
                        with urllib.request.urlopen(search_url) as response:
                            search_data = json.loads(response.read().decode())
                            ids = search_data.get("esearchresult", {}).get("idlist", [])
                        if ids:
                            _time.sleep(0.4)
                            fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={','.join(ids)}&retmode=xml"
                            with urllib.request.urlopen(fetch_url) as response:
                                xml_data = response.read()
                                root = ET.fromstring(xml_data)
                            for desc in root.findall(".//DescriptorName"):
                                name = desc.text
                                if name and name.lower() != term.lower():
                                    related.append(name)
                            related = sorted(list(set(related)))
                            _time.sleep(0.4)
                            for r in related:
                                if r not in visited:
                                    queue.append((r, depth + 1))
                    except Exception as e:
                        logger.error(f"Error discovering terms for {term}: {e}")

                results.append({"term": term, "count": count, "depth": depth, "related": related[:10]})
            else:
                logger.info(f"  -> Rejected. (Count: {count})")

        return results

    def fit(self, X, y): pass
    def predict(self, X): return []
    def predict_proba(self, X): return []
