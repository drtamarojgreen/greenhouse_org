import aiohttp
import asyncio
import sqlite3
import json
import os
import logging
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class PubMedClient:
    """
    Client for PubMed E-utilities API.
    """
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, api_key: Optional[str] = None, cache_db: str = "scripts/research/mesh/v8/cache.db"):
        self.api_key = api_key or os.getenv("PUBMED_API_KEY")
        self.cache_db = cache_db
        self._init_cache()

    def _init_cache(self):
        cache_dir = os.path.dirname(self.cache_db)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        conn = sqlite3.connect(self.cache_db)
        conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
        conn.close()

    async def _fetch(self, session: aiohttp.ClientSession, endpoint: str, params: Dict, use_xml: bool = False) -> Any:
        cache_key = f"pubmed_{endpoint}_{json.dumps(params, sort_keys=True)}"

        conn = sqlite3.connect(self.cache_db)
        row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row[0]) if not use_xml else row[0]

        if self.api_key:
            params["api_key"] = self.api_key

        url = f"{self.BASE_URL}/{endpoint}"
        try:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    if use_xml:
                        data = await response.text()
                    else:
                        data = await response.json()

                    conn = sqlite3.connect(self.cache_db)
                    conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                 (cache_key, json.dumps(data) if not use_xml else data, asyncio.get_event_loop().time()))
                    conn.commit()
                    conn.close()
                    return data
                else:
                    logger.error(f"PubMed API error: {response.status}")
                    return {"error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"PubMed connection error: {e}")
            return {"error": str(e)}

    async def search_articles(self, session: aiohttp.ClientSession, query: str, retmax: int = 10) -> List[str]:
        """
        Searches for PubMed IDs matching a query.
        """
        params = {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": retmax
        }
        data = await self._fetch(session, "esearch.fcgi", params)
        if isinstance(data, dict) and "esearchresult" in data:
            return data["esearchresult"].get("idlist", [])
        return []

    async def get_article_details(self, session: aiohttp.ClientSession, pmids: List[str]) -> List[Dict]:
        """
        Fetches metadata for a list of PubMed IDs.
        """
        if not pmids:
            return []
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml"
        }
        xml_data = await self._fetch(session, "efetch.fcgi", params, use_xml=True)
        if isinstance(xml_data, dict) and "error" in xml_data:
            return []

        articles = []
        try:
            root = ET.fromstring(xml_data)
            for article in root.findall(".//PubmedArticle"):
                pmid_el = article.find(".//PMID")
                pmid = pmid_el.text if pmid_el is not None else "Unknown"
                title_el = article.find(".//ArticleTitle")
                title = title_el.text if title_el is not None else "No Title"
                authors = []
                institutions = []
                for author in article.findall(".//Author"):
                    last_name = author.find("LastName")
                    fore_name = author.find("ForeName")
                    if last_name is not None and fore_name is not None:
                        full_name = f"{fore_name.text} {last_name.text}"
                        authors.append(full_name)

                        aff_el = author.find(".//Affiliation")
                        if aff_el is not None:
                            institutions.append({
                                "author": full_name,
                                "name": aff_el.text
                            })

                articles.append({
                    "pmid": pmid,
                    "title": title,
                    "authors": authors,
                    "institutions": institutions
                })
        except Exception as e:
            logger.error(f"Error parsing PubMed XML: {e}")

        return articles
