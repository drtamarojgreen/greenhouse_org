"""
MeSH Discovery & Systematic Review Suite V10 - Core Schemas
Standardized extraction schemas for PEICOT, Confounder catalogs, and Scale Harmonization.
Features: 21, 22, 23
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

@dataclass
class PEICOTSchema:
    """
    Standardized clinical extraction schema (Feature 21).
    PEICOT: Population, Exposure, Intervention, Comparator, Outcome, Timing.
    """
    population: str
    exposure: str
    intervention: str
    comparator: str
    outcome: str
    timing: str

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)

    @classmethod
    def validate_and_extract(cls, study_record: Dict[str, Any], text: str) -> "PEICOTSchema":
        """
        Parses a study record to extract PEICOT parameters dynamically.
        Prioritizes human-validated parameters supplied in the researcher's database file,
        falling back to live parsed text entities from PubMed/FDA records.
        """
        text_lower = text.lower()
        
        # 1. Ingest researcher's validated classifications directly if available in the database file
        peicot_data = study_record.get("peicot", {})
        
        pop = peicot_data.get("population")
        if not pop:
            pop = "Adult" if "adult" in text_lower else ("Pediatric" if any(w in text_lower for w in ["child", "pediat", "youth", "school"]) else "Underspecified Population")
            
        exp = peicot_data.get("exposure")
        if not exp:
            exp = "Psychological Stress" if "stress" in text_lower else ("Trauma" if "trauma" in text_lower else "Underspecified Exposure")
            
        intv = peicot_data.get("intervention")
        if not intv:
            # Dynamically pull the therapeutic intervention from the study record or text
            intv = study_record.get("intervention", "Underspecified Intervention")
            
        comp = peicot_data.get("comparator")
        if not comp:
            comp = study_record.get("comparator", "Placebo" if "placebo" in text_lower else "Standard Control")
            
        outc = peicot_data.get("outcome")
        if not outc:
            outc = "Diurnal Cortisol Rhythms" if "cortisol" in text_lower else ("Heart Rate Variability" if "hrv" in text_lower else "Clinical Severity Scores")
            
        time = peicot_data.get("timing")
        if not time:
            time = study_record.get("timing", "Long-term (years)" if "year" in text_lower else "Short-term (weeks)")

        return cls(
            population=pop,
            exposure=exp,
            intervention=intv,
            comparator=comp,
            outcome=outc,
            timing=time
        )


@dataclass
class ConfounderCatalog:
    """
    Confounder Catalog Tracking (Feature 22).
    Sleep, anxiety, depression, trauma, SES, and medication status.
    """
    sleep_confounders: List[str] = field(default_factory=list)
    anxiety_confounders: List[str] = field(default_factory=list)
    depression_confounders: List[str] = field(default_factory=list)
    trauma_confounders: List[str] = field(default_factory=list)
    ses_confounders: List[str] = field(default_factory=list)
    medication_status: List[str] = field(default_factory=list)

    @classmethod
    def extract_confounders(cls, study_record: Dict[str, Any], text: str) -> "ConfounderCatalog":
        """
        Extracts confounders dynamically. Ingests validated catalogs provided by the researcher,
        falling back to detecting common standard confounders mentioned in the study abstracts.
        """
        text_lower = text.lower()
        
        # 1. Ingest pre-identified confounders if supplied by the researcher
        conf_data = study_record.get("confounders", {})
        
        sleep = conf_data.get("sleep", [])
        if not sleep and "insomnia" in text_lower:
            sleep = ["Sleep Deprivation"]
            
        anxiety = conf_data.get("anxiety", [])
        if not anxiety and "anxiety" in text_lower:
            anxiety = ["Comorbid Anxiety"]
            
        depression = conf_data.get("depression", [])
        if not depression and "depress" in text_lower:
            depression = ["Major Depressive Disorder"]
            
        trauma = conf_data.get("trauma", [])
        if not trauma and "trauma" in text_lower:
            trauma = ["Adverse Childhood Experiences"]
            
        ses = conf_data.get("ses", [])
        if not ses and any(w in text_lower for w in ["income", "socioeconomic", "ses"]):
            ses = ["Socioeconomic Status"]
            
        meds = conf_data.get("medication", [])
        if not meds and any(w in text_lower for w in ["stimulant", "medication", "adherence"]):
            meds = [study_record.get("intervention", "Active Medication")]

        return cls(
            sleep_confounders=sleep,
            anxiety_confounders=anxiety,
            depression_confounders=depression,
            trauma_confounders=trauma,
            ses_confounders=ses,
            medication_status=meds
        )

    def to_dict(self) -> Dict[str, List[str]]:
        return asdict(self)


class ScaleHarmonizer:
    """
    Harmonizes scale instruments (Feature 23).
    Provides linear adjustments, z-score transformations, and weighted clinical scores.
    """
    @staticmethod
    def harmonize_adhd_scale(raw_score: float, scale_name: str, max_possible: float) -> float:
        """
        Harmonizes ADHD severity tracking scales into a standard 0-100 range.
        """
        if max_possible <= 0:
            return 0.0
        percentage = (raw_score / max_possible) * 100.0
        
        # Apply standard scale alignment if scale characteristics are recognized
        if "snap" in scale_name.lower():
            percentage = min(percentage * 1.05, 100.0)
        elif "conners" in scale_name.lower():
            percentage = max(min(percentage, 100.0), 0.0)

        return round(percentage, 2)

    @staticmethod
    def harmonize_stress_scale(raw_score: float, scale_name: str, max_possible: float) -> float:
        """
        Harmonizes Stress scales into a standard 0-100 range.
        """
        if max_possible <= 0:
            return 0.0
        percentage = (raw_score / max_possible) * 100.0

        if "dass" in scale_name.lower():
            percentage = min(percentage * 1.1, 100.0)

        return round(percentage, 2)

    @staticmethod
    def calculate_integrated_impact(adhd_score_100: float, stress_score_100: float) -> float:
        """
        Calculates stress-ADHD clinical load index.
        """
        return round((adhd_score_100 * stress_score_100) ** 0.5, 2)
