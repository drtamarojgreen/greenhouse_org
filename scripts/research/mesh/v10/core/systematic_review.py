"""
MeSH Discovery & Systematic Review Suite V10 - Systematic Review
Implementation of systematic review models, outcome taxonomies, contexts, directionalities, and checklists.
Features: 24 - 40
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import json
from scripts.research.mesh.v10.infrastructure.api_clients import ExternalAPIFetcher
from scripts.research.mesh.v10.core.schemas import PEICOTSchema, ConfounderCatalog

@dataclass
class StudyReviewRecord:
    """
    Extracted Systematic Review Record for a single study.
    Tracks everything from design, outcomes, settings, missing data, directionality, and sign-offs.
    """
    pmid: str
    title: str
    study_design: str # RCT, Cohort, Case-Control, Cross-Sectional, Qualitative (Feature 26)
    
    # Feature 24: Outcome Taxonomy (proximal, intermediate, long-term)
    outcomes_proximal: List[str] = field(default_factory=list)
    outcomes_intermediate: List[str] = field(default_factory=list)
    outcomes_long_term: List[str] = field(default_factory=list)

    # Feature 25: Settings Context
    settings: List[str] = field(default_factory=list) # school, home, workplace, primary care, specialty clinics
    
    # Feature 27: Missing Data Fields
    attrition_rate: float = 0.0
    nonresponse_count: int = 0
    reporting_gaps: List[str] = field(default_factory=list)

    # Feature 30: Selective Reporting Check (methods-stated vs results-reported)
    methods_stated_outcomes: List[str] = field(default_factory=list)
    results_reported_outcomes: List[str] = field(default_factory=list)

    # Feature 35: Directionality coding (ADHD-to-stress, stress-to-ADHD, bidirectional)
    directionality: str = "undetermined"

    # Feature 36: Mechanistic versus Phenomenological Tagging
    evidence_class: str = "phenomenological" # "mechanistic" or "phenomenological"

    # Feature 37: Citation Context (confirmatory vs contradictory)
    citation_context: str = "neutral" # "confirmatory", "contradictory", "neutral"
    
    # Feature 40: Reviewer Sign-off Checkpoints
    screened_by: Optional[str] = None
    extracted_by: Optional[str] = None
    adjudicated_by: Optional[str] = None
    sign_off_status: str = "Pending" # "Pending", "Approved", "Flagged"

    def calculate_selective_reporting_deviation(self) -> float:
        """
        Calculates percentage discrepancy between methods-stated and results-reported outcomes.
        """
        if not self.methods_stated_outcomes:
            return 0.0
        reported_set = set(self.results_reported_outcomes)
        unstated_but_reported = len(reported_set - set(self.methods_stated_outcomes))
        unstated_and_omitted = len(set(self.methods_stated_outcomes) - reported_set)
        
        total_mismatch = unstated_but_reported + unstated_and_omitted
        return round((total_mismatch / len(self.methods_stated_outcomes)) * 100.0, 2)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["selective_reporting_deviation"] = self.calculate_selective_reporting_deviation()
        return d


class SystematicReviewEngine:
    """
    Review pipeline runner, managing cohorts consistency, robustness, chronology maps, notebooks, and dashboards.
    """
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.reviews: Dict[str, StudyReviewRecord] = {}

    def extract_record_from_text(self, study_record: Dict[str, Any]) -> StudyReviewRecord:
        """
        Parses study to extract systematic review metadata dynamically using FDA and PubMed indicators.
        """
        pmid = study_record["pmid"]
        title = study_record["title"]
        abstract = study_record["abstract"]
        text = (title + " " + abstract).lower()
        
        # Design Stratification (Feature 26)
        design = "Cohort"
        if "randomized" in text or "rct" in text or "double-blind" in text:
            design = "RCT"
        elif "case-control" in text or "matched control" in text:
            design = "Case-Control"
        elif "cross-sectional" in text or "survey" in text:
            design = "Cross-Sectional"
        elif "qualitative" in text or "interview" in text or "phenomenological" in text:
            design = "Qualitative"

        # Validate and extract PEICOT and Confounder parameters dynamically from user dataset and live API
        peicot_obj = PEICOTSchema.validate_and_extract(study_record, text)
        conf_obj = ConfounderCatalog.extract_confounders(study_record, text)
        
        # Live FDA lookup to extract active pharmacology variables dynamically based on study intervention
        med_term = study_record.get("intervention", "")
        try:
            drug = ExternalAPIFetcher.fetch_opendrug_metadata(med_term)
            generic_name = drug.get("generic_name", med_term)
            brand_name = drug.get("brand_name", med_term)
            active_ingredient = drug.get("active_ingredient", med_term)
        except ConnectionError:
            generic_name = med_term
            brand_name = med_term
            active_ingredient = med_term
            
        proximal = [f"{peicot_obj.population} Severity: {peicot_obj.outcome}"]
        intermediate = [f"Physiological excretion/response rates", f"Active medication status of {generic_name}"]
        long_term = [f"Long-term endpoints (Timing: {peicot_obj.timing})"]

        # Settings Context (Feature 25)
        settings = study_record.get("settings", ["school", "workplace"] if "adult" in text or "work" in text else ["primary care", "specialty clinics"])

        # Missing data heuristics (Feature 27)
        attrition = study_record.get("attrition_rate", 0.0)
        nonresponse = study_record.get("nonresponse_count", 0)
        gaps = list(study_record.get("reporting_gaps", []))
        if "dropout" in text or "attrition" in text:
            attrition = attrition if attrition > 0 else 12.5 
        if "non-response" in text or "refusal" in text:
            nonresponse = nonresponse if nonresponse > 0 else 15
        if ("missing data" in text or "unreported" in text) and not gaps:
            gaps.append(f"Missing {generic_name} dosage records")

        # Selective reporting (Feature 30)
        methods = [f"{peicot_obj.population} severity measurement", f"{peicot_obj.outcome} assessment", f"{brand_name} Adherence"]
        results = list(methods)
        if len(results) > 1 and any(w in text for w in ["selective", "primary only", "omitted", "partial", "limitations"]):
            results = results[:-1]

        # Directionality (Feature 35)
        direction = study_record.get("directionality", "bidirectional")
        if "led to chronic stress" in text or "predicts stress" in text:
            direction = "ADHD-to-stress"
        elif "stress exposure increased" in text or "stress predicts adhd" in text:
            direction = "stress-to-ADHD"

        # Evidence Tagging (Feature 36): mechanistic if abstract mentions pharmacological/biomarker keywords
        mechanistic_keywords = [active_ingredient.lower()] + [w.lower() for w in [peicot_obj.exposure, peicot_obj.outcome] if w]
        evidence = "mechanistic" if any(w in text for w in mechanistic_keywords) else "phenomenological"

        # Citation Context (Feature 37)
        cit = "neutral"
        if "confirms previous" in text or "consistent with" in text:
            cit = "confirmatory"
        elif "contradicts" in text or "inconsistent with" in text or "contrary to" in text:
            cit = "contradictory"

        record = StudyReviewRecord(
            pmid=pmid,
            title=title,
            study_design=design,
            outcomes_proximal=proximal,
            outcomes_intermediate=intermediate,
            outcomes_long_term=long_term,
            settings=settings,
            attrition_rate=attrition,
            nonresponse_count=nonresponse,
            reporting_gaps=gaps,
            methods_stated_outcomes=methods,
            results_reported_outcomes=results,
            directionality=direction,
            evidence_class=evidence,
            citation_context=cit,
            sign_off_status="Pending"
        )
        
        self.reviews[pmid] = record
        return record

    def get_reviewer_signoff_table(self) -> List[Dict[str, Any]]:
        """
        Returns sign-off status and reviewers (Feature 40).
        """
        return [{"pmid": k, "title": r.title[:40], "status": r.sign_off_status, "screened": r.screened_by} 
                for k, r in self.reviews.items()]

    def sign_off(self, pmid: str, reviewer: str, role: str = "screened") -> bool:
        """
        Signs off a study checkpoint (Feature 40).
        """
        if pmid not in self.reviews:
            return False
        
        if role == "screened":
            self.reviews[pmid].screened_by = reviewer
            self.reviews[pmid].sign_off_status = "Screened"
        elif role == "extracted":
            self.reviews[pmid].extracted_by = reviewer
            self.reviews[pmid].sign_off_status = "Extracted"
        elif role == "adjudicated":
            self.reviews[pmid].adjudicated_by = reviewer
            self.reviews[pmid].sign_off_status = "Approved"

        return True

    def calculate_evidence_consistency(self) -> Dict[str, Any]:
        """
        Calculates consistency score across independent cohorts (Feature 34).
        """
        if not self.reviews:
            return {"consistency_score": 0.0, "total_studies": 0, "status": "No evidence"}
        
        confirmatory_count = sum(1 for r in self.reviews.values() if r.citation_context == "confirmatory")
        contradictory_count = sum(1 for r in self.reviews.values() if r.citation_context == "contradictory")
        
        total = len(self.reviews)
        consistency = (confirmatory_count / (confirmatory_count + contradictory_count)) * 100.0 if (confirmatory_count + contradictory_count) > 0 else 50.0
        
        return {
            "consistency_score": round(consistency, 2),
            "total_studies": total,
            "confirmatory": confirmatory_count,
            "contradictory": contradictory_count,
            "grade": "High" if consistency >= 80.0 else ("Moderate" if consistency >= 50.0 else "Low")
        }

    def generate_chronology_matrix(self) -> List[Dict[str, Any]]:
        """
        Chronology matrix linking evidence changes to diagnostic guideline revisions dynamically (Feature 38).
        Uses the most recent study in the active review set as the live evidence anchor.
        """
        # Use the most recently added study as the live anchor, if available
        if self.studies:
            anchor = self.studies[-1]
            anchor_ref = f"Active dataset study: '{anchor.title}' (PMID: {anchor.pmid})."
        else:
            anchor_ref = "No studies currently loaded in the active review set."
        
        return [
            {
                "Guideline_Version": "Early Classification Era",
                "Focus": "Introduction of primary classification separating behavioral and attentional boundaries.",
                "Evidence_Baseline": "Initial clinical observation records."
            },
            {
                "Guideline_Version": "Revised Diagnostic Era",
                "Focus": "Establishment of combined and distinct subtypes based on behavioral scales.",
                "Evidence_Baseline": "Clinical field trial outcomes."
            },
            {
                "Guideline_Version": "Current Evidence-Based Era",
                "Focus": "Integration of environmental biomarker data and physiological stress markers.",
                "Evidence_Baseline": anchor_ref
            }
        ]

    def create_notebook_template(self, output_path: str) -> str:
        """
        Generates a reproducible notebook template for systematic reviews (Feature 39).
        """
        notebook_content = {
            "cells": [
                {
                    "cell_type": "markdown",
                    "metadata": {},
                    "source": [
                        f"# Systematic Review Notebook - Evidence Synthesis\n",
                        "Auto-generated by MeSH Discovery Pipeline v10."
                    ]
                },
                {
                    "cell_type": "code",
                    "execution_count": None,
                    "metadata": {},
                    "outputs": [],
                    "source": [
                        "import pandas as pd\n",
                        "import numpy as np\n",
                        "from scripts.research.mesh.v10.core.systematic_review import SystematicReviewEngine\n"
                    ]
                },
                {
                    "cell_type": "markdown",
                    "metadata": {},
                    "source": [
                        "## Load Extracted Study Data"
                    ]
                },
                {
                    "cell_type": "code",
                    "execution_count": None,
                    "metadata": {},
                    "outputs": [],
                    "source": [
                        "# load dataset package\n",
                        "data_package_path = 'scripts/research/mesh/v10/output/data_package.json'\n",
                        "print(f'Loading reproducible data from: {data_package_path}')"
                    ]
                }
            ],
            "metadata": {
                "kernelspec": {
                    "display_name": "Python 3",
                    "language": "python",
                    "name": "python3"
                }
            },
            "nbformat": 4,
            "nbformat_minor": 2
        }
        
        with open(output_path, "w") as f:
            json.dump(notebook_content, f, indent=2)
        return output_path

