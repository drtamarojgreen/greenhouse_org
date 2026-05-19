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


