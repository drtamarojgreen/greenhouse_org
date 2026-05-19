"""
MeSH Discovery & Systematic Review Suite V10 - External API Integrator
Real-time integration client querying live NCBI PubMed (E-Utilities),
openFDA (OpenDrug), and ClinicalTrials.gov v2 REST APIs with zero dependencies.
Features: 21, 22, 23, 24, 25, 26, 27, 28
"""
import urllib.request
import urllib.parse
import json
import logging
import time
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ExternalAPIFetcher")

class ExternalAPIFetcher:
    """
    HTTP client querying authoritative biomedical APIs to dynamic clinical systems.
    """

    @staticmethod
    def query_api_safely(url: str) -> Optional[Dict[str, Any]]:
        """
        Executes HTTP GET request safely, returning parsed JSON or None if offline/error.
        """
        try:
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MeSHSuiteV10/1.0"}
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    return json.loads(response.read().decode("utf-8"))
        except Exception as e:
            if hasattr(e, "code") and e.code == 404:
                logger.debug(f"API {url} returned 404 Not Found (expected for non-pharmacological entries).")
            else:
                logger.warning(f"Failed to fetch data from API {url}: {e}")
        return None

    @classmethod
    def fetch_pubmed_metadata(cls, pmids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Queries PubMed E-Summary API dynamically to retrieve real article publication details.
        """
        if not pmids:
            return {}
        
        pmid_str = ",".join(str(p).strip() for p in pmids)
        url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={pmid_str}&retmode=json"
        
        data = cls.query_api_safely(url)
        results = {}
        
        if not data or "result" not in data:
            raise ConnectionError(f"Failed to fetch PubMed metadata from E-Utilities for PMIDs: {pmid_str}")
            
        result_map = data["result"]
        for pmid in pmids:
            pmid_s = str(pmid)
            if pmid_s in result_map:
                info = result_map[pmid_s]
                results[pmid_s] = {
                    "pmid": pmid_s,
                    "title": info.get("title", "Unknown PubMed Title"),
                    "authors": [a.get("name") for a in info.get("authors", []) if "name" in a],
                    "journal": info.get("source", "Unknown Journal"),
                    "pub_date": info.get("pubdate", "Unknown Date"),
                    "year": int(info.get("pubdate", "2026")[:4]) if info.get("pubdate") else 2026,
                    "subgroup": "Pediatric" if any(kw in (info.get("title", "") + info.get("source", "")).lower() for kw in ["child", "pediat", "youth", "school"]) else "Adult"
                }
            else:
                raise KeyError(f"PMID {pmid_s} not found in PubMed response map.")
                
        return results

    @classmethod
    def fetch_opendrug_metadata(cls, drug_name: str) -> Dict[str, Any]:
        """
        Queries the openFDA Drug Label API dynamically to fetch active warnings, indications, and ingredients.
        """
        cleaned_name = urllib.parse.quote(drug_name)
        url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:\"{cleaned_name}\"&limit=1"
        
        data = cls.query_api_safely(url)
        if not data or "results" not in data or len(data["results"]) == 0:
            raise ConnectionError(f"Failed to fetch openFDA drug label monograph for brand name: {drug_name}")
            
        drug_info = data["results"][0]
        openfda = drug_info.get("openfda", {})
        
        # Helper to extract bulleted strings safely
        def get_text_field(field_name: str) -> str:
            val = drug_info.get(field_name, [""])
            if isinstance(val, list):
                return val[0] if val else ""
            return str(val)

        return {
            "brand_name": openfda.get("brand_name", [drug_name])[0],
            "generic_name": openfda.get("generic_name", [""])[0],
            "active_ingredient": openfda.get("substance_name", [""])[0],
            "indications": get_text_field("indications_and_usage") or get_text_field("purpose") or "",
            "warnings": get_text_field("warnings") or "",
            "adverse_reactions": get_text_field("adverse_reactions") or "",
            "dosage_and_administration": get_text_field("dosage_and_administration") or ""
        }

    @classmethod
    def fetch_clinical_trials(cls, search_term: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Queries the ClinicalTrials.gov API v2 dynamically to find ongoing registered trials.
        """
        encoded_term = urllib.parse.quote(search_term)
        url = f"https://clinicaltrials.gov/api/v2/studies?query.term={encoded_term}&pageSize={limit}"
        
        data = cls.query_api_safely(url)
        trials = []
        if not data or "studies" not in data or len(data["studies"]) == 0:
            raise ConnectionError(f"Failed to fetch registered studies from ClinicalTrials.gov for term: {search_term}")
            
        for item in data["studies"]:
            protocol = item.get("protocolSection", {})
            id_info = protocol.get("identificationModule", {})
            status_info = protocol.get("statusModule", {})
            design_info = protocol.get("designModule", {})
            sponsor_info = protocol.get("sponsorCollaboratorsModule", {})
            description_info = protocol.get("descriptionModule", {})
            
            nct_id = id_info.get("nctId", "")
            title = id_info.get("officialTitle") or id_info.get("briefTitle") or ""
            status = status_info.get("overallStatus", "")
            phase = design_info.get("phases", [""])
            brief_summary = description_info.get("briefSummary", "")
            sponsor = sponsor_info.get("leadSponsor", {}).get("name", "")
            
            trials.append({
                "nct_id": nct_id,
                "title": title,
                "status": status,
                "phase": phase[0] if isinstance(phase, list) and phase else "",
                "brief_summary": (brief_summary[:180] + "...") if brief_summary else "",
                "sponsor": sponsor
            })
            
        return trials[:limit]

    @classmethod
    def fetch_clinical_conditions(cls, search_term: str, limit: int = 8) -> List[Dict[str, Any]]:
        """
        Queries the NLM Clinical Tables Search Service API dynamically to retrieve real ICD-9 codes and names.
        """
        encoded_term = urllib.parse.quote(search_term)
        url = f"https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms={encoded_term}&df=term_icd9_code,primary_name&maxList={limit}"
        
        data = cls.query_api_safely(url)
        # Expected NLM response structure: [total_count, code_ids, headers, results_list]
        # e.g., [5, ["4458", ...], null, [["558.9", "Gastroenteritis"], ...]]
        if not data or not isinstance(data, list) or len(data) < 4:
            raise ConnectionError(f"Failed to fetch clinical conditions from NLM Clinical Tables for term: {search_term}")
            
        results_list = data[3]
        if not results_list:
            raise ConnectionError(f"No clinical conditions found in NLM response for term: {search_term}")
            
        conditions = []
        for item in results_list:
            if isinstance(item, list) and len(item) >= 2:
                conditions.append({
                    "icd9_code": item[0],
                    "primary_name": item[1]
                })
        return conditions

    @classmethod
    def fetch_rxnorm_properties(cls, drug_name: str) -> Dict[str, Any]:
        """
        Queries the NLM RxNorm REST API dynamically to fetch concepts and concept properties.
        """
        encoded_name = urllib.parse.quote(drug_name)
        rxcui_url = f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={encoded_name}"
        
        data = cls.query_api_safely(rxcui_url)
        if not data or "idGroup" not in data:
            raise ConnectionError(f"Failed to fetch RxNorm ID from RxNav API for drug: {drug_name}")
            
        id_group = data["idGroup"]
        rxnorm_ids = id_group.get("rxnormId", [])
        if not rxnorm_ids:
            raise ValueError(f"No RxNorm concept ID (RxCUI) mapped for drug: {drug_name}")
            
        rxcui = rxnorm_ids[0]
        prop_url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json"
        
        prop_data = cls.query_api_safely(prop_url)
        if not prop_data or "properties" not in prop_data:
            raise ConnectionError(f"Failed to fetch RxNorm concept properties for RxCUI: {rxcui}")
            
        return prop_data["properties"]

    @classmethod
    def fetch_mesh_descriptor_for_keyword(cls, keyword: str) -> Optional[str]:
        """
        Dynamically resolves a local keyword to a MeSH descriptor ID via the MeSH RDF Lookup API.
        Enforces a strict 333ms delay to comply with NLM unauthenticated rate limits.
        """
        time.sleep(0.35)
        encoded_kw = urllib.parse.quote(keyword)
        url = f"https://id.nlm.nih.gov/mesh/lookup/descriptor?label={encoded_kw}&match=contains&limit=1"
        data = cls.query_api_safely(url)
        
        if data and isinstance(data, list) and len(data) > 0:
            resource_uri = data[0].get("resource", "")
            if resource_uri:
                return resource_uri.split("/")[-1]
        return None

    @classmethod
    def fetch_mesh_tree_numbers(cls, mesh_id: str) -> List[str]:
        """
        Fetches the tree numbers for a specific MeSH ID dynamically from the MeSH RDF Details API.
        Enforces a strict 333ms delay.
        """
        time.sleep(0.35)
        url = f"https://id.nlm.nih.gov/mesh/{mesh_id}.json"
        data = cls.query_api_safely(url)
        
        if data and isinstance(data, dict):
            tree_nums = data.get("treeNumber", [])
            # Convert list of URIs to just the tree number strings
            if isinstance(tree_nums, list):
                return [t.split("/")[-1] for t in tree_nums if isinstance(t, str)]
            elif isinstance(tree_nums, str):
                return [tree_nums.split("/")[-1]]
        return []

    @classmethod
    def fetch_pubmed_mesh_associations(cls, term: str, limit: int = 5) -> List[str]:
        """
        Dynamically queries PubMed for a specific term, retrieves the top N matching papers,
        and extracts the most frequent co-occurring MeSH headings.
        """
        import xml.etree.ElementTree as ET
        from collections import Counter
        
        time.sleep(0.35)
        encoded_term = urllib.parse.quote(term)
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={encoded_term}&retmode=json&retmax={limit}"
        
        search_data = cls.query_api_safely(search_url)
        if not search_data or "esearchresult" not in search_data:
            return []
            
        id_list = search_data["esearchresult"].get("idlist", [])
        if not id_list:
            return []
            
        time.sleep(0.35)
        pmid_str = ",".join(id_list)
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid_str}&retmode=xml"
        
        req = urllib.request.Request(fetch_url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()
                root = ET.fromstring(xml_data)
                
                mesh_counter = Counter()
                for mesh_heading in root.findall(".//MeshHeading/DescriptorName"):
                    mesh_term = mesh_heading.text
                    if mesh_term and mesh_term.lower() != term.lower():
                        mesh_counter[mesh_term] += 1
                        
                # Return the top 3 most frequent associated MeSH terms
                return [m[0] for m in mesh_counter.most_common(3)]
        except Exception as e:
            logger.warning(f"Failed to fetch or parse PubMed XML for PMIDs {pmid_str}: {e}")
            return []



